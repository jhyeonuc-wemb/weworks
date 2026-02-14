import * as XLSX from 'xlsx-js-style';

/**
 * Export profitability analysis data to Excel
 * Creates a workbook with separate sheets for each tab
 */
export async function exportProfitabilityToExcel(
    projectId: number,
    projectName: string,
    projectCode: string
) {
    try {
        // Fetch all profitability data
        const url = `/api/profitability/${projectId}/export`;
        console.log('[Excel Export] Fetching from:', url);

        const response = await fetch(url);
        console.log('[Excel Export] Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Excel Export] Error response:', errorText);
            throw new Error(`Failed to fetch profitability data (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('[Excel Export] Data received successfully');

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Set workbook properties to hide gridlines
        if (!workbook.Workbook) workbook.Workbook = {};
        if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
        workbook.Workbook.Views[0] = { RTL: false };

        // Create standard expense sheet with proper styling
        createStandardExpenseSheet(workbook, data.standardExpense);

        // Generate filename with project info and timestamp
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `수지분석서_${projectCode}_${projectName}_${timestamp}.xlsx`;

        // Write and download the file
        XLSX.writeFile(workbook, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
}

/**
 * Create Standard Expense sheet (기준-경비)
 * Matches the Excel template styling with proper colors and structure
 */
function createStandardExpenseSheet(workbook: XLSX.WorkBook, data: any) {
    const wsData: any[][] = [];

    // Row 1: Title "[기준 경비]"
    wsData.push(['[기준 경비]', '', '', '', '', '', '']);
    // Row 2: (단위:천원)
    wsData.push(['', '', '', '', '', '', '(단위:천원)']);

    // Row 3: Headers
    wsData.push(['구분', '', '', '기준', '', '', '기준액']);

    // Add data rows
    if (data.expenses && data.expenses.length > 0) {
        data.expenses.forEach((expense: any, index: number) => {
            const isFromWorkshop = [3, 4].includes(index); // 워크샵, Kick-Off
            const isFromLocalRental = [5, 6, 7, 8].includes(index); // 지방 임차비 ~ 기타

            let row: any[];

            if (isFromLocalRental) {
                // 지방 관련 항목들: 구분 3칸 병합
                row = [
                    expense.item || '',
                    '',
                    '',
                    expense.standardDetail || '',
                    expense.inputValue !== null && expense.inputValue !== undefined ? Math.round(expense.inputValue) : '',
                    expense.calculatedValue !== null && expense.calculatedValue !== undefined ? Math.round(expense.calculatedValue) : '',
                    // 마지막 행(기타, index 8)의 기준액이 0이면 공백
                    (index === 8 && (expense.finalAmount || 0) === 0) ? '' : Math.round(expense.finalAmount || 0)
                ];
            } else if (isFromWorkshop) {
                // 워크샵, Kick-Off: 구분 2칸 병합, 기준 3칸 병합
                row = [
                    expense.item || '',
                    '',
                    expense.standardType || '',
                    expense.standardDetail || '',
                    '',
                    '',
                    Math.round(expense.finalAmount || 0)
                ];
            } else if (index === 0) {
                // 야근식대: 모든 열 표시, 병합 없음
                row = [
                    expense.item || '',
                    expense.category || '',
                    expense.standardType || '',
                    expense.standardDetail || '',
                    expense.inputValue !== null && expense.inputValue !== undefined ? Math.round(expense.inputValue) : '',
                    expense.calculatedValue !== null && expense.calculatedValue !== undefined ? Math.round(expense.calculatedValue) : '',
                    Math.round(expense.finalAmount || 0)
                ];
            } else {
                // 프로젝트부서비 (내부/외주): 기준 상세 병합 (D-F)
                row = [
                    expense.item || '',
                    expense.category || '',
                    expense.standardType || '',
                    expense.standardDetail || '',
                    '',
                    '',
                    Math.round(expense.finalAmount || 0)
                ];
            }

            wsData.push(row);
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Hide gridlines
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'][0] = { showGridLines: 0 };

    // Set column widths
    ws['!cols'] = [
        { wch: 24.5 },  // 항목 (35 * 0.7 = 24.5)
        { wch: 10 },    // 내부/외주
        { wch: 12 },    // 횟수/인
        { wch: 28 },    // 상세 (40 * 0.7 = 28)
        { wch: 12 },    // 입력값
        { wch: 12 },    // 계산값
        { wch: 15 },    // 기준액
    ];

    // Merge cells
    if (!ws['!merges']) ws['!merges'] = [];

    // Title row merged to column G
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });

    // Header row merged
    ws['!merges'].push(
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },  // "구분"
        { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } }   // "기준"
    );

    // Data rows - merge cells based on row type
    if (data.expenses && data.expenses.length > 0) {
        data.expenses.forEach((expense: any, index: number) => {
            const rowIndex = index + 3; // Data starts at row 3 (0-based)
            const isFromWorkshop = [3, 4].includes(index);
            const isFromLocalRental = [5, 6, 7, 8].includes(index);

            if (isFromLocalRental) {
                // 구분 3칸 병합
                ws['!merges']!.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 2 } });
                // 마지막 행(기타, index 8)은 기준 3칸도 병합
                if (index === 8) {
                    ws['!merges']!.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 5 } });
                }
            } else if (isFromWorkshop) {
                // 구분 2칸 병합
                ws['!merges']!.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 1 } });
                // 기준 3칸 병합
                ws['!merges']!.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 5 } });
            } else if (index !== 0) {
                // 프로젝트부서비: 기준 3칸 병합
                ws['!merges']!.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 5 } });
            }
            // 야근식대 (index 0)는 병합 없음
        });
    }

    // Apply styles
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Table area is rows 2-12 (0-indexed), which is row 3-13 in Excel (1-indexed)
    const tableStartRow = 2; // Header row
    const tableEndRow = range.e.r; // Last data row

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };

            // Determine if this cell is on the table edge
            const isTableTop = R === tableStartRow;
            const isTableBottom = R === tableEndRow;
            const isTableLeft = C === range.s.c && R >= tableStartRow && R <= tableEndRow;
            const isTableRight = C === range.e.c && R >= tableStartRow && R <= tableEndRow;

            // Title row (row 0)
            if (R === 0) {
                ws[cellAddress].s = {
                    fill: { fgColor: { rgb: "1F4E78" } },
                    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14, name: "나눔고딕" },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };
            }

            // Row 1: (단위:천원) - right aligned, no vertical borders
            else if (R === 1) {
                if (C === 6) {
                    ws[cellAddress].s = {
                        alignment: { horizontal: "right", vertical: "center" },
                        font: { sz: 10, name: "나눔고딕" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                } else {
                    ws[cellAddress].s = {
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
            }

            // Header row (row 2)
            else if (R === 2) {
                ws[cellAddress].s = {
                    fill: { fgColor: { rgb: "00CCFF" } }, // RGB(0, 204, 255)
                    font: { bold: true, sz: 10, name: "나눔고딕" },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: isTableTop ? "medium" : "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: isTableLeft ? "medium" : "thin", color: { rgb: "000000" } },
                        right: { style: isTableRight ? "medium" : "thin", color: { rgb: "000000" } }
                    }
                };
            }

            // Data rows (row 3+)
            else if (R >= 3) {
                // 기준액 column (G) - NO background color
                if (C === 6) {
                    ws[cellAddress].s = {
                        font: { bold: true, sz: 10, name: "나눔고딕" },
                        alignment: { horizontal: "right", vertical: "center" },
                        numFmt: "#,##0",
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: isTableBottom ? "medium" : "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: isTableRight ? "medium" : "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                // Numeric columns (E, F)
                else if (C === 4 || C === 5) {
                    ws[cellAddress].s = {
                        alignment: { horizontal: "center", vertical: "center" },
                        font: { sz: 10, name: "나눔고딕" },
                        numFmt: "0",
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: isTableBottom ? "medium" : "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                // First column (A) - left aligned, bold
                else if (C === 0) {
                    ws[cellAddress].s = {
                        alignment: { horizontal: "left", vertical: "center" },
                        font: { sz: 10, name: "나눔고딕", bold: true },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: isTableBottom ? "medium" : "thin", color: { rgb: "000000" } },
                            left: { style: isTableLeft ? "medium" : "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                // Fourth column (D) - left aligned
                else if (C === 3) {
                    ws[cellAddress].s = {
                        alignment: { horizontal: "left", vertical: "center" },
                        font: { sz: 10, name: "나눔고딕" },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: isTableBottom ? "medium" : "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
                // Other text columns - center aligned, bold for B and C (except 월*인, 횟수*인)
                else {
                    const isCategoryColumn = C === 1 || C === 2; // Columns B and C
                    const cellValue = ws[cellAddress].v || '';
                    const isLabel = cellValue.includes('월*인') || cellValue.includes('횟수*인');
                    const shouldBeBold = isCategoryColumn && !isLabel;

                    ws[cellAddress].s = {
                        alignment: { horizontal: "center", vertical: "center" },
                        font: { sz: 10, name: "나눔고딕", bold: shouldBeBold },
                        border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: isTableBottom ? "medium" : "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } }
                        }
                    };
                }
            }
        }
    }

    // Set row heights
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 25 };  // Title row
    ws['!rows'][2] = { hpt: 20 };  // Header row

    // Set default row height for data rows
    if (data.expenses && data.expenses.length > 0) {
        const rows = ws['!rows'] || [];
        data.expenses.forEach((expense: any, index: number) => {
            const rowIndex = index + 3;
            rows[rowIndex] = { hpt: 17.25 };
        });
        ws['!rows'] = rows;
    }

    XLSX.utils.book_append_sheet(workbook, ws, '기준-경비');
}
