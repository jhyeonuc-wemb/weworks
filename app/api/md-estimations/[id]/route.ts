import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// M/D 산정 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // 헤더 정보
    const headerResult = await query(
      `SELECT * FROM we_project_md_estimations WHERE id = $1`,
      [id]
    );

    if (headerResult.rows.length === 0) {
      return NextResponse.json({ error: 'MD estimation not found' }, { status: 404 });
    }

    const estimation = headerResult.rows[0];

    // 프로젝트 ID 검증 (요청에 projectId가 있으면 검증)
    if (projectId && estimation.project_id !== parseInt(projectId)) {
      return NextResponse.json(
        { error: 'Project ID mismatch. Cannot access estimation from different project.' },
        { status: 403 }
      );
    }

    // 난이도 선택 정보
    const difficultiesResult = await query(
      `SELECT * FROM we_project_md_estimation_difficulties WHERE md_estimation_id = $1`,
      [id]
    );

    // 분야별 적용
    const fieldCategoriesResult = await query(
      `SELECT field_category FROM we_project_md_estimation_field_categories WHERE md_estimation_id = $1`,
      [id]
    );

    // 개발 항목
    const developmentItemsResult = await query(
      `SELECT * FROM we_project_md_estimation_development_items WHERE md_estimation_id = $1 ORDER BY display_order, id`,
      [id]
    );

    // 3D 모델링 항목
    const modeling3dItemsResult = await query(
      `SELECT * FROM we_project_md_estimation_modeling_3d_items WHERE md_estimation_id = $1 ORDER BY display_order, id`,
      [id]
    );

    // P&ID 항목 (공수기준표)
    const pidItemsResult = await query(
      `SELECT * FROM we_project_md_estimation_pid_items WHERE md_estimation_id = $1 ORDER BY display_order, id`,
      [id]
    );

    console.log('[API GET] DB에서 조회한 pidItems:', {
      estimationId: id,
      count: pidItemsResult.rows.length,
      items: pidItemsResult.rows,
    });

    // 가중치 테이블은 항상 기준정보 테이블에서 조회
    // 3D 모델링 가중치 기준정보
    const modeling3dWeightsResult = await query(
      `SELECT id, content, description, weight, display_order 
       FROM we_md_modeling_3d_weights 
       WHERE is_active = true 
       ORDER BY display_order, id`
    );

    // P&ID 가중치 기준정보
    const pidWeightsResult = await query(
      `SELECT id, content, description, weight, display_order 
       FROM we_md_pid_weights 
       WHERE is_active = true 
       ORDER BY display_order, id`
    );

    // 분야별 난이도 항목 마스터 데이터
    const fieldDifficultyItemsResult = await query(
      `SELECT id, field_category, content, description, default_difficulty, display_order 
       FROM we_md_field_difficulty_items 
       WHERE is_active = true 
       ORDER BY display_order, id`
    );

    const weightTable = modeling3dWeightsResult.rows.map((row: any) => ({
      id: parseInt(row.id, 10), // 명시적으로 숫자로 변환
      item: "3D 입력 자료",
      content: row.content,
      description: row.description || '',
      weight: parseFloat(row.weight) || 1.0,
    }));

    const pidWeightTable = pidWeightsResult.rows.map((row: any) => ({
      id: parseInt(row.id, 10), // 명시적으로 숫자로 변환
      item: "전환 방식",
      content: row.content,
      description: row.description || '',
      weight: parseFloat(row.weight) || 1.0,
    }));

    const fieldDifficultyItems = fieldDifficultyItemsResult.rows.map((row: any) => ({
      id: parseInt(row.id, 10), // 명시적으로 숫자로 변환
      category: row.field_category,
      content: row.content,
      description: row.description || '',
      difficulty: parseInt(row.default_difficulty) || 0,
      weight: null,
    }));

    // M/M 계산 기준값은 modeling_3d_weights JSONB에서 가져오기
    let mmCalculationBase: number | null = null;
    if (estimation.modeling_3d_weights) {
      try {
        const parsed = typeof estimation.modeling_3d_weights === 'string'
          ? JSON.parse(estimation.modeling_3d_weights)
          : estimation.modeling_3d_weights;
        if (parsed && typeof parsed === 'object' && parsed._meta && parsed._meta.mmCalculationBase !== undefined) {
          mmCalculationBase = parseFloat(parsed._meta.mmCalculationBase) || null;
        }
      } catch (e) {
        console.error('Error parsing modeling_3d_weights for mmCalculationBase:', e);
      }
    }

    // estimation에서 JSONB 컬럼 제거 (혼동 방지)
    const { modeling_3d_weights, pid_weights, ...estimationWithoutJsonb } = estimation;

    // 최종 M/M 값 계산
    const projectDifficulty = parseFloat(estimation.project_difficulty) || 0;
    const totalDevelopmentMd = parseFloat(estimation.total_development_md) || 0;
    const totalModeling3dMd = parseFloat(estimation.total_modeling_3d_md) || 0;
    const totalPidMd = parseFloat(estimation.total_pid_md) || 0;

    // 선택된 가중치 값 가져오기
    const selectedModeling3dWeightId = estimation.selected_modeling_3d_weight_id ? parseInt(String(estimation.selected_modeling_3d_weight_id), 10) : null;
    const selectedPidWeightId = estimation.selected_pid_weight_id ? parseInt(String(estimation.selected_pid_weight_id), 10) : null;

    const selectedModeling3dWeight = weightTable.find((w: any) => w.id === selectedModeling3dWeightId);
    const selectedModeling3dWeightValue = selectedModeling3dWeight?.weight || 1.0;

    const selectedPidWeight = pidWeightTable.find((w: any) => w.id === selectedPidWeightId);
    const selectedPidWeightValue = selectedPidWeight?.weight || 1.0;

    // 최종 M/M 계산
    const mmBase = mmCalculationBase || 21; // 기본값 21
    const finalDevelopmentMm = mmBase > 0 ? (totalDevelopmentMd * projectDifficulty) / mmBase : 0;
    const finalModeling3dMm = mmBase > 0 ? (totalModeling3dMd * selectedModeling3dWeightValue) / mmBase : 0;
    const finalPidMm = mmBase > 0 ? (totalPidMd * selectedPidWeightValue) / mmBase : 0;

    console.log('[API GET] DB에서 조회한 fieldCategories:', {
      estimationId: id,
      count: fieldCategoriesResult.rows.length,
      rows: fieldCategoriesResult.rows,
      mapped: fieldCategoriesResult.rows.map((r: any) => r.field_category),
    });

    console.log('[API GET] 최종 M/M 계산:', {
      projectDifficulty,
      totalDevelopmentMd,
      totalModeling3dMd,
      totalPidMd,
      selectedModeling3dWeightValue,
      selectedPidWeightValue,
      mmCalculationBase: mmBase,
      finalDevelopmentMm,
      finalModeling3dMm,
      finalPidMm,
    });

    const responseData = {
      ...estimationWithoutJsonb,
      difficulties: difficultiesResult.rows,
      fieldCategories: fieldCategoriesResult.rows.map((r: any) => r.field_category),
      developmentItems: developmentItemsResult.rows,
      modeling3dItems: modeling3dItemsResult.rows,
      pidItems: pidItemsResult.rows,
      weightTable: weightTable,
      pidWeightTable: pidWeightTable,
      fieldDifficultyItems: fieldDifficultyItems, // 마스터 데이터 추가
      mmCalculationBase: mmCalculationBase,
      // 선택된 가중치 ID 명시적으로 포함 (숫자로 변환)
      selected_modeling_3d_weight_id: selectedModeling3dWeightId,
      selected_pid_weight_id: selectedPidWeightId,
      // 최종 M/M 값 추가
      finalDevelopmentMm: finalDevelopmentMm,
      finalModeling3dMm: finalModeling3dMm,
      finalPidMm: finalPidMm,
    };

    console.log('[API GET] 반환하는 데이터:', {
      id,
      selected_modeling_3d_weight_id: estimation.selected_modeling_3d_weight_id,
      selected_pid_weight_id: estimation.selected_pid_weight_id,
      pidItems: {
        count: pidItemsResult.rows.length,
        items: pidItemsResult.rows,
        first: pidItemsResult.rows[0]
      },
      pidWeightTable: { count: pidWeightTable.length, first: pidWeightTable[0] },
      modeling3dItems: { count: modeling3dItemsResult.rows.length, first: modeling3dItemsResult.rows[0] },
      weightTable: { count: weightTable.length, first: weightTable[0] },
      mmCalculationBase: mmCalculationBase,
    });

    // 디버깅: 실제 DB에서 가져온 값 확인
    console.log('[API GET] DB에서 직접 조회한 값:', {
      selected_modeling_3d_weight_id: estimation.selected_modeling_3d_weight_id,
      selected_pid_weight_id: estimation.selected_pid_weight_id,
      selected_modeling_3d_weight_id_type: typeof estimation.selected_modeling_3d_weight_id,
      selected_pid_weight_id_type: typeof estimation.selected_pid_weight_id,
      pidItems_count: pidItemsResult.rows.length,
      pidItems_all: pidItemsResult.rows,
    });

    return NextResponse.json({
      estimation: responseData,
    });
  } catch (error: any) {
    console.error('Error fetching MD estimation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MD estimation', message: error.message },
      { status: 500 }
    );
  }
}

// M/D 산정 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('[API PUT] 받은 데이터:', {
      id,
      selected_modeling_3d_weight_id: body.selected_modeling_3d_weight_id,
      selected_pid_weight_id: body.selected_pid_weight_id,
      selected_modeling_3d_weight_id_type: typeof body.selected_modeling_3d_weight_id,
      selected_pid_weight_id_type: typeof body.selected_pid_weight_id,
      pidItems: body.pidItems ? { count: body.pidItems.length, first: body.pidItems[0] } : null,
      pidWeightTable: body.pidWeightTable ? { count: body.pidWeightTable.length, first: body.pidWeightTable[0] } : null,
      modeling3dItems: body.modeling3dItems ? { count: body.modeling3dItems.length, first: body.modeling3dItems[0] } : null,
      weightTable: body.weightTable ? { count: body.weightTable.length, first: body.weightTable[0] } : null,
      mmCalculationBase: body.mmCalculationBase,
      difficulties: body.difficulties ? { count: body.difficulties.length, first: body.difficulties[0], all: body.difficulties } : null,
      fieldCategories: body.fieldCategories ? { count: body.fieldCategories.length, all: body.fieldCategories } : null,
    });

    // 기존 estimation 조회
    const existingEstimation = await query(
      `SELECT project_id FROM we_project_md_estimations WHERE id = $1`,
      [id]
    );

    if (existingEstimation.rows.length === 0) {
      return NextResponse.json({ error: 'MD estimation not found' }, { status: 404 });
    }

    const existingProjectId = parseInt(existingEstimation.rows[0].project_id);

    // 프로젝트 ID 검증 (요청에 project_id가 있으면 검증)
    if (body.project_id !== undefined) {
      const requestedProjectId = parseInt(body.project_id);
      // body의 project_id와 기존 estimation의 project_id가 일치해야 함
      if (existingProjectId !== requestedProjectId) {
        console.error(`Project ID mismatch: existing=${existingProjectId} (${typeof existingProjectId}), requested=${requestedProjectId} (${typeof requestedProjectId}), estimationId=${id}`);
        return NextResponse.json(
          { error: `Project ID mismatch. Cannot update estimation from different project. (Estimation belongs to project ${existingProjectId}, but request is for project ${requestedProjectId})` },
          { status: 403 }
        );
      }
    }

    // 헤더 정보 업데이트
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'status', 'common_difficulty_sum', 'field_difficulty_sum', 'project_difficulty',
      'total_development_md', 'total_modeling_3d_md', 'total_pid_md',
      'total_development_mm', 'total_modeling_3d_mm', 'total_pid_mm', 'total_mm',
      'selected_modeling_3d_weight_id', 'selected_pid_weight_id',
      'modeling_3d_weights', 'pid_weights'
    ];

    // mmCalculationBase 처리 (modeling_3d_weights JSONB에 메타데이터로 저장)
    // body.weightTable이 있으면 그것을 사용, 없으면 body.modeling_3d_weights 사용
    const weightTableToSave = body.weightTable !== undefined ? body.weightTable : (body.modeling_3d_weights !== undefined ? body.modeling_3d_weights : null);
    let modeling3dWeightsToSave: any = null;

    // weightTable이나 modeling_3d_weights가 있으면 저장
    if (weightTableToSave !== null && weightTableToSave !== undefined) {
      if (body.mmCalculationBase !== undefined) {
        // mmCalculationBase가 있으면 메타데이터와 함께 저장
        const weights = Array.isArray(weightTableToSave) ? weightTableToSave : (weightTableToSave.weights || []);
        modeling3dWeightsToSave = {
          weights: weights,
          _meta: {
            mmCalculationBase: body.mmCalculationBase
          }
        };
      } else if (Array.isArray(weightTableToSave)) {
        // 배열인 경우 그대로 저장
        modeling3dWeightsToSave = weightTableToSave;
      } else if (weightTableToSave && typeof weightTableToSave === 'object') {
        // 객체인 경우 그대로 저장 (기존 메타데이터 유지)
        modeling3dWeightsToSave = weightTableToSave;
      }
    }

    // pidWeightTable 처리 (pid_weights JSONB에 저장)
    const pidWeightTableToSave = body.pidWeightTable !== undefined ? body.pidWeightTable : (body.pid_weights !== undefined ? body.pid_weights : null);

    for (const field of allowedFields) {
      if (field === 'modeling_3d_weights' && modeling3dWeightsToSave !== null && modeling3dWeightsToSave !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(JSON.stringify(modeling3dWeightsToSave));
        paramIndex++;
      } else if (field === 'pid_weights' && pidWeightTableToSave !== null && pidWeightTableToSave !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(JSON.stringify(pidWeightTableToSave));
        paramIndex++;
      } else if (field === 'selected_modeling_3d_weight_id' || field === 'selected_pid_weight_id') {
        // 선택된 가중치 ID는 null도 저장 가능하도록 처리
        if (body[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(body[field] !== null ? body[field] : null);
          paramIndex++;
        }
      } else if (body[field] !== undefined) {
        // JSON 필드는 문자열로 변환
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updateFields.length > 0) {
      values.push(id);
      let updateQuery = `UPDATE we_project_md_estimations SET ${updateFields.join(', ')}`;

      // status가 명시적으로 변경되지 않는 경우에만 STANDBY -> IN_PROGRESS 자동 변경 적용
      if (body.status === undefined) {
        updateQuery += `, status = CASE WHEN status = 'STANDBY' THEN 'IN_PROGRESS' ELSE status END`;
      }

      updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;
      console.log('[API PUT] 실행할 쿼리:', updateQuery);
      console.log('[API PUT] 쿼리 파라미터:', values);
      await query(updateQuery, values);

      // 저장 후 확인
      const verifyResult = await query(
        `SELECT selected_modeling_3d_weight_id, selected_pid_weight_id FROM we_project_md_estimations WHERE id = $1`,
        [id]
      );
      if (verifyResult.rows.length > 0) {
        console.log('[API PUT] 저장 후 확인:', {
          selected_modeling_3d_weight_id: verifyResult.rows[0].selected_modeling_3d_weight_id,
          selected_pid_weight_id: verifyResult.rows[0].selected_pid_weight_id,
        });
      }
    }

    // M/D 산정이 완료되면 프로젝트 단계도 업데이트
    if (body.status === 'COMPLETED') {
      // 프로젝트 ID 조회
      const projectResult = await query(
        `SELECT project_id FROM we_project_md_estimations WHERE id = $1`,
        [id]
      );

      if (projectResult.rows.length > 0) {
        const projectId = projectResult.rows[0].project_id;
        // 프로젝트 상태를 md_estimation_completed로, current_phase를 vrb로 업데이트
        console.log(`[API PUT] MD Estimation completed. Updating project ${projectId} phase to vrb`);
        await query(
          `UPDATE we_projects SET status = 'md_estimation_completed', current_phase = 'vrb', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [projectId]
        );
        console.log(`[API PUT] Project ${projectId} phase updated to vrb`);
      }
    }

    // 난이도 정보 업데이트
    if (body.difficulties !== undefined) {
      console.log('[API PUT] 난이도 정보 저장 시작:', {
        estimationId: id,
        difficultiesCount: body.difficulties ? body.difficulties.length : 0,
        difficulties: body.difficulties,
      });

      // 기존 삭제 후 재삽입
      await query(
        `DELETE FROM we_project_md_estimation_difficulties WHERE md_estimation_id = $1`,
        [id]
      );

      if (body.difficulties && Array.isArray(body.difficulties) && body.difficulties.length > 0) {
        for (const diff of body.difficulties) {
          try {
            await query(
              `INSERT INTO we_project_md_estimation_difficulties 
               (md_estimation_id, difficulty_item_id, field_difficulty_item_id, selected_difficulty)
               VALUES ($1, $2, $3, $4)`,
              [id, diff.difficulty_item_id || null, diff.field_difficulty_item_id || null, diff.selected_difficulty]
            );
          } catch (error: any) {
            console.error('[API PUT] 난이도 항목 저장 실패:', {
              error: error.message,
              diff: diff,
            });
            throw error;
          }
        }
        console.log('[API PUT] 난이도 정보 저장 완료:', {
          estimationId: id,
          savedCount: body.difficulties.length,
        });
      } else {
        console.log('[API PUT] 난이도 정보가 빈 배열이므로 저장하지 않음');
      }
    } else {
      console.log('[API PUT] ⚠️ body.difficulties가 undefined');
    }

    // 분야별 적용 업데이트
    if (body.fieldCategories !== undefined) {
      console.log('[API PUT] 분야별 적용 저장 시작:', {
        estimationId: id,
        fieldCategoriesCount: body.fieldCategories ? body.fieldCategories.length : 0,
        fieldCategories: body.fieldCategories,
        fieldCategoriesType: typeof body.fieldCategories,
        isArray: Array.isArray(body.fieldCategories),
      });

      try {
        // 항상 기존 데이터 삭제 (빈 배열이어도 삭제해야 함)
        const deleteResult = await query(
          `DELETE FROM we_project_md_estimation_field_categories WHERE md_estimation_id = $1`,
          [id]
        );
        console.log('[API PUT] 분야별 적용 기존 데이터 삭제 완료:', {
          estimationId: id,
          deletedCount: deleteResult.rowCount || 0,
        });

        // 배열이고 길이가 0보다 크면 저장
        if (body.fieldCategories && Array.isArray(body.fieldCategories) && body.fieldCategories.length > 0) {
          let savedCount = 0;
          for (const category of body.fieldCategories) {
            // category 값 검증
            if (category === null || category === undefined || category === '') {
              console.warn('[API PUT] 분야별 적용 저장 스킵: 유효하지 않은 category 값:', {
                category: category,
                type: typeof category,
              });
              continue;
            }

            try {
              const categoryValue = String(category).trim();
              if (!categoryValue) {
                console.warn('[API PUT] 분야별 적용 저장 스킵: 빈 문자열 category');
                continue;
              }

              await query(
                `INSERT INTO we_project_md_estimation_field_categories (md_estimation_id, field_category)
                 VALUES ($1, $2)`,
                [id, categoryValue]
              );
              savedCount++;
              console.log('[API PUT] 분야별 적용 항목 저장됨:', {
                estimationId: id,
                category: categoryValue,
                savedCount: savedCount,
              });
            } catch (error: any) {
              console.error('[API PUT] 분야별 적용 저장 실패:', {
                error: error.message,
                errorCode: error.code,
                errorDetail: error.detail,
                errorConstraint: error.constraint,
                category: category,
                categoryType: typeof category,
                categoryValue: String(category).trim(),
                estimationId: id,
              });
              throw error;
            }
          }
          console.log('[API PUT] 분야별 적용 저장 완료:', {
            estimationId: id,
            requestedCount: body.fieldCategories.length,
            savedCount: savedCount,
          });
        } else {
          console.log('[API PUT] 분야별 적용이 빈 배열이므로 저장하지 않음 (기존 데이터는 이미 삭제됨)');
        }
      } catch (error: any) {
        console.error('[API PUT] 분야별 적용 저장 중 전체 에러:', {
          error: error.message,
          errorCode: error.code,
          errorDetail: error.detail,
          errorConstraint: error.constraint,
          estimationId: id,
          fieldCategories: body.fieldCategories,
        });
        throw error;
      }
    } else {
      console.log('[API PUT] ⚠️ body.fieldCategories가 undefined - 저장하지 않음');
    }

    // 개발 항목 업데이트
    if (body.developmentItems) {
      await query(
        `DELETE FROM we_project_md_estimation_development_items WHERE md_estimation_id = $1`,
        [id]
      );

      for (const item of body.developmentItems) {
        await query(
          `INSERT INTO we_project_md_estimation_development_items
           (md_estimation_id, development_item_id, classification, content, quantity, standard_md, calculated_md, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id,
            item.development_item_id || null,
            item.classification,
            item.content,
            item.quantity || 0,
            item.standard_md || 0,
            item.calculated_md || 0,
            item.display_order || 0,
          ]
        );
      }
    }

    // 3D 모델링 항목 업데이트
    if (body.modeling3dItems) {
      await query(
        `DELETE FROM we_project_md_estimation_modeling_3d_items WHERE md_estimation_id = $1`,
        [id]
      );

      for (const item of body.modeling3dItems) {
        await query(
          `INSERT INTO we_project_md_estimation_modeling_3d_items
           (md_estimation_id, modeling_3d_item_id, category, difficulty, quantity, base_md, calculated_md, remarks, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            item.modeling_3d_item_id || null,
            item.category,
            item.difficulty || null,
            item.quantity || 0,
            item.base_md || 0,
            item.calculated_md || 0,
            item.remarks || null,
            item.display_order || 0,
          ]
        );
      }
    }

    // P&ID 항목 업데이트
    if (body.pidItems) {
      console.log('[API PUT] P&ID 항목 저장 시작:', {
        estimationId: id,
        pidItemsCount: body.pidItems.length,
        pidItems: body.pidItems,
      });

      await query(
        `DELETE FROM we_project_md_estimation_pid_items WHERE md_estimation_id = $1`,
        [id]
      );

      for (const item of body.pidItems) {
        const insertResult = await query(
          `INSERT INTO we_project_md_estimation_pid_items
           (md_estimation_id, pid_item_id, category, quantity, base_md, calculated_md, remarks, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            id,
            item.pid_item_id || null,
            item.category,
            item.quantity || 0,
            item.base_md || 0,
            item.calculated_md || 0,
            item.remarks || null,
            item.display_order || 0,
          ]
        );
        console.log('[API PUT] P&ID 항목 저장됨:', {
          insertedId: insertResult.rows[0]?.id,
          item: item,
        });
      }

      // 저장 후 확인
      const verifyResult = await query(
        `SELECT * FROM we_project_md_estimation_pid_items WHERE md_estimation_id = $1 ORDER BY display_order, id`,
        [id]
      );
      console.log('[API PUT] P&ID 항목 저장 후 확인:', {
        estimationId: id,
        savedCount: verifyResult.rows.length,
        savedItems: verifyResult.rows,
      });
    } else {
      console.log('[API PUT] ⚠️ body.pidItems가 없음:', {
        estimationId: id,
        bodyKeys: Object.keys(body),
        hasPidItems: 'pidItems' in body,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating MD estimation:', error);
    return NextResponse.json(
      { error: 'Failed to update MD estimation', message: error.message },
      { status: 500 }
    );
  }
}

// M/D 산정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // M/D 산정 존재 확인
    const existingEstimation = await query(
      `SELECT id FROM we_project_md_estimations WHERE id = $1`,
      [id]
    );

    if (existingEstimation.rows.length === 0) {
      return NextResponse.json({ error: 'MD estimation not found' }, { status: 404 });
    }

    // M/D 산정 삭제 (CASCADE로 관련 데이터 자동 삭제)
    const sql = `DELETE FROM we_project_md_estimations WHERE id = $1 RETURNING id`;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'MD estimation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting MD estimation:', error);
    return NextResponse.json(
      { error: 'Failed to delete MD estimation', message: error.message },
      { status: 500 }
    );
  }
}
