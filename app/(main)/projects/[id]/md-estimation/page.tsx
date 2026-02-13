"use client";

import { useState, use, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Save,
  CheckCircle2,
  Calculator,
  Trash2,
  FileText,
  Table,
  Box,
  Settings,
  TrendingUp,
  List,
  Copy,
  BarChart3,
  AlertCircle,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { formatNumber, Currency, formatCurrency } from "@/lib/utils/currency";
import { AutoCalculatedField } from "@/components/AutoCalculatedField";
import { Button, Input, Dropdown, Badge, StatusDropdown } from "@/components/ui";
import { cn } from "@/lib/utils";

// 난이도 옵션
const difficultyOptions = [
  { value: 0.8, label: "하 (0.8)" },
  { value: 1.0, label: "중 (1.0)" },
  { value: 1.2, label: "상 (1.2)" },
  { value: 1.5, label: "최상 (1.5)" },
];

const scoreOptions = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];

// 개발항목 기본 데이터 (이미지 기반)
const defaultDevelopmentItems = [
  // PM
  { id: 1, classification: "PM", content: "PM/사업관리", quantity: 0, standardMd: 5, calculatedMd: 0 },
  // 개발
  { id: 2, classification: "개발", content: "개발 환경 구축 (서버 설치 포함)", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 3, classification: "개발", content: "운영 환경 구축", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 4, classification: "개발", content: "공통 (로그인, 메뉴, 권한, 레이아웃 등)", quantity: 0, standardMd: 10, calculatedMd: 0 },
  { id: 5, classification: "개발", content: "화면(컨텐츠 ≤ 5) 설계 (팝업 포함)", quantity: 0, standardMd: 2, calculatedMd: 0 },
  { id: 6, classification: "개발", content: "화면(컨텐츠 ≥ 5) 설계 (팝업 포함)", quantity: 0, standardMd: 3, calculatedMd: 0 },
  { id: 7, classification: "개발", content: "화면 개발(컨텐츠 ≤ 5) (팝업 포함)", quantity: 0, standardMd: 2, calculatedMd: 0 },
  { id: 8, classification: "개발", content: "화면 개발(컨텐츠 ≥ 5) (팝업 포함)", quantity: 0, standardMd: 3, calculatedMd: 0 },
  { id: 9, classification: "개발", content: "3D 애니메이션 (효과, 사운드)", quantity: 0, standardMd: 3, calculatedMd: 0 },
  { id: 10, classification: "개발", content: "SOP 관리", quantity: 0, standardMd: 20, calculatedMd: 0 },
  { id: 11, classification: "개발", content: "설정/보고서/통계 등", quantity: 0, standardMd: 3, calculatedMd: 0 },
  { id: 12, classification: "개발", content: "메타버스", quantity: 0, standardMd: 10, calculatedMd: 0 },
  // I/F
  { id: 13, classification: "I/F", content: "연계시스템 (분석, 설계)", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 14, classification: "I/F", content: "TIM 워커 DB to DB 등 간단", quantity: 0, standardMd: 1, calculatedMd: 0 },
  { id: 15, classification: "I/F", content: "TIM 그 외 워커", quantity: 0, standardMd: 2, calculatedMd: 0 },
  { id: 16, classification: "I/F", content: "제품 미사용 연계 개발", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 17, classification: "I/F", content: "TIM+ 워크플로우 간단", quantity: 0, standardMd: 2, calculatedMd: 0 },
  { id: 18, classification: "I/F", content: "TIM+ 워크플로우 복잡", quantity: 0, standardMd: 3, calculatedMd: 0 },
  { id: 19, classification: "I/F", content: "DB(테이블) 설계", quantity: 0, standardMd: 0.5, calculatedMd: 0 },
  // 2D디자인
  { id: 20, classification: "2D디자인", content: "공통 컨셉 디자인", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 21, classification: "2D디자인", content: "화면 디자인 (시안)", quantity: 0, standardMd: 1, calculatedMd: 0 },
  // 포탈
  { id: 22, classification: "포탈", content: "개발 환경 구축 (서버 설치 포함)", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 23, classification: "포탈", content: "운영 환경 구축", quantity: 0, standardMd: 5, calculatedMd: 0 },
  { id: 24, classification: "포탈", content: "공통 (로그인, 메뉴, 권한, 레이아웃 등)", quantity: 0, standardMd: 10, calculatedMd: 0 },
  { id: 25, classification: "포탈", content: "포탈 (보고서/통계/설정)", quantity: 0, standardMd: 2, calculatedMd: 0 },
];

// 인력구분 (세팅에서 관리, 임시 데이터)
const roleCategories = [
  { id: "PM", name: "PM", description: "프로젝트 매니저" },
  { id: "개발", name: "개발", description: "개발자" },
  { id: "설계", name: "설계", description: "시스템 설계자" },
  { id: "I/F", name: "I/F", description: "인터페이스 개발자" },
  { id: "QA", name: "QA", description: "품질 보증" },
];

// 임시 M/D 산정 목록 데이터 (실제로는 API로 가져옴)
const initialMdEstimations = [
  {
    id: 1,
    version: 1,
    projectId: "1",
    status: "completed",
    totalMd: 22,
    totalMm: 22,
    createdAt: "2024-01-15",
    createdBy: "홍길동",
  },
  {
    id: 2,
    version: 2,
    projectId: "1",
    status: "draft",
    totalMd: 25,
    totalMm: 30,
    createdAt: "2024-01-20",
    createdBy: "홍길동",
  },
];

// 임시 프로젝트 데이터 가져오기 함수
// 초기 공통 난이도 산정 항목 (DB 연동 전까지 또는 로딩 실패 시 대비용)
const INITIAL_COMMON_DIFFICULTY_ITEMS = [
  // 요구사항
  { id: 1, category: "요구사항", content: "요구사항 정의서 미제공", description: "구두/회의 중심 전달", difficulty: 2, weight: null },
  { id: 2, category: "요구사항", content: "요구사항 수시 변경 예상", description: "스펙 Freeze 어려움", difficulty: 2, weight: null },
  { id: 3, category: "요구사항", content: "고객의 IT 이해도 낮음", description: "기술적 소통 난이도 상승", difficulty: 2, weight: null },
  { id: 4, category: "요구사항", content: "고객 의사결정자 부재 또는 다수", description: "승인/결정 지연 가능성", difficulty: 2, weight: null },
  // 화면, 기능
  { id: 5, category: "화면, 기능", content: "화면 ≥ 20개", description: "CRUD 중심 화면, 팝업포함", difficulty: 3, weight: null },
  { id: 6, category: "화면, 기능", content: "업무 기능 ≥ 5개 모듈로 나눠짐", description: "업무 도메인 분리가 뚜렷함", difficulty: 1, weight: null },
  { id: 7, category: "화면, 기능", content: "사용자 정의 기능 많음", description: "워크플로우, 조건부 입력 등", difficulty: 3, weight: null },
  { id: 8, category: "화면, 기능", content: "권한, 조직별 접근 제한 포함", description: "Role-based UI 구성 필요", difficulty: 2, weight: null },
  { id: 9, category: "화면, 기능", content: "배치 프로세스 포함", description: "예약 실행, 로그처리 등 필요", difficulty: 2, weight: null },
  { id: 10, category: "화면, 기능", content: "반응형 지원", description: "반응형 지원 개발 필요", difficulty: 3, weight: null },
  { id: 11, category: "화면, 기능", content: "UI/접근성", description: "모바일 지원 포함 (앱, 웹앱)", difficulty: 3, weight: null },
  // 연계 및 외부 시스템
  { id: 12, category: "연계 및 외부 시스템", content: "외부 시스템 연계 ≥ 5개", description: "API, DB 연동 등", difficulty: 1, weight: null },
  { id: 13, category: "연계 및 외부 시스템", content: "실시간 연계 포함", description: "Webhook, Event 등", difficulty: 2, weight: null },
  { id: 14, category: "연계 및 외부 시스템", content: "레거시 시스템 연계", description: "명세 미비, 파악 난이도 ↑", difficulty: 2, weight: null },
  { id: 15, category: "연계 및 외부 시스템", content: "인증/SSO 연동 포함", description: "AD, OAuth 등", difficulty: 3, weight: null },
  // 데이터 및 보고서
  { id: 16, category: "데이터 및 보고서", content: "정형 보고서 ≥ 20건", description: "PDF/Excel 출력 등", difficulty: 1, weight: null },
  { id: 17, category: "데이터 및 보고서", content: "대용량 데이터 처리", description: "100만건 이상", difficulty: 2, weight: null },
  { id: 18, category: "데이터 및 보고서", content: "마이그레이션 포함", description: "데이터 정제/이관", difficulty: 0, weight: null },
  { id: 19, category: "데이터 및 보고서", content: "정합성 검증 포함", description: "정확도 중요", difficulty: 2, weight: null },
  // 기술 환경
  { id: 20, category: "기술 환경", content: "클라우드 환경 구축", description: "AWS, Azure 등", difficulty: 3, weight: null },
  { id: 21, category: "기술 환경", content: "Hybrid 인프라", description: "온프 + 클라우드 병행", difficulty: 0, weight: null },
  { id: 22, category: "기술 환경", content: "신규 기술 도입", description: "AI, IoT, GIS 등", difficulty: 0, weight: null },
  { id: 23, category: "기술 환경", content: "복잡한 DB (30테이블 이상)", description: "관계 정규화 + 성능 고려", difficulty: 2, weight: null },
  // 보안 및 인증
  { id: 24, category: "보안 및 인증", content: "사용자 권한 분기 3단계 이상", description: "화면별 권한 설정 필수", difficulty: 2, weight: null },
  { id: 25, category: "보안 및 인증", content: "데이터 암호화 필요", description: "전송/저장 모두 포함", difficulty: 2, weight: null },
  { id: 26, category: "보안 및 인증", content: "공공기관 보안규격 준수", description: "ISMS, CC 등 인증 요건 있음", difficulty: 3, weight: null },
  // 운영/인력관리
  { id: 27, category: "운영/인력관리", content: "납기 ≤ 2개월", description: "기간 촉박", difficulty: 0, weight: null },
  { id: 28, category: "운영/인력관리", content: "프로젝트 기간 ≥ 12개월", description: "장기 인력 유지/교체 이슈", difficulty: 3, weight: null },
  { id: 29, category: "운영/인력관리", content: "병행 프로젝트 존재", description: "일정/자원 집중 어려움", difficulty: 3, weight: null },
  { id: 30, category: "운영/인력관리", content: "개발 서버 운영", description: "운영서버 직접 반영은 어려움", difficulty: 1, weight: null },
  { id: 31, category: "운영/인력관리", content: "고객 내부 승인 절차 복잡", description: "화면마다 승인 필요", difficulty: 1, weight: null },
  { id: 32, category: "운영/인력관리", content: "주 단위 납품 일정 요구", description: "세분화된 일정 관리 필요", difficulty: 2, weight: null },
  { id: 33, category: "운영/인력관리", content: "고객사 상주 필수", description: "피로도, 업무 밀도, 팀 운영 난이도 ↑", difficulty: 2, weight: null },
  { id: 34, category: "운영/인력관리", content: "상주 위치 원거리", description: "출장, 교통, 숙소 등 추가 리스크", difficulty: 3, weight: null },
  { id: 35, category: "운영/인력관리", content: "외주 인력과의 협업 필수", description: "SI 협력사, 고객 IT팀, 프리랜서 등 협조 필요", difficulty: 3, weight: null },
  { id: 36, category: "운영/인력관리", content: "인력 교체 가능성 있음 (예: 6개월 계약)", description: "인수인계 등 중간 공백 위험 존재", difficulty: 2, weight: null },
  { id: 37, category: "운영/인력관리", content: "고객 내부 정치적 이슈 있음", description: "팀 변경 등 승인 구조 변경", difficulty: 2, weight: null },
  // 감리
  { id: 38, category: "감리", content: "감리 대상 프로젝트, 공공산출물", description: "일정금액 이상 또는 공공과제", difficulty: 3, weight: null },
  { id: 40, category: "감리", content: "감리 전담 인력 부재", description: "기존 개발팀이 대응까지 담당", difficulty: 3, weight: null },
  { id: 39, category: "감리", content: "단계별 감리 진행 (4단계 이상)", description: "분석/설계/개발/종료 감리", difficulty: 3, weight: null },
];

export default function MdEstimationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<{ id: number; name: string; currency: Currency; projectCode?: string; customerName?: string; fieldName?: string; categoryName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [mdEstimations, setMdEstimations] = useState<any[]>([]);
  const [currentEstimationId, setCurrentEstimationId] = useState<number | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [isNewEstimation, setIsNewEstimation] = useState(false);

  // 기준정보 테이블에서 가중치 데이터 로드
  useEffect(() => {
    const loadMasterWeights = async () => {
      try {
        // 3D 모델링 가중치 기준정보 로드
        const modeling3dResponse = await fetch('/api/md-weights/modeling-3d');
        if (modeling3dResponse.ok) {
          const modeling3dData = await modeling3dResponse.json();
          if (modeling3dData.weights && modeling3dData.weights.length > 0) {
            // 기준정보 테이블의 데이터로 초기화 (기존에 저장된 데이터가 없을 때만)
            setWeightTable((prev) => {
              // 저장된 데이터가 있으면 유지, 없으면 기준정보로 초기화
              if (prev.length === 0 || prev.every(w => !w.content && !w.description)) {
                return modeling3dData.weights.map((w: any) => ({
                  id: w.id,
                  item: "3D 입력 자료",
                  content: w.content,
                  weight: w.weight,
                  description: w.description,
                }));
              }
              return prev;
            });
          }
        }

        // P&ID 가중치 기준정보 로드
        const pidResponse = await fetch('/api/md-weights/pid');
        if (pidResponse.ok) {
          const pidData = await pidResponse.json();
          if (pidData.weights && pidData.weights.length > 0) {
            // 기준정보 테이블의 데이터로 초기화 (기존에 저장된 데이터가 없을 때만)
            setPidWeightTable((prev) => {
              // 저장된 데이터가 있으면 유지, 없으면 기준정보로 초기화
              if (prev.length === 0 || prev.every(w => !w.content && !w.description)) {
                return pidData.weights.map((w: any) => ({
                  id: w.id,
                  item: "전환 방식",
                  content: w.content,
                  weight: w.weight,
                  description: w.description,
                }));
              }
              return prev;
            });
          }
        }

        // 공통 난이도 항목 마스터 데이터 로드
        const difficultyResponse = await fetch('/api/md-weights/difficulty-items');
        if (difficultyResponse.ok) {
          const difficultyData = await difficultyResponse.json();
          if (difficultyData.items && difficultyData.items.length > 0) {
            setCommonDifficultyItems(difficultyData.items);

            // 신규 자동 생성 시 디폴트 난이도 세팅
            setSelectedDifficultyItems(prev => {
              const next = { ...prev };
              difficultyData.items.forEach((item: any) => {
                if (next[item.id] === undefined) {
                  next[item.id] = item.difficulty;
                }
              });
              return next;
            });
          }
        }

        // 분야별 난이도 항목 마스터 데이터 로드 (새 작성 모드용)
        const fieldDifficultyResponse = await fetch('/api/md-weights/field-difficulty-items');
        if (fieldDifficultyResponse.ok) {
          const fieldDifficultyData = await fieldDifficultyResponse.json();
          if (fieldDifficultyData.items && fieldDifficultyData.items.length > 0) {
            // 저장된 데이터가 없을 때만 마스터 데이터로 초기화
            setFieldDifficultyItems((prev) => {
              if (prev.length === 0) {
                // ID 기준 중복 제거
                const uniqueItems = fieldDifficultyData.items.filter((item: any, index: number, self: any[]) =>
                  index === self.findIndex((t) => t.id === item.id)
                );

                // 신규 자동 생성 시 디폴트 난이도 세팅 (사이드 이펙트 처리)
                setTimeout(() => {
                  setSelectedFieldDifficultyItems(prevSelected => {
                    const next = { ...prevSelected };
                    uniqueItems.forEach((item: any) => {
                      // 기존에 선택된 값이 없으면 마스터 데이터의 디폴트값(item.difficulty) 할당
                      if (next[item.id] === undefined) {
                        next[item.id] = item.difficulty;
                      }
                    });
                    return next;
                  });
                }, 0);

                return uniqueItems;
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Error loading master weights:", error);
      }
    };

    loadMasterWeights();
  }, []);

  // 프로젝트 정보 및 M/D 산정 목록 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 프로젝트 정보 불러오기
        const projectResponse = await fetch(`/api/projects/${id}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProject({
            id: projectData.project.id,
            name: projectData.project.name,
            projectCode: projectData.project.project_code,
            customerName: projectData.project.customer_name || "미지정",
            currency: (projectData.project.currency || "KRW") as Currency,
            fieldName: projectData.project.field_name,
            categoryName: projectData.project.category_name,
          });
        }

        // M/D 산정 목록 불러오기 (현재 프로젝트만)
        const estimationsResponse = await fetch(`/api/md-estimations?projectId=${id}`);
        if (estimationsResponse.ok) {
          const estimationsData = await estimationsResponse.json();
          console.log('[INIT] API 응답:', {
            projectId: id,
            'API URL': `/api/md-estimations?projectId=${id}`,
            '응답 데이터': estimationsData,
            'estimations 배열': estimationsData.estimations,
            'estimations 개수': estimationsData.estimations?.length || 0,
            '각 산정의 project_id': estimationsData.estimations?.map((est: any) => ({ id: est.id, project_id: est.project_id, status: est.status, version: est.version })) || []
          });

          // 프로젝트 ID로 한 번 더 필터링 (안전장치)
          const currentProjectId = parseInt(id, 10);
          const filteredEstimations = (estimationsData.estimations || []).filter(
            (est: any) => {
              // project_id를 명시적으로 숫자로 변환해서 비교
              const estProjectId = typeof est.project_id === 'string' ? parseInt(est.project_id, 10) : est.project_id;
              const matches = estProjectId === currentProjectId;
              if (!matches) {
                console.log('[INIT] 필터링 제외:', {
                  estimationId: est.id,
                  estimationProjectId: est.project_id,
                  estimationProjectId_parsed: estProjectId,
                  currentProjectId: currentProjectId,
                  '타입 비교': typeof est.project_id === typeof currentProjectId,
                  '값 비교': estProjectId === currentProjectId
                });
              }
              return matches;
            }
          );

          console.log('[INIT] 필터링 결과:', {
            '필터링 전 개수': estimationsData.estimations?.length || 0,
            '필터링 후 개수': filteredEstimations.length,
            '필터링된 산정': filteredEstimations.map((est: any) => ({ id: est.id, project_id: est.project_id, status: est.status, version: est.version }))
          });

          setMdEstimations(filteredEstimations);
          // standby 또는 in_progress 상태의 산정이 있으면 그것을 선택, 없으면 완료된 최신 산정 선택
          const draftEstimation = filteredEstimations.find((est: any) => est.status === 'STANDBY' || est.status === 'IN_PROGRESS');
          if (draftEstimation) {
            console.log('[INIT] 작성 중 산정 선택:', { id: draftEstimation.id, type: typeof draftEstimation.id });
            setCurrentEstimationId(draftEstimation.id);
            setIsNewEstimation(false);
          } else if (filteredEstimations.length > 0) {
            // 완료된 산정 중 최신 버전 선택
            const completedEstimations = filteredEstimations
              .filter((est: any) => est.status === 'COMPLETED')
              .sort((a: any, b: any) => b.version - a.version);
            if (completedEstimations.length > 0) {
              console.log('[INIT] 완료된 산정 선택:', { id: completedEstimations[0].id, type: typeof completedEstimations[0].id });
              setCurrentEstimationId(completedEstimations[0].id);
            } else {
              console.log('[INIT] 첫 번째 산정 선택:', { id: filteredEstimations[0].id, type: typeof filteredEstimations[0].id });
              setCurrentEstimationId(filteredEstimations[0].id);
            }
            setIsNewEstimation(false);
          } else {
            console.log('[INIT] 산정 없음 - 새 작성 모드', {
              'API 응답 개수': estimationsData.estimations?.length || 0,
              '필터링 후 개수': filteredEstimations.length,
              '프로젝트 ID': id,
              '프로젝트 ID 타입': typeof id
            });
            setCurrentEstimationId(null);
            setIsNewEstimation(true);
          }
        } else {
          console.error('[INIT] API 응답 실패:', {
            status: estimationsResponse.status,
            statusText: estimationsResponse.statusText,
            'API URL': `/api/md-estimations?projectId=${id}`
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 프로젝트 난이도는 calculateDifficulty() 함수로 계산됨



  // 공통 난이도 산정 항목
  const [commonDifficultyItems, setCommonDifficultyItems] = useState(INITIAL_COMMON_DIFFICULTY_ITEMS);

  // 선택된 난이도 항목 (각 항목별로 난이도 값 선택) - 공통 난이도는 디폴트로 모두 2로 초기화
  const [selectedDifficultyItems, setSelectedDifficultyItems] = useState<Record<number, number>>(
    INITIAL_COMMON_DIFFICULTY_ITEMS.reduce((acc, item) => {
      acc[item.id] = item.difficulty; // 각 항목의 기본 난이도 값으로 초기화
      return acc;
    }, {} as Record<number, number>)
  );

  // 분야별 난이도 산정 항목 (마스터 데이터 - API에서 로드)
  const [fieldDifficultyItems, setFieldDifficultyItems] = useState<Array<{
    id: number;
    category: string;
    content: string;
    description: string;
    difficulty: number;
    weight: null;
  }>>([]);

  // 선택된 분야별 난이도 항목 (각 항목별로 난이도 값 선택)
  const [selectedFieldDifficultyItems, setSelectedFieldDifficultyItems] = useState<Record<number, number>>({});

  // 선택된 분야 카테고리 (다중 선택 가능)
  const [selectedFieldCategories, setSelectedFieldCategories] = useState<Set<string>>(new Set());

  // 난이도 계산 - useMemo로 최적화 (selectedDifficultyItems, selectedFieldCategories, selectedFieldDifficultyItems 변경 시에만 재계산)
  const calculatedDifficulty = useMemo(() => {
    // 공통 난이도 합계 (선택된 난이도 값이 있으면 그 값을, 없으면 항목의 기본 난이도 값을 사용)
    const commonTotal = commonDifficultyItems.reduce(
      (sum, item) => sum + (selectedDifficultyItems[item.id] ?? item.difficulty),
      0
    );

    // 선택된 분야의 모든 항목
    const selectedFieldItems = fieldDifficultyItems.filter((item) => selectedFieldCategories.has(item.category));

    // 분야별 난이도 합계 (선택된 분야의 모든 항목에 대해, 선택된 난이도 값이 있으면 그 값을, 없으면 항목의 기본 난이도 값을 사용)
    const fieldTotal = selectedFieldItems.reduce(
      (sum, item) => sum + (selectedFieldDifficultyItems[item.id] ?? item.difficulty),
      0
    );

    // 공통 난이도 개수
    const commonItemCount = commonDifficultyItems.length;

    // 선택된 분야의 모든 항목 개수
    const selectedFieldItemCount = selectedFieldItems.length;

    // 최종 난이도 계산: (공통난이도합계 + 선택분야난이도합계) / ((공통난이도개수 + 선택난이도개수) * 2)
    const totalItemCount = commonItemCount + selectedFieldItemCount;
    if (totalItemCount > 0) {
      return (commonTotal + fieldTotal) / (totalItemCount * 2);
    } else {
      return 0;
    }
  }, [commonDifficultyItems, selectedDifficultyItems, selectedFieldCategories, selectedFieldDifficultyItems, fieldDifficultyItems]);

  // 렌더링을 위한 정렬된 항목 (Category 기준으로 정렬하여 rowSpan 오동작 방지)
  const sortedCommonDifficultyItems = useMemo(() => {
    return [...commonDifficultyItems].sort((a, b) => {
      // 카테고리 정렬
      const catDiff = a.category.localeCompare(b.category);
      if (catDiff !== 0) return catDiff;
      // 카테고리 내에서는 ID 정렬 (안정성을 위해)
      return a.id - b.id;
    });
  }, [commonDifficultyItems]);

  const sortedFieldDifficultyItems = useMemo(() => {
    return [...fieldDifficultyItems].sort((a, b) => {
      const catDiff = a.category.localeCompare(b.category);
      if (catDiff !== 0) return catDiff;
      return a.id - b.id;
    });
  }, [fieldDifficultyItems]);

  // 카테고리별 아이템 개수 계산 (rowSpan용)
  const commonCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    commonDifficultyItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [commonDifficultyItems]);

  const fieldCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fieldDifficultyItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [fieldDifficultyItems]);

  // 공통 난이도 항목 난이도 선택 핸들러 - useCallback으로 최적화
  const handleDifficultyItemChange = useCallback((itemId: number, difficulty: number) => {
    setSelectedDifficultyItems((prev) => ({ ...prev, [itemId]: difficulty }));
  }, []);

  // 분야별 난이도 항목 난이도 선택 핸들러 - useCallback으로 최적화
  const handleFieldDifficultyItemChange = useCallback((itemId: number, difficulty: number) => {
    setSelectedFieldDifficultyItems((prev) => ({ ...prev, [itemId]: difficulty }));
  }, []);

  // 분야 카테고리 선택/해제 핸들러 - useCallback으로 최적화
  const handleFieldCategoryToggle = useCallback((category: string) => {
    setSelectedFieldCategories((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(category)) {
        newSelected.delete(category);
      } else {
        newSelected.add(category);
      }
      return newSelected;
    });
  }, []);

  // 카테고리별로 그룹화 (공통) - useMemo로 최적화 (commonDifficultyItems는 상수이므로 dependency 없음)
  const commonDifficultyByCategory = useMemo(
    () =>
      commonDifficultyItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof commonDifficultyItems>),
    []
  );

  // 카테고리별로 그룹화 (분야별) - useMemo로 최적화
  const fieldDifficultyByCategory = useMemo(
    () =>
      fieldDifficultyItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof fieldDifficultyItems>),
    [fieldDifficultyItems]
  );

  // 개발항목별 M/D 산정
  const [developmentItems, setDevelopmentItems] = useState(
    defaultDevelopmentItems.map((item) => ({
      ...item,
      calculatedMd: (item.quantity || 0) * item.standardMd, // M/D = 수량 × 기준M/D
    }))
  );

  // M/D 산정 가중치 테이블 (백데이터, 추가 가능)
  const defaultWeightTable = [
    {
      id: 1,
      item: "3D 입력 자료",
      content: "모델링 제공",
      weight: 0.1,
      description: "배치 등",
    },
    {
      id: 2,
      item: "3D 입력 자료",
      content: "CAD 도면 제공",
      weight: 1.0,
      description: "DWG/IFC 등 정합성 양호",
    },
    {
      id: 3,
      item: "3D 입력 자료",
      content: "CAD 일부 + 사진 병행",
      weight: 1.15,
      description: "누락 도면 보완 필요",
    },
    {
      id: 4,
      item: "3D 입력 자료",
      content: "사진/실측 제공",
      weight: 1.3,
      description: "3D 모델링을 사진 기반 추정",
    },
    {
      id: 5,
      item: "3D 입력 자료",
      content: "실측 필요",
      weight: 1.5,
      description: "현장 실측 → 모델화",
    },
  ];

  const [weightTable, setWeightTable] = useState(defaultWeightTable);
  const [selectedWeightId, setSelectedWeightId] = useState<number | null>(null);

  // 3D 모델링 공수 기준표 (백데이터)
  const defaultModeling3dRateTable = [
    // 부지
    { id: 1, category: "부지", difficulty: "", quantity: 1, baseMd: 1, remarks: "대형 복합건물, 곡면/비정형 파사드" },
    // 건물
    { id: 2, category: "건물", difficulty: "상", quantity: 1, baseMd: 1, remarks: "대형 복합건물, 곡면/비정형 파사드" },
    { id: 3, category: "건물", difficulty: "중", quantity: 30, baseMd: 0.5, remarks: "중고층 건물, 입면 구성 다양" },
    { id: 4, category: "건물", difficulty: "하", quantity: 0.3, baseMd: 0, remarks: "단층 건물, 구성요소 적음, 대칭구조" },
    // 층
    { id: 5, category: "층", difficulty: "상", quantity: 0.5, baseMd: 0, remarks: "바닥 단차, 복잡 평면 구조" },
    { id: 6, category: "층", difficulty: "중", quantity: 100, baseMd: 0.3, remarks: "다소 복잡한 평면 구조" },
    { id: 7, category: "층", difficulty: "하", quantity: 0.2, baseMd: 0, remarks: "단순한 평면구조" },
    // 설비/장비
    { id: 8, category: "설비/장비", difficulty: "상", quantity: 2, baseMd: 0, remarks: "중대형 설비, 배관등 구조 복잡(보일러, 터빈 등)" },
    { id: 9, category: "설비/장비", difficulty: "중", quantity: 1000, baseMd: 0.5, remarks: "중형 설비" },
    { id: 10, category: "설비/장비", difficulty: "하", quantity: 0.2, baseMd: 0, remarks: "박스 형태, 디테일 적음" },
    { id: 11, category: "설비/장비", difficulty: "중복", quantity: 300, baseMd: 0.1, remarks: "중복 사용 (배치 필요)" },
    // 캐릭터
    { id: 12, category: "캐릭터", difficulty: "", quantity: 2, baseMd: 5, remarks: "메타버스" },
  ];

  // 3D 모델링 항목 (공수 기준표 기반)
  const [modeling3dItems, setModeling3dItems] = useState(
    defaultModeling3dRateTable.map((item) => ({
      ...item,
      quantity: item.quantity, // 기본 수량
      baseMd: item.baseMd, // 기준 M/D (수정 가능)
      calculatedMd: item.quantity * item.baseMd, // 산정 M/D = 수량 × 기준M/D
    }))
  );

  // P&ID 가중치 테이블 (백데이터, 추가 가능)
  const defaultPidWeightTable = [
    {
      id: 1,
      item: "전환 방식",
      content: "수기 작성",
      weight: 1.0,
      description: "배경을 따라서 수기로 작성",
    },
    {
      id: 2,
      item: "전환 방식",
      content: "DrawDX",
      weight: 0.15,
      description: "자동 인식 후 결과 보정",
    },
    {
      id: 3,
      item: "전환 방식",
      content: "MS Visio",
      weight: 0.1,
      description: "Visio 인식 (지원 예정)",
    },
  ];

  const [pidWeightTable, setPidWeightTable] = useState(defaultPidWeightTable);
  const [selectedPidWeightId, setSelectedPidWeightId] = useState<number | null>(null);

  // M/M 계산 기준값 (기본값 21)
  const [mmCalculationBase, setMmCalculationBase] = useState<number>(21);

  // P&ID 공수 기준표 (백데이터)
  const defaultPidRateTable = [
    { id: 1, category: "P&ID", quantity: 500, baseMd: 1, remarks: "" },
    { id: 2, category: "SLD", quantity: 0, baseMd: 0.5, remarks: "" },
  ];

  // P&ID 항목 (공수 기준표 기반)
  const [pidItems, setPidItems] = useState(
    defaultPidRateTable.map((item) => ({
      ...item,
      quantity: item.quantity, // 기본 수량
      baseMd: item.baseMd, // 기준 M/D (수정 가능)
      calculatedMd: item.quantity * item.baseMd, // 산정 M/D = 수량 × 기준M/D
    }))
  );

  // 개발항목별 총 M/D 계산 - useMemo로 최적화
  const totalDevelopmentMd = useMemo(
    () => developmentItems.reduce((sum, item) => sum + (item.calculatedMd || 0), 0),
    [developmentItems]
  );

  // 구분별 M/D 합계 계산 - useMemo로 최적화
  const mdByClassification = useMemo(() => {
    const result: Record<string, number> = {};
    developmentItems.forEach((item) => {
      const classification = item.classification || "기타";
      result[classification] = (result[classification] || 0) + (item.calculatedMd || 0);
    });
    return result;
  }, [developmentItems]);

  // 구분별 M/D(난이도) 및 M/M 계산 - useMemo로 최적화
  const summaryByClassification = useMemo(() => {
    const classifications = ["PM", "개발", "I/F", "2D디자인", "포탈"];
    const result = classifications.map((classification) => {
      const md = mdByClassification[classification] || 0;
      const mdWithDifficulty = md * calculatedDifficulty;
      const mm = mmCalculationBase > 0 ? mdWithDifficulty / mmCalculationBase : 0; // M/M = (M/D × 난이도) / M/M 계산 기준값
      return {
        classification,
        md,
        mdWithDifficulty,
        mm,
      };
    });
    return result;
  }, [mdByClassification, calculatedDifficulty, mmCalculationBase]);

  // 전체 합계 계산 - useMemo로 최적화
  const totalSummary = useMemo(() => {
    const totalMd = summaryByClassification.reduce((sum, item) => sum + item.md, 0);
    const totalMdWithDifficulty = summaryByClassification.reduce((sum, item) => sum + item.mdWithDifficulty, 0);
    const totalMm = summaryByClassification.reduce((sum, item) => sum + item.mm, 0);
    return {
      md: totalMd,
      mdWithDifficulty: totalMdWithDifficulty,
      mm: totalMm,
    };
  }, [summaryByClassification]);

  // 개발항목별 M/M 계산 (M/D × 난이도) - useMemo로 최적화
  const totalDevelopmentMm = useMemo(
    () => totalDevelopmentMd * calculatedDifficulty,
    [totalDevelopmentMd, calculatedDifficulty]
  );

  // 3D 모델링 총 M/D 계산 (수량 × 기준M/D의 합계) - useMemo로 최적화
  const totalModeling3dMd = useMemo(
    () => modeling3dItems.reduce((sum, item) => sum + (item.calculatedMd || 0), 0),
    [modeling3dItems]
  );

  // 선택된 가중치 - useMemo로 최적화
  const selectedWeight = useMemo(
    () => weightTable.find((w) => w.id === selectedWeightId),
    [weightTable, selectedWeightId]
  );
  const selectedWeightValue = useMemo(
    () => selectedWeight?.weight || 1.0,
    [selectedWeight]
  );

  // 3D 모델링 최종 M/D 계산 (합계(M/D) × 선택된 가중치) - useMemo로 최적화
  const finalModeling3dMd = useMemo(
    () => totalModeling3dMd * selectedWeightValue,
    [totalModeling3dMd, selectedWeightValue]
  );

  // 3D 모델링 총 M/M 계산 (최종M/D) - useMemo로 최적화 (전체 M/M 계산용)
  const totalModeling3dMm = useMemo(
    () => finalModeling3dMd,
    [finalModeling3dMd]
  );

  // 3D 모델링 최종 M/M 계산 (최종M/D / M/M 계산 기준값) - useMemo로 최적화
  const finalModeling3dMm = useMemo(
    () => finalModeling3dMd / mmCalculationBase,
    [finalModeling3dMd, mmCalculationBase]
  );

  // 개발 최종 M/M 계산 (최종 M/D / M/M 계산 기준값)
  const finalDevelopmentMm = useMemo(
    () => totalSummary.mdWithDifficulty / mmCalculationBase,
    [totalSummary.mdWithDifficulty, mmCalculationBase]
  );

  // P&ID 총 M/D 계산 (수량 × 기준M/D의 합계) - useMemo로 최적화
  const totalPidMd = useMemo(
    () => pidItems.reduce((sum, item) => sum + (item.calculatedMd || 0), 0),
    [pidItems]
  );

  // 선택된 P&ID 가중치 - useMemo로 최적화
  const selectedPidWeight = useMemo(
    () => pidWeightTable.find((w) => w.id === selectedPidWeightId),
    [pidWeightTable, selectedPidWeightId]
  );
  const selectedPidWeightValue = useMemo(
    () => selectedPidWeight?.weight || 1.0,
    [selectedPidWeight]
  );

  // P&ID 최종 M/D 계산 (합계(M/D) × 선택된 가중치) - useMemo로 최적화
  const finalPidMd = useMemo(
    () => totalPidMd * selectedPidWeightValue,
    [totalPidMd, selectedPidWeightValue]
  );

  // P&ID 총 M/M 계산 (최종M/D × 가중치) - useMemo로 최적화 (전체 M/M 계산용)
  const totalPidMm = useMemo(
    () => finalPidMd,
    [finalPidMd]
  );

  // P&ID 최종 M/M 계산 (최종M/D / M/M 계산 기준값) - useMemo로 최적화
  const finalPidMm = useMemo(
    () => finalPidMd / mmCalculationBase,
    [finalPidMd, mmCalculationBase]
  );

  // 전체 M/M (개발 최종 M/M + 3D 모델링 최종 M/M + P&ID 최종 M/M) - useMemo로 최적화
  const totalMm = useMemo(
    () => finalDevelopmentMm + finalModeling3dMm + finalPidMm,
    [finalDevelopmentMm, finalModeling3dMm, finalPidMm]
  );

  // 공통 난이도 합계 - useMemo로 최적화
  const commonDifficultySum = useMemo(
    () => commonDifficultyItems.reduce((sum, item) => sum + (selectedDifficultyItems[item.id] ?? item.difficulty), 0),
    [selectedDifficultyItems]
  );

  // 분야별 난이도 합계 - useMemo로 최적화
  const fieldDifficultySum = useMemo(
    () =>
      fieldDifficultyItems
        .filter((item) => selectedFieldCategories.has(item.category))
        .reduce((sum, item) => sum + (selectedFieldDifficultyItems[item.id] ?? item.difficulty), 0),
    [selectedFieldCategories, selectedFieldDifficultyItems, fieldDifficultyItems]
  );

  // 탭 배열 - useMemo로 최적화 (상수이므로 dependency 없음)
  const tabs = useMemo(
    () => [
      { id: "overview", label: "예상 M/D", icon: FileText },
      { id: "difficulty", label: "가중치", icon: BarChart3 },
      { id: "development", label: "개발", icon: TrendingUp },
      { id: "modeling3d", label: "3D 모델링", icon: Box },
      { id: "pid", label: "P&ID", icon: Settings },
    ],
    []
  );

  const handleAddDevelopmentItem = useCallback(() => {
    setDevelopmentItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        classification: "",
        content: "",
        quantity: 0,
        standardMd: 0,
        calculatedMd: 0,
      },
    ]);
  }, []);

  const handleRemoveDevelopmentItem = useCallback((id: number) => {
    setDevelopmentItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleDevelopmentItemChange = useCallback(
    (id: number, field: string, value: string | number) => {
      setDevelopmentItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = { ...item, [field]: value };
            // 수량이나 기준MD가 변경되면 산정MD 자동 계산
            // M/D = 수량 × 기준M/D
            if (field === "quantity" || field === "standardMd") {
              updated.calculatedMd =
                Number(updated.quantity || 0) * Number(updated.standardMd || 0);
            }
            return updated;
          }
          return item;
        })
      );
    },
    []
  );

  const handleAddModeling3dItem = useCallback(() => {
    setModeling3dItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: "",
        difficulty: "",
        quantity: 0,
        baseMd: 0,
        calculatedMd: 0,
        remarks: "",
      },
    ]);
  }, []);

  const handleRemoveModeling3dItem = useCallback((id: number) => {
    setModeling3dItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleModeling3dItemChange = useCallback(
    (id: number, field: string, value: string | number) => {
      setModeling3dItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = { ...item, [field]: value };
            // 수량이나 기준MD가 변경되면 산정MD 자동 계산
            // 산정M/D = 수량 × 기준M/D
            if (field === "quantity" || field === "baseMd") {
              updated.calculatedMd =
                Number(updated.quantity) * Number(updated.baseMd);
            }
            return updated;
          }
          return item;
        })
      );
    },
    []
  );

  const handleAddWeightItem = useCallback(() => {
    setWeightTable((prev) => [
      ...prev,
      {
        id: Date.now(),
        item: "3D 입력 자료", // 내부적으로는 유지하되 표시는 안 함
        content: "",
        weight: 1.0,
        description: "",
      },
    ]);
  }, []);

  const handleRemoveWeightItem = useCallback(
    (id: number) => {
      setWeightTable((prev) => prev.filter((item) => item.id !== id));
      setSelectedWeightId((prev) => (prev === id ? null : prev));
    },
    []
  );

  const handleWeightItemChange = useCallback(
    (id: number, field: string, value: string | number) => {
      setWeightTable((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        })
      );
    },
    []
  );

  const handleAddPidItem = useCallback(() => {
    setPidItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: "",
        quantity: 0,
        baseMd: 0,
        calculatedMd: 0,
        remarks: "",
      },
    ]);
  }, []);

  const handleRemovePidItem = useCallback((id: number) => {
    setPidItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handlePidItemChange = useCallback(
    (id: number, field: string, value: string | number) => {
      setPidItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updated = { ...item, [field]: value };
            // 수량이나 기준MD가 변경되면 산정MD 자동 계산
            // 산정M/D = 수량 × 기준M/D
            if (field === "quantity" || field === "baseMd") {
              updated.calculatedMd =
                Number(updated.quantity) * Number(updated.baseMd);
            }
            return updated;
          }
          return item;
        })
      );
    },
    []
  );

  const handleAddPidWeightItem = useCallback(() => {
    setPidWeightTable((prev) => [
      ...prev,
      {
        id: Date.now(),
        item: "전환 방식", // 내부적으로는 유지하되 표시는 안 함
        content: "",
        weight: 1.0,
        description: "",
      },
    ]);
  }, []);

  const handlePidWeightItemChange = useCallback(
    (id: number, field: string, value: string | number) => {
      setPidWeightTable((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return { ...item, [field]: value };
          }
          return item;
        })
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let estimationId = currentEstimationId;

      // 새 M/D 산정인 경우 먼저 생성 또는 기존 draft 산정 찾기
      if (isNewEstimation || !estimationId) {
        // 먼저 기존 STANDBY 상태의 산정이 있는지 확인
        const listResponse = await fetch(`/api/md-estimations?projectId=${id}&status=STANDBY`);
        let existingDraft = null;
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const filtered = (listData.estimations || []).filter(
            (est: any) => est.project_id === parseInt(id) && est.status === 'STANDBY'
          );
          // 최신 STANDBY 산정 사용
          if (filtered.length > 0) {
            existingDraft = filtered.sort((a: any, b: any) => b.version - a.version)[0];
          }
        }

        if (existingDraft) {
          // 기존 draft 산정이 있으면 그것을 사용
          estimationId = existingDraft.id;
          setCurrentEstimationId(estimationId);
          setIsNewEstimation(false);
        } else {
          // 기존 draft 산정이 없으면 새로 생성 (또는 기존 draft 산정 반환)
          const projectIdForCreate = parseInt(id);
          console.log('[SAVE] M/D 산정 생성 요청:', {
            project_id: projectIdForCreate,
            'API URL': '/api/md-estimations',
            '프로젝트 ID 타입': typeof projectIdForCreate,
          });

          const createResponse = await fetch("/api/md-estimations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: projectIdForCreate,
            }),
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "M/D 산정 생성에 실패했습니다.");
          }

          const createData = await createResponse.json();
          estimationId = createData.id;
          setCurrentEstimationId(estimationId);
          setIsNewEstimation(false);
        }
      }

      // 난이도 데이터 준비
      const difficulties = [
        ...Object.entries(selectedDifficultyItems).map(([itemId, difficulty]) => ({
          difficulty_item_id: parseInt(itemId),
          field_difficulty_item_id: null,
          selected_difficulty: difficulty,
        })),
        ...Object.entries(selectedFieldDifficultyItems)
          .filter(([itemId]) => {
            const item = fieldDifficultyItems.find((i) => i.id === parseInt(itemId));
            return item && selectedFieldCategories.has(item.category);
          })
          .map(([itemId, difficulty]) => ({
            difficulty_item_id: null,
            field_difficulty_item_id: parseInt(itemId),
            selected_difficulty: difficulty,
          })),
      ];

      // M/D 산정 데이터 저장
      const projectIdNum = parseInt(id);

      const saveData = {
        project_id: projectIdNum, // 프로젝트 ID 검증을 위해 포함
        common_difficulty_sum: commonDifficultySum,
        field_difficulty_sum: fieldDifficultySum,
        project_difficulty: calculatedDifficulty,
        total_development_md: totalDevelopmentMd,
        total_modeling_3d_md: totalModeling3dMd,
        total_pid_md: totalPidMd,
        total_development_mm: totalDevelopmentMm,
        total_modeling_3d_mm: totalModeling3dMm,
        total_pid_mm: totalPidMm,
        total_mm: totalMm,
        selected_modeling_3d_weight_id: selectedWeightId,
        selected_pid_weight_id: selectedPidWeightId,
        difficulties,
        fieldCategories: Array.from(selectedFieldCategories),
        developmentItems: developmentItems.map((item, index) => {
          // 기본 항목(id 1~25)은 development_item_id를 사용, 새 항목은 null
          const developmentItemId = item.id <= 25 ? item.id : null;
          return {
            development_item_id: developmentItemId,
            classification: item.classification,
            content: item.content,
            quantity: item.quantity || 0,
            standard_md: item.standardMd || 0,
            calculated_md: item.calculatedMd || 0,
            display_order: index,
          };
        }),
        modeling3dItems: modeling3dItems.map((item, index) => ({
          modeling_3d_item_id: null,
          category: item.category,
          difficulty: item.difficulty || null,
          quantity: item.quantity || 0,
          base_md: item.baseMd || 0,
          calculated_md: item.calculatedMd || 0,
          remarks: item.remarks || null,
          display_order: index,
        })),
        pidItems: pidItems.map((item, index) => ({
          pid_item_id: null,
          category: item.category,
          quantity: item.quantity || 0,
          base_md: item.baseMd || 0,
          calculated_md: item.calculatedMd || 0,
          remarks: item.remarks || null,
          display_order: index,
        })),
        weightTable: weightTable.map((item) => ({
          id: item.id,
          content: item.content,
          weight: item.weight,
          description: item.description,
        })),
        pidWeightTable: pidWeightTable.map((item) => ({
          id: item.id,
          content: item.content,
          weight: item.weight,
          description: item.description,
        })),
        mmCalculationBase: mmCalculationBase,
      };

      console.log('[SAVE] 저장하는 데이터:', {
        estimationId,
        projectId: projectIdNum,
        selected_modeling_3d_weight_id: saveData.selected_modeling_3d_weight_id,
        selected_pid_weight_id: saveData.selected_pid_weight_id,
        pidItems_count: saveData.pidItems.length,
        pidItems_first: saveData.pidItems[0],
        pidWeightTable_count: saveData.pidWeightTable.length,
        pidWeightTable_first: saveData.pidWeightTable[0],
        modeling3dItems_count: saveData.modeling3dItems.length,
        modeling3dItems_first: saveData.modeling3dItems[0],
        weightTable_count: saveData.weightTable.length,
        weightTable_first: saveData.weightTable[0],
        mmCalculationBase: saveData.mmCalculationBase,
        difficulties_count: saveData.difficulties.length,
        difficulties_first: saveData.difficulties[0],
        difficulties_all: saveData.difficulties,
        fieldCategories_count: saveData.fieldCategories.length,
        fieldCategories_all: saveData.fieldCategories,
        fullData: saveData,
      });

      console.log('[SAVE] PUT 요청 전송:', {
        estimationId,
        projectId: projectIdNum,
        'API URL': `/api/md-estimations/${estimationId}`,
        '전송 데이터 요약': {
          project_id: saveData.project_id,
          selected_modeling_3d_weight_id: saveData.selected_modeling_3d_weight_id,
          selected_pid_weight_id: saveData.selected_pid_weight_id,
          pidItems_count: saveData.pidItems.length,
        }
      });

      const saveResponse = await fetch(`/api/md-estimations/${estimationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...saveData,
          status: 'IN_PROGRESS'
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "M/D 산정 저장에 실패했습니다.");
      }

      // 목록 새로고침 (현재 프로젝트만)
      const listResponse = await fetch(`/api/md-estimations?projectId=${id}`);
      if (listResponse.ok) {
        const listData = await listResponse.json();
        // 프로젝트 ID로 한 번 더 필터링 (안전장치)
        const filteredEstimations = (listData.estimations || []).filter(
          (est: any) => est.project_id === parseInt(id)
        );
        setMdEstimations(filteredEstimations);
        // 현재 선택된 산정이 있으면 업데이트
        if (estimationId) {
          const updated = filteredEstimations.find((e: any) => e.id === estimationId);
          if (updated) {
            setCurrentEstimationId(updated.id);
            setIsNewEstimation(false);
          }
        }
      }

      // 저장 성공 메시지
      alert("저장하였습니다.");
    } catch (error: any) {
      console.error("Error saving MD estimation:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    currentEstimationId,
    isNewEstimation,
    id,
    selectedDifficultyItems,
    selectedFieldDifficultyItems,
    selectedFieldCategories,
    commonDifficultySum,
    fieldDifficultySum,
    calculatedDifficulty,
    totalDevelopmentMd,
    totalModeling3dMd,
    totalPidMd,
    totalDevelopmentMm,
    totalModeling3dMm,
    totalPidMm,
    totalMm,
    selectedWeightId,
    selectedPidWeightId,
    developmentItems,
    modeling3dItems,
    pidItems,
    fieldDifficultyItems,
    weightTable,
    pidWeightTable,
  ]);

  const handleComplete = useCallback(async () => {
    if (
      window.confirm(
        "M/D 산정을 완료하시겠습니까? 완료 후 VRB 검토를 요청할 수 있습니다."
      )
    ) {
      setIsSaving(true);
      try {
        // 먼저 저장
        await handleSave();

        let estimationId = currentEstimationId;
        if (!estimationId) {
          throw new Error("M/D 산정을 먼저 저장해주세요.");
        }

        // 상태를 'COMPLETED'로 변경
        const completeResponse = await fetch(`/api/md-estimations/${estimationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "COMPLETED",
          }),
        });

        if (!completeResponse.ok) {
          throw new Error("M/D 산정 완료 처리에 실패했습니다.");
        }

        alert("M/D 산정이 완료되었습니다.");
        // 목록 새로고침 (현재 프로젝트만)
        const listResponse = await fetch(`/api/md-estimations?projectId=${id}`);
        if (listResponse.ok) {
          const listData = await listResponse.json();
          // 프로젝트 ID로 한 번 더 필터링 (안전장치)
          const filteredEstimations = (listData.estimations || []).filter(
            (est: any) => est.project_id === parseInt(id)
          );
          setMdEstimations(filteredEstimations);
          // 완료된 항목 선택
          const completed = filteredEstimations.find((e: any) => e.id === estimationId);
          if (completed) {
            setCurrentEstimationId(completed.id);
            setIsNewEstimation(false);
          }
        }
      } catch (error: any) {
        console.error("Error completing MD estimation:", error);
        alert(`완료 처리 실패: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    }
  }, [handleSave, currentEstimationId, id]);

  const handleNewEstimation = useCallback(() => {
    setIsNewEstimation(true);
    setCurrentEstimationId(null);
    setSelectedWeightId(null);
    // 폼 초기화 - 난이도는 state로 관리하지 않으므로 제거
    setSelectedDifficultyItems(
      commonDifficultyItems.reduce((acc, item) => {
        acc[item.id] = 2; // 디폴트 난이도 2
        return acc;
      }, {} as Record<number, number>)
    );
    setSelectedFieldDifficultyItems({});
    setSelectedFieldCategories(new Set());
    setDevelopmentItems(
      defaultDevelopmentItems.map((item) => ({
        ...item,
        calculatedMd: (item.quantity || 0) * item.standardMd,
      }))
    );
    setModeling3dItems(
      defaultModeling3dRateTable.map((item) => ({
        ...item,
        quantity: item.quantity,
        baseMd: item.baseMd,
        calculatedMd: item.quantity * item.baseMd,
      }))
    );
    setPidItems(
      defaultPidRateTable.map((item) => ({
        ...item,
        quantity: item.quantity,
        baseMd: item.baseMd,
        calculatedMd: item.quantity * item.baseMd,
      }))
    );
    setSelectedPidWeightId(null);
  }, []);

  const handleCopyEstimation = useCallback(
    (estimationId: number) => {
      const estimation = mdEstimations.find((e) => e.id === estimationId);
      if (estimation) {
        // TODO: 기존 데이터를 복사하여 새 버전 생성
        handleNewEstimation();
        alert("기존 M/D 산정을 복사하여 새 버전을 생성합니다.");
      }
    },
    [mdEstimations, handleNewEstimation]
  );

  const handleSelectEstimation = useCallback((estimationId: number) => {
    console.log('[SELECT] 목록에서 산정 선택:', { estimationId, type: typeof estimationId });
    setCurrentEstimationId(estimationId);
    setShowListModal(false);
    setIsNewEstimation(false);
    console.log('[SELECT] currentEstimationId 설정 완료:', estimationId);
  }, []);

  // 저장된 선택 가중치 ID (로드 후 복원용)
  const [savedSelectedWeightId, setSavedSelectedWeightId] = useState<number | null>(null);
  const [savedSelectedPidWeightId, setSavedSelectedPidWeightId] = useState<number | null>(null);

  // 현재 선택된 산정의 데이터 로드
  useEffect(() => {
    const loadEstimationData = async () => {
      console.log('[LOAD] useEffect 실행:', { currentEstimationId, isNewEstimation, id, 'currentEstimationId 타입': typeof currentEstimationId });

      // 신규 작성 모드일 때는 기본값으로 초기화
      if (isNewEstimation) {
        console.log('[LOAD] 신규 작성 모드 - 모든 데이터 기본값으로 초기화');

        // 공통 난이도 기본값 초기화 (기초데이터 값 사용)
        setSelectedDifficultyItems(
          commonDifficultyItems.reduce((acc, item) => {
            acc[item.id] = item.difficulty || 0;
            return acc;
          }, {} as Record<number, number>)
        );

        // 분야별 난이도 초기화
        setSelectedFieldDifficultyItems({});
        setSelectedFieldCategories(new Set());

        // 분야별 난이도 항목(Master Data) 다시 로드 - 기존 state에 남아있는 값 제거 목적
        fetch('/api/md-weights/field-difficulty-items')
          .then(res => res.json())
          .then(data => {
            if (data.items && data.items.length > 0) {
              console.log('[LOAD] 분야별 난이도 항목 Master Data로 초기화');
              // ID 기준 중복 제거
              const uniqueItems = data.items.filter((item: any, index: number, self: any[]) =>
                index === self.findIndex((t) => t.id === item.id)
              );
              setFieldDifficultyItems(uniqueItems);

              // 분야별 난이도 선택값 초기화 (기초데이터 값 사용)
              const initialFieldDifficulties = uniqueItems.reduce((acc: any, item: any) => {
                acc[item.id] = item.difficulty || 0;
                return acc;
              }, {});
              setSelectedFieldDifficultyItems(initialFieldDifficulties);
            }
          })
          .catch(err => console.error('[LOAD] 분야별 난이도 항목 초기화 실패:', err));


        // 개발 항목 기본값 설정
        setDevelopmentItems(
          defaultDevelopmentItems.map((item) => ({
            ...item,
            calculatedMd: (item.quantity || 0) * item.standardMd,
          }))
        );

        // 3D 모델링 항목 기본값 설정 (수량 0으로 초기화)
        setModeling3dItems(
          defaultModeling3dRateTable.map((item) => ({
            ...item,
            quantity: 0,
            baseMd: item.baseMd,
            calculatedMd: 0,
          }))
        );

        // P&ID 항목 기본값 설정 (수량 0으로 초기화)
        setPidItems(
          defaultPidRateTable.map((item) => ({
            ...item,
            quantity: 0,
            baseMd: item.baseMd,
            calculatedMd: 0,
          }))
        );

        // 가중치 선택 초기화
        setSelectedWeightId(null);
        setSelectedPidWeightId(null);
        setMmCalculationBase(21); // 기본값 21

        return;
      }

      if (!currentEstimationId || !id) {
        console.log('[LOAD] 로드 스킵:', { currentEstimationId, isNewEstimation, id, reason: !currentEstimationId ? 'currentEstimationId 없음' : 'id 없음' });
        return;
      }

      console.log('[LOAD] 데이터 로드 시작:', { currentEstimationId, id, 'API URL': `/api/md-estimations/${currentEstimationId}` });

      try {
        const response = await fetch(`/api/md-estimations/${currentEstimationId}`);
        if (response.ok) {
          const data = await response.json();
          const estimation = data.estimation;

          console.log('[LOAD] 로드한 데이터:', {
            estimationId: currentEstimationId,
            selected_modeling_3d_weight_id: estimation.selected_modeling_3d_weight_id,
            selected_pid_weight_id: estimation.selected_pid_weight_id,
            pidItems: estimation.pidItems ? {
              count: estimation.pidItems.length,
              all: estimation.pidItems,
              first: estimation.pidItems[0]
            } : null,
            pidWeightTable: estimation.pidWeightTable ? { count: estimation.pidWeightTable.length, first: estimation.pidWeightTable[0] } : null,
            modeling3dItems: estimation.modeling3dItems ? { count: estimation.modeling3dItems.length, first: estimation.modeling3dItems[0] } : null,
            weightTable: estimation.weightTable ? { count: estimation.weightTable.length, first: estimation.weightTable[0] } : null,
            mmCalculationBase: estimation.mmCalculationBase,
          });

          console.log('[LOAD] ⚠️ 저장된 데이터 확인:', {
            'pidItems가 있는가?': !!estimation.pidItems,
            'pidItems 배열인가?': Array.isArray(estimation.pidItems),
            'pidItems 개수': estimation.pidItems ? estimation.pidItems.length : 0,
            'pidItems 전체': estimation.pidItems,
            'selected_pid_weight_id가 있는가?': !!estimation.selected_pid_weight_id,
            'selected_pid_weight_id 값': estimation.selected_pid_weight_id,
            'selected_pid_weight_id 타입': typeof estimation.selected_pid_weight_id,
          });

          // API 응답 전체 확인
          console.log('[LOAD] 🔍 API 응답 전체 확인:', {
            'estimation 객체 키': Object.keys(estimation),
            'estimation.id': estimation.id,
            'estimation.project_id': estimation.project_id,
            'estimation.pidItems': estimation.pidItems,
            'estimation.selected_pid_weight_id': estimation.selected_pid_weight_id,
          });

          // 현재 프로젝트의 산정인지 확인
          if (parseInt(String(estimation.project_id)) !== parseInt(id)) {
            console.error("M/D 산정이 현재 프로젝트와 일치하지 않습니다.");
            return;
          }

          // 난이도 선택 정보 로드
          if (estimation.difficulties && Array.isArray(estimation.difficulties)) {
            const commonDifficulties: Record<number, number> = {};
            const fieldDifficulties: Record<number, number> = {};

            estimation.difficulties.forEach((diff: any) => {
              if (diff.difficulty_item_id) {
                commonDifficulties[diff.difficulty_item_id] = diff.selected_difficulty;
              } else if (diff.field_difficulty_item_id) {
                fieldDifficulties[diff.field_difficulty_item_id] = diff.selected_difficulty;
              }
            });

            setSelectedDifficultyItems(commonDifficulties);
            setSelectedFieldDifficultyItems(fieldDifficulties);
          }

          // 분야별 적용 로드
          if (estimation.fieldCategories !== undefined) {
            if (Array.isArray(estimation.fieldCategories)) {
              console.log('[LOAD] 분야별 적용 로드:', {
                fieldCategories: estimation.fieldCategories,
                count: estimation.fieldCategories.length,
                set: new Set(estimation.fieldCategories),
              });
              setSelectedFieldCategories(new Set(estimation.fieldCategories));
            } else {
              console.log('[LOAD] ⚠️ fieldCategories가 배열이 아님:', estimation.fieldCategories);
              setSelectedFieldCategories(new Set());
            }
          } else {
            console.log('[LOAD] ⚠️ fieldCategories가 undefined - 빈 Set으로 초기화');
            setSelectedFieldCategories(new Set());
          }

          // 개발 항목 로드
          if (estimation.developmentItems && Array.isArray(estimation.developmentItems) && estimation.developmentItems.length > 0) {
            const loadedItems = estimation.developmentItems.map((item: any, index: number) => {
              // development_item_id가 있으면 기본 항목이므로 그 값을 사용
              // 없으면 새로 추가한 항목이므로 타임스탬프로 새 ID 생성 (10000 이상으로 구분)
              const itemId = item.development_item_id
                ? item.development_item_id
                : (Date.now() + index + 10000);
              return {
                id: itemId,
                classification: item.classification || "",
                content: item.content || "",
                quantity: parseFloat(item.quantity) || 0,
                standardMd: parseFloat(item.standard_md) || 0,
                calculatedMd: parseFloat(item.calculated_md) || 0,
              };
            });
            console.log('[LOAD] 개발 항목 설정:', { count: loadedItems.length, items: loadedItems });
            setDevelopmentItems(loadedItems);
          } else {
            console.log('[LOAD] 개발 항목이 없거나 빈 배열 - 기본값으로 초기화');
            // 저장된 데이터가 없으면 기본 항목으로 초기화
            setDevelopmentItems(
              defaultDevelopmentItems.map((item) => ({
                ...item,
                calculatedMd: (item.quantity || 0) * item.standardMd,
              }))
            );
          }

          // 3D 모델링 항목 로드
          if (estimation.modeling3dItems && Array.isArray(estimation.modeling3dItems) && estimation.modeling3dItems.length > 0) {
            const loadedItems = estimation.modeling3dItems.map((item: any, index: number) => {
              // modeling_3d_item_id가 있으면 기본 항목이므로 그 값을 사용
              // 없으면 새로 추가한 항목이므로 타임스탬프로 새 ID 생성 (20000 이상으로 구분)
              const itemId = item.modeling_3d_item_id
                ? item.modeling_3d_item_id
                : (Date.now() + index + 20000);
              return {
                id: itemId,
                category: item.category || "",
                difficulty: item.difficulty || "",
                quantity: parseFloat(item.quantity) || 0,
                baseMd: parseFloat(item.base_md) || 0,
                calculatedMd: parseFloat(item.calculated_md) || 0,
                remarks: item.remarks || "",
              };
            });
            console.log('[LOAD] 3D 모델링 항목 설정:', { count: loadedItems.length, items: loadedItems });
            setModeling3dItems([...loadedItems]); // 새 배열 참조로 강제 업데이트
          } else {
            console.log('[LOAD] 3D 모델링 항목이 없거나 빈 배열 - 기본값으로 초기화');
            // 저장된 데이터가 없으면 기본 항목으로 초기화 (수량 0)
            setModeling3dItems(
              defaultModeling3dRateTable.map((item) => ({
                ...item,
                quantity: 0,
                baseMd: item.baseMd,
                calculatedMd: 0,
              }))
            );
          }

          // P&ID 항목 로드 - 저장된 데이터가 있으면 반드시 사용
          // 게시판 컨셉: 저장된 데이터(we_project_md_estimation_pid_items)를 조회해서 사용
          if (estimation.pidItems && Array.isArray(estimation.pidItems)) {
            // 배열이 있으면 저장된 데이터 사용 (빈 배열이어도 저장된 데이터로 간주 - 사용자가 모두 지웠을 수 있음)
            // 단, 사용자가 처음 진입했을 때 빈 배열로 저장되었을 가능성도 있으므로,
            // 3D 모델링과 동일하게 빈 배열이면 기본값으로 초기화하는 것이 안전할 수 있음.
            // 하지만 P&ID는 기존에도 length > 0 체크가 있었으므로 유지하되, else 블록에서 quantity 0으로 초기화
            if (estimation.pidItems.length > 0) {
              const loadedItems = estimation.pidItems.map((item: any, index: number) => {
                // pid_item_id가 있으면 기본 항목이므로 그 값을 사용
                // 없으면 새로 추가한 항목이므로 타임스탬프로 새 ID 생성 (30000 이상으로 구분)
                const itemId = item.pid_item_id
                  ? item.pid_item_id
                  : (Date.now() + index + 30000);
                return {
                  id: itemId,
                  category: item.category || "",
                  quantity: parseFloat(item.quantity) || 0,
                  baseMd: parseFloat(item.base_md) || 0,
                  calculatedMd: parseFloat(item.calculated_md) || 0,
                  remarks: item.remarks || "",
                };
              });
              console.log('[LOAD] ✅ P&ID 항목 설정 (저장된 데이터 사용 - we_project_md_estimation_pid_items):', {
                count: loadedItems.length,
                items: loadedItems,
                source: 'we_project_md_estimation_pid_items'
              });
              setPidItems([...loadedItems]); // 새 배열 참조로 강제 업데이트
            } else {
              // 빈 배열이면 저장된 데이터가 없는 것이므로 기본값 사용 (새 작성 모드)
              console.log('[LOAD] ⚠️ P&ID 항목이 빈 배열 - 기본값으로 초기화');
              setPidItems(
                defaultPidRateTable.map((item) => ({
                  ...item,
                  quantity: 0, // 기본 수량 0으로 초기화
                  baseMd: item.baseMd,
                  calculatedMd: 0,
                }))
              );
            }
          } else {
            // pidItems가 없으면 기본값 사용 (새 작성 모드)
            console.log('[LOAD] ⚠️ P&ID 항목이 없음 - 기본값으로 초기화 (새 작성 모드)');
            setPidItems(
              defaultPidRateTable.map((item) => ({
                ...item,
                quantity: 0, // 기본 수량 0으로 초기화
                baseMd: item.baseMd,
                calculatedMd: 0,
              }))
            );
          }

          // 가중치 테이블은 항상 기준정보 테이블에서 가져옴 (API에서 이미 로드됨)
          if (estimation.weightTable && Array.isArray(estimation.weightTable) && estimation.weightTable.length > 0) {
            console.log('[LOAD] weightTable 설정:', { count: estimation.weightTable.length, table: estimation.weightTable });
            setWeightTable([...estimation.weightTable]); // 새 배열 참조로 강제 업데이트

            // weightTable 설정 직후 selected_modeling_3d_weight_id 확인해서 바로 선택
            if (estimation.selected_modeling_3d_weight_id) {
              const selectedId = parseInt(String(estimation.selected_modeling_3d_weight_id), 10);
              const weightExists = estimation.weightTable.some((w: any) => {
                const weightId = typeof w.id === 'string' ? parseInt(w.id, 10) : w.id;
                return weightId === selectedId;
              });
              if (weightExists) {
                console.log('[LOAD] selectedWeightId 즉시 설정:', selectedId, '(원본:', estimation.selected_modeling_3d_weight_id, ')');
                setSelectedWeightId(selectedId);
              } else {
                console.log('[LOAD] selectedWeightId가 테이블에 없음:', selectedId, '가중치 테이블 ID들:', estimation.weightTable.map((w: any) => ({ id: w.id, type: typeof w.id })));
              }
            }
          } else {
            console.log('[LOAD] weightTable이 없음 - 기준정보에서 로드 필요');
            // weightTable이 없으면 나중에 복원하기 위해 저장
            if (estimation.selected_modeling_3d_weight_id) {
              const selectedId = parseInt(String(estimation.selected_modeling_3d_weight_id), 10);
              setSavedSelectedWeightId(selectedId);
            }
          }

          // P&ID 가중치 테이블은 항상 기준정보 테이블에서 가져옴 (API에서 이미 로드됨)
          if (estimation.pidWeightTable && Array.isArray(estimation.pidWeightTable) && estimation.pidWeightTable.length > 0) {
            console.log('[LOAD] pidWeightTable 설정:', { count: estimation.pidWeightTable.length, table: estimation.pidWeightTable });
            setPidWeightTable([...estimation.pidWeightTable]); // 새 배열 참조로 강제 업데이트

            // pidWeightTable 설정 직후 selected_pid_weight_id 확인해서 바로 선택
            if (estimation.selected_pid_weight_id) {
              const selectedId = parseInt(String(estimation.selected_pid_weight_id), 10);
              const weightExists = estimation.pidWeightTable.some((w: any) => {
                const weightId = typeof w.id === 'string' ? parseInt(w.id, 10) : w.id;
                return weightId === selectedId;
              });
              if (weightExists) {
                console.log('[LOAD] selectedPidWeightId 즉시 설정:', selectedId, '(원본:', estimation.selected_pid_weight_id, ')');
                setSelectedPidWeightId(selectedId);
              } else {
                console.log('[LOAD] selectedPidWeightId가 테이블에 없음:', selectedId, '가중치 테이블 ID들:', estimation.pidWeightTable.map((w: any) => ({ id: w.id, type: typeof w.id })));
              }
            }
          } else {
            console.log('[LOAD] pidWeightTable이 없음 - 기준정보에서 로드 필요');
            // pidWeightTable이 없으면 나중에 복원하기 위해 저장
            if (estimation.selected_pid_weight_id) {
              const selectedId = parseInt(String(estimation.selected_pid_weight_id), 10);
              setSavedSelectedPidWeightId(selectedId);
            }
          }

          // M/M 계산 기준값 로드
          if (estimation.mmCalculationBase !== undefined && estimation.mmCalculationBase !== null) {
            setMmCalculationBase(parseFloat(estimation.mmCalculationBase) || 21);
          }

          // 공통 난이도 항목 로드
          if (estimation.difficulties && Array.isArray(estimation.difficulties)) {
            // DB에 저장된 선택값 로드
            const savedDifficulties: Record<number, number> = {};
            const savedFieldDifficulties: Record<number, number> = {};

            estimation.difficulties.forEach((d: any) => {
              if (d.difficulty_item_id) {
                savedDifficulties[d.difficulty_item_id] = d.selected_difficulty;
              } else if (d.field_difficulty_item_id) {
                savedFieldDifficulties[d.field_difficulty_item_id] = d.selected_difficulty;
              }
            });

            setSelectedDifficultyItems(prev => ({ ...prev, ...savedDifficulties }));
            setSelectedFieldDifficultyItems(prev => ({ ...prev, ...savedFieldDifficulties }));
          }

          // 분야별 난이도 항목 마스터 데이터 로드
          if (estimation.fieldDifficultyItems && Array.isArray(estimation.fieldDifficultyItems) && estimation.fieldDifficultyItems.length > 0) {
            console.log('[LOAD] fieldDifficultyItems 설정:', { count: estimation.fieldDifficultyItems.length, items: estimation.fieldDifficultyItems });
            // ID 기준 중복 제거
            const uniqueItems = estimation.fieldDifficultyItems.filter((item: any, index: number, self: any[]) =>
              index === self.findIndex((t) => t.id === item.id)
            );
            setFieldDifficultyItems(uniqueItems);
          } else {
            console.log('[LOAD] ⚠️ fieldDifficultyItems가 없음 - 빈 배열로 유지');
          }

          // 모든 state 업데이트 후 강제 리렌더링을 위한 로그
          console.log('[LOAD] 모든 데이터 로드 완료, state 업데이트됨');
        }
      } catch (error) {
        console.error("Error loading estimation data:", error);
      }
    };

    loadEstimationData();
  }, [currentEstimationId, isNewEstimation, id]);

  // 저장된 선택 가중치 ID 복원 (weightTable/pidWeightTable이 로드된 후)
  useEffect(() => {
    if (savedSelectedWeightId !== null && weightTable.length > 0) {
      const weightExists = weightTable.some((w: any) => w.id === savedSelectedWeightId);
      if (weightExists) {
        console.log('[LOAD] 기준정보에서 selectedWeightId 복원:', savedSelectedWeightId, '가중치:', weightTable.find((w: any) => w.id === savedSelectedWeightId));
        setSelectedWeightId(savedSelectedWeightId);
        setSavedSelectedWeightId(null); // 복원 후 초기화
      } else {
        console.log('[LOAD] 기준정보에 selectedWeightId가 없음:', savedSelectedWeightId, '가중치 테이블:', weightTable.map((w: any) => w.id));
      }
    }
  }, [savedSelectedWeightId, weightTable]);

  useEffect(() => {
    if (savedSelectedPidWeightId !== null && pidWeightTable.length > 0) {
      const weightExists = pidWeightTable.some((w: any) => w.id === savedSelectedPidWeightId);
      if (weightExists) {
        console.log('[LOAD] 기준정보에서 selectedPidWeightId 복원:', savedSelectedPidWeightId, '가중치:', pidWeightTable.find((w: any) => w.id === savedSelectedPidWeightId));
        setSelectedPidWeightId(savedSelectedPidWeightId);
        setSavedSelectedPidWeightId(null); // 복원 후 초기화
      } else {
        console.log('[LOAD] 기준정보에 selectedPidWeightId가 없음:', savedSelectedPidWeightId, '가중치 테이블:', pidWeightTable.map((w: any) => w.id));
      }
    }
  }, [savedSelectedPidWeightId, pidWeightTable]);

  // 탭 전환 시 데이터 확인 및 로그
  useEffect(() => {
    console.log(`[TAB] 탭 전환: ${activeTab}`, {
      activeTab,
      currentEstimationId,
      isNewEstimation,
      developmentItemsCount: developmentItems.length,
      modeling3dItemsCount: modeling3dItems.length,
      pidItemsCount: pidItems.length,
      weightTableCount: weightTable.length,
      pidWeightTableCount: pidWeightTable.length,
      selectedWeightId,
      selectedPidWeightId,
      mmCalculationBase,
    });

    // P&ID 탭일 때 상세 데이터 출력
    if (activeTab === "pid") {
      console.log("========== [P&ID 탭] 가중치 선택값 ==========");
      console.log({
        selectedPidWeightId,
        selectedPidWeight: selectedPidWeightId ? pidWeightTable.find(w => w.id === selectedPidWeightId) : null,
        selectedPidWeightValue: selectedPidWeightValue,
      });

      console.log("========== [P&ID 탭] 가중치 테이블 ==========");
      console.log(pidWeightTable);

      console.log("========== [P&ID 탭] 공수기준표 데이터 ==========");
      console.log({
        pidItemsCount: pidItems.length,
        pidItems: pidItems.map(item => ({
          id: item.id,
          category: item.category,
          quantity: item.quantity,
          baseMd: item.baseMd,
          calculatedMd: item.calculatedMd,
          remarks: item.remarks,
        })),
        totalPidMd,
        totalPidMm,
        finalPidMd,
        finalPidMm,
      });
      console.log("===========================================");
    }
  }, [activeTab]);

  // 현재 선택된 M/D 산정 - useMemo로 최적화
  const currentEstimation = useMemo(
    () => mdEstimations.find((e) => e.id === currentEstimationId),
    [mdEstimations, currentEstimationId]
  );

  const handleStatusChange = async (newStatus: string) => {
    if (!currentEstimationId) {
      alert("먼저 저장을 해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/md-estimations/${currentEstimationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Update local state
        setMdEstimations(prev => prev.map(est =>
          est.id === currentEstimationId ? { ...est, status: newStatus } : est
        ));
        // alert("상태가 변경되었습니다."); // UI가 즉시 반영되므로 알림은 생략하거나 토스트로 대체 가능
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`상태 변경 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (e) {
      console.error(e);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              M/D 산정 - {project.name}
            </h1>
            <p className="text-sm text-gray-600">
              {project.projectCode} | {project.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusDropdown
            status={currentEstimation?.status || 'STANDBY'}
            onStatusChange={handleStatusChange}
            disabled={currentEstimation?.status === 'COMPLETED' || currentEstimation?.status === 'approved'}
            phase="MD_ESTIMATION"
          />

          <Button
            variant="secondary"
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm"
          >
            <Download className="h-4 w-4" />
            엑셀
          </Button>

          <Button
            variant="primary"
            onClick={async () => {
              await handleSave();
              await handleStatusChange('COMPLETED');
            }}
            disabled={isSaving || (currentEstimation?.status === 'COMPLETED' || currentEstimation?.status === 'approved')}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            작성완료
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-4 text-sm font-medium ${activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {activeTab === "overview" && (
          <div className="p-6" key={`overview-${currentEstimationId || 'new'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                M/D 산정 요약
              </h2>
              <button
                onClick={handleSave}
                disabled={isSaving || (currentEstimation?.status === "COMPLETED")}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>

            {/* 요약 카드 */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-500">
                  M/D 가중치
                </div>
                <div className="mt-2 text-2xl font-semibold text-blue-600">
                  {calculatedDifficulty.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-500">
                  개발 M/M
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-semibold text-blue-900">
                    {formatNumber(finalDevelopmentMm, 2)} M/M
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="text-sm font-medium text-blue-700">
                  전체 M/M
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-300 bg-blue-100 px-3 py-2">
                  <Calculator className="h-4 w-4 text-blue-700" />
                  <span className="text-2xl font-semibold text-blue-900">
                    {formatNumber(totalMm, 2)} M/M
                  </span>
                </div>
              </div>
            </div>

            {/* 상세 내역 */}
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                상세 내역
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2">
                  <span className="text-sm text-gray-600">개발 M/M</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(finalDevelopmentMm, 2)} M/M
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2">
                  <span className="text-sm text-gray-600">3D 모델링 M/M</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(finalModeling3dMm, 2)} M/M
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2">
                  <span className="text-sm text-gray-600">P&ID M/M</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(finalPidMm, 2)} M/M
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "difficulty" && (
          <div className="p-6" key={`difficulty-${currentEstimationId || 'new'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                M/D 가중치 산정
              </h2>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (currentEstimation?.status === "COMPLETED")}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>

            {/* 난이도 계산 결과 - 맨 위로 이동 */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-500">공통 난이도 합계</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {commonDifficultySum}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-500">분야별 난이도 합계</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {fieldDifficultySum}
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="text-sm font-medium text-blue-700">M/D 가중치</div>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-300 bg-blue-100 px-3 py-2">
                  <Calculator className="h-4 w-4 text-blue-700" />
                  <span className="text-2xl font-bold text-blue-900">
                    {calculatedDifficulty.toFixed(2)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-blue-600">
                  이 값이 개발항목별 M/D 산정에 사용됩니다.
                </p>
              </div>
            </div>

            {/* 난이도 산정 안내 */}
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <span className="font-bold">※ 산정 방식:</span> 각 항목에 대해 난이도(0, 1, 2, 3)를 선택하면 가중치가 자동 계산됩니다.
                <br />
                <span className="font-bold">※ 최종 M/D 가중치:</span> 선택된 항목들의 난이도 합계를 기반으로 계산됩니다.
              </p>
            </div>

            {/* 공통 난이도 */}
            <div className="mb-10">
              <h3 className="mb-4 text-base font-bold text-gray-900 px-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                공통 난이도 산정
              </h3>
              <div className="neo-light-card border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-gray-200">
                      <tr>
                        <th className="w-[150px] px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                          구분
                        </th>
                        <th className="px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                          내용
                        </th>
                        <th className="px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                          설명
                        </th>
                        <th className="w-[120px] px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-center">
                          난이도
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sortedCommonDifficultyItems.map((item, index) => {
                        const selectedDifficulty = selectedDifficultyItems[item.id] ?? item.difficulty;
                        const isHighDifficulty = selectedDifficulty === 3;

                        // 카테고리 셀 병합 로직
                        const prevItem = index > 0 ? sortedCommonDifficultyItems[index - 1] : null;
                        const isFirstInCategory = !prevItem || prevItem.category !== item.category;

                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              "transition-all duration-200 h-[52px] relative",
                              isHighDifficulty
                                ? "bg-orange-50/50 hover:bg-orange-100/50"
                                : "hover:bg-slate-50/50"
                            )}
                            style={{ zIndex: sortedCommonDifficultyItems.length - index }}
                          >
                            {isFirstInCategory && (
                              <td
                                rowSpan={commonCategoryCounts[item.category]}
                                className="px-4 py-2 text-sm font-bold text-center border-r border-gray-200 bg-gray-50/50 text-gray-900 align-middle"
                              >
                                {item.category}
                              </td>
                            )}
                            <td className={cn(
                              "px-4 py-2 text-sm border-r border-gray-200",
                              isHighDifficulty ? "font-bold text-orange-900" : "text-gray-900 font-medium"
                            )}>
                              {item.content}
                            </td>
                            <td className={cn(
                              "px-4 py-2 text-sm border-r border-gray-200",
                              isHighDifficulty ? "text-orange-700 font-medium" : "text-gray-500 font-medium"
                            )}>
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Dropdown
                                value={selectedDifficulty}
                                onChange={(val) => handleDifficultyItemChange(item.id, Number(val))}
                                disabled={currentEstimation?.status === "COMPLETED"}
                                options={scoreOptions}
                                align="center"
                                variant="premium"
                                className={cn(
                                  "w-full max-w-[80px] mx-auto transition-transform active:scale-95",
                                  isHighDifficulty && "border-orange-400 ring-orange-200"
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 분야별 난이도 */}
            <div className="mb-10">
              <h3 className="mb-4 text-base font-bold text-gray-900 px-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                분야별 난이도 산정
              </h3>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">※ 안내:</span> 체크박스를 선택한 분야의 난이도만 프로젝트 난이도 계산에 적용됩니다.
                </p>
              </div>
              <div className="neo-light-card border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-gray-200">
                      <tr>
                        <th className="w-[150px] px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                          적용 분야
                        </th>
                        <th className="px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                          내용
                        </th>
                        <th className="px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                          설명
                        </th>
                        <th className="w-[120px] px-4 py-4 text-sm font-bold tracking-wider text-slate-700 text-center">
                          난이도
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sortedFieldDifficultyItems.map((item, index) => {
                        const isCategorySelected = selectedFieldCategories.has(item.category);
                        const rawDifficulty = selectedFieldDifficultyItems[item.id] ?? item.difficulty;
                        const selectedDifficulty = rawDifficulty;
                        const isHighDifficulty = selectedDifficulty === 3;

                        const prevItem = index > 0 ? sortedFieldDifficultyItems[index - 1] : null;
                        const isFirstInCategory = !prevItem || prevItem.category !== item.category;

                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              "transition-all duration-200 h-[52px] relative",
                              !isCategorySelected && "opacity-60 bg-slate-50/30",
                              isHighDifficulty
                                ? "bg-orange-50/50 hover:bg-orange-100/50"
                                : isCategorySelected && "hover:bg-slate-50/50"
                            )}
                            style={{ zIndex: sortedFieldDifficultyItems.length - index }}
                          >
                            {isFirstInCategory && (
                              <td
                                rowSpan={fieldCategoryCounts[item.category]}
                                className="px-4 py-2 border-r border-gray-200 bg-gray-50/50 align-middle"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isCategorySelected}
                                    onChange={() => handleFieldCategoryToggle(item.category)}
                                    disabled={currentEstimation?.status === "COMPLETED"}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer"
                                  />
                                  <span className="text-sm font-bold text-gray-900">{item.category}</span>
                                </div>
                              </td>
                            )}
                            <td className={cn(
                              "px-4 py-2 text-sm border-r border-gray-200",
                              isHighDifficulty ? "font-bold text-orange-900" : "text-gray-900 font-medium"
                            )}>
                              {item.content}
                            </td>
                            <td className={cn(
                              "px-4 py-2 text-sm border-r border-gray-200",
                              isHighDifficulty ? "text-orange-700 font-medium" : "text-gray-500 font-medium"
                            )}>
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Dropdown
                                value={selectedDifficulty}
                                onChange={(val) => handleFieldDifficultyItemChange(item.id, Number(val))}
                                disabled={currentEstimation?.status === "COMPLETED" || !isCategorySelected}
                                options={scoreOptions}
                                align="center"
                                variant="premium"
                                className={cn(
                                  "w-full max-w-[80px] mx-auto transition-transform active:scale-95",
                                  isHighDifficulty && "border-orange-400 ring-orange-200"
                                )}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "development" && (
          <div className="p-6" key={`development-${currentEstimationId || 'new'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                개발 공수 기준표
              </h2>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (currentEstimation?.status === "completed")}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>

            {/* 난이도 작성 안내 */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex-1 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">※ 안내:</span> 프로젝트 가중치는 <span className="font-bold">가중치 탭</span>에서 작성해주세요.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">가중치:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatNumber(calculatedDifficulty, 2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 상단 왼쪽: 개발 공수 합계 요약 표, 오른쪽: 개발 산정 공수 */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  ○ 개발 공수 합계
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          구분
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          M/D
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          M/D × 가중치
                        </th>
                        <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          M/M
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {summaryByClassification.map((item) => (
                        <tr key={item.classification} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                            {item.classification}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right text-sm text-gray-600">
                            {formatNumber(item.md, 2)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right text-sm font-medium text-blue-600">
                            {formatNumber(item.mdWithDifficulty, 2)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right text-sm text-gray-600">
                            {formatNumber(item.mm, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-yellow-50">
                      <tr>
                        <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                          합계
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-right text-sm font-medium text-gray-900">
                          {formatNumber(totalSummary.md, 2)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-right text-sm font-bold text-blue-900">
                          {formatNumber(totalSummary.mdWithDifficulty, 2)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-right text-sm font-bold text-gray-900">
                          {formatNumber(totalSummary.mm, 2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 상단 오른쪽: 계산 결과 요약 */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  ○ 개발 산정 공수
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">합계 (M/D)</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(totalDevelopmentMd, 2)} M/D
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <span className="text-sm font-semibold text-blue-900">
                      최종 M/D
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatNumber(totalSummary.mdWithDifficulty, 2)} M/D
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                    <span className="text-sm font-semibold text-green-900">
                      최종 M/M
                    </span>
                    <span className="text-lg font-bold text-green-900">
                      {formatNumber(finalDevelopmentMm, 2)} M/M
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <label className="text-sm text-gray-600">M/M 계산 기준값:</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={mmCalculationBase}
                      onChange={(e) => setMmCalculationBase(parseFloat(e.target.value) || 21)}
                      disabled={currentEstimation?.status === "completed"}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-gray-600">일</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단: 공수 기준표 */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  ○ 개발 공수 기준표
                </h3>
                <button
                  onClick={handleAddDevelopmentItem}
                  disabled={currentEstimation?.status === "completed"}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                  항목 추가
                </button>
              </div>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">※ 계산 방식:</span> M/D = 수량 × 기준M/D, 최종 M/M = 개발항목 M/D 합계 × 프로젝트 가중치
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                        구분
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                        내용
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                        수량
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                        기준M/D
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-center border-r border-gray-200">
                        산정M/D
                      </th>
                      <th className="relative px-3 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {developmentItems.map((item) => {
                      // 새로 추가한 항목인지 구분 (기본 항목은 id가 1~25 범위, 저장된 항목은 development_item_id가 있거나 id가 10000 이상)
                      // 저장된 데이터를 로드할 때는 development_item_id가 있으면 기본 항목, 없으면 새 항목
                      // 새로 추가한 항목은 id가 10000 이상이거나 development_item_id가 null인 경우
                      const isNewItem = item.id > 25 && item.id >= 10000;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-2">
                            {isNewItem ? (
                              <Dropdown
                                value={item.classification || ""}
                                onChange={(val) =>
                                  handleDevelopmentItemChange(
                                    item.id,
                                    "classification",
                                    val
                                  )
                                }
                                disabled={currentEstimation?.status === "completed"}
                                options={[
                                  { value: "", label: "구분 선택" },
                                  { value: "PM", label: "PM" },
                                  { value: "개발", label: "개발" },
                                  { value: "I/F", label: "I/F" },
                                  { value: "2D디자인", label: "2D디자인" },
                                  { value: "포탈", label: "포탈" },
                                ]}
                                variant="premium"
                                className="w-full"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-900">
                                {item.classification}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isNewItem ? (
                              <input
                                type="text"
                                value={item.content || ""}
                                onChange={(e) =>
                                  handleDevelopmentItemChange(
                                    item.id,
                                    "content",
                                    e.target.value
                                  )
                                }
                                placeholder="내용 입력"
                                disabled={currentEstimation?.status === "completed"}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">
                                {item.content}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.quantity || ""}
                              onChange={(e) =>
                                handleDevelopmentItemChange(
                                  item.id,
                                  "quantity",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              disabled={currentEstimation?.status === "completed"}
                              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.standardMd || ""}
                              onChange={(e) =>
                                handleDevelopmentItemChange(
                                  item.id,
                                  "standardMd",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              disabled={currentEstimation?.status === "completed"}
                              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div className="flex items-center justify-end gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                              <Calculator className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">
                                {formatNumber(item.calculatedMd || 0, 2)} M/D
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            {isNewItem && (
                              <button
                                onClick={() => handleRemoveDevelopmentItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-right text-sm font-medium text-gray-900"
                      >
                        합계 (M/D)
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center justify-end gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            {formatNumber(totalDevelopmentMd, 2)} M/D
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "modeling3d" && (
          <div className="p-6" key={`modeling3d-${currentEstimationId || 'new'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                3D 모델링(배치 포함) 공수 기준표
              </h2>
              <button
                onClick={handleSave}
                disabled={isSaving || (currentEstimation?.status === "completed")}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>

            {/* 상단 왼쪽: M/D 산정 가중치 테이블 */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    ○ M/D 산정 가중치 (3D 입력자료)
                  </h3>
                  <button
                    onClick={handleAddWeightItem}
                    disabled={currentEstimation?.status === "completed"}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                    추가
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          내용
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          가중치
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          설명
                        </th>
                        <th className="relative px-2 py-2">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {weightTable.map((weight) => {
                        // 내용과 설명이 모두 입력되었는지 확인
                        const isCompleted = weight.content.trim() !== "" && weight.description.trim() !== "";

                        return (
                          <tr
                            key={weight.id}
                            className={
                              selectedWeightId === weight.id
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="whitespace-nowrap px-2 py-2">
                              {isCompleted ? (
                                <span className="text-sm text-gray-900">{weight.content}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={weight.content}
                                  onChange={(e) =>
                                    handleWeightItemChange(
                                      weight.id,
                                      "content",
                                      e.target.value
                                    )
                                  }
                                  placeholder="내용 입력"
                                  disabled={currentEstimation?.status === "completed"}
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                              )}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={weight.weight}
                                onChange={(e) =>
                                  handleWeightItemChange(
                                    weight.id,
                                    "weight",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={currentEstimation?.status === "completed"}
                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-2 py-2">
                              {isCompleted ? (
                                <span className="text-sm text-gray-600">{weight.description}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={weight.description}
                                  onChange={(e) =>
                                    handleWeightItemChange(
                                      weight.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="설명 입력"
                                  disabled={currentEstimation?.status === "completed"}
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                              )}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right">
                              <button
                                onClick={() => setSelectedWeightId(weight.id)}
                                disabled={currentEstimation?.status === "completed"}
                                className={`rounded px-2 py-1 text-xs ${selectedWeightId === weight.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                선택
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 상단 오른쪽: 계산 결과 요약 */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  ○ 3D 모델링 산정 공수
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">합계 (M/D)</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(totalModeling3dMd, 2)} M/D
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">선택된 가중치</span>
                    {selectedWeightId ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedWeight?.content} (
                        {formatNumber(selectedWeightValue, 2)})
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-semibold text-red-600">
                          미선택 - 가중치를 선택해주세요
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <span className="text-sm font-semibold text-blue-900">
                      최종 M/D
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatNumber(finalModeling3dMd, 2)} M/D
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                    <span className="text-sm font-semibold text-green-900">
                      최종 M/M
                    </span>
                    <span className="text-lg font-bold text-green-900">
                      {formatNumber(finalModeling3dMm, 2)} M/M
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <label className="text-sm text-gray-600">M/M 계산 기준값:</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={mmCalculationBase}
                      onChange={(e) => setMmCalculationBase(parseFloat(e.target.value) || 21)}
                      disabled={currentEstimation?.status === "completed"}
                      className="w-20 rounded-xl border border-gray-300 px-2 h-10 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600">일</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단: 공수 기준표 */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  ○ 3D 모델링(배치 포함) 공수 기준표
                </h3>
              </div>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">※ 계산 방식:</span> 산정M/D = 수량 × 기준M/D, 최종M/D = 합계(M/D) × 가중치, 최종M/M = 최종M/D / M/M 계산 기준값
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        구분
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        난이도
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        수량
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        기준M/D
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        산정M/D
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left">
                        비고
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {modeling3dItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900">
                          {item.category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-600">
                          {item.difficulty || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleModeling3dItemChange(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={currentEstimation?.status === "completed"}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.baseMd || ""}
                            onChange={(e) =>
                              handleModeling3dItemChange(
                                item.id,
                                "baseMd",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={currentEstimation?.status === "completed"}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                              {formatNumber(item.calculatedMd || 0, 2)} M/D
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {item.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-right text-sm font-medium text-gray-900"
                      >
                        합계 (M/D)
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            {formatNumber(totalModeling3dMd, 2)} M/D
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pid" && (
          <div className="p-6" key={`pid-${currentEstimationId || 'new'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                P&ID 공수 기준표
              </h2>
              <button
                onClick={handleSave}
                disabled={isSaving || (currentEstimation?.status === "completed")}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>

            {/* 상단 왼쪽: M/D 산정 가중치 테이블 */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    ○ M/D 산정 가중치 (전환 방식)
                  </h3>
                  <button
                    onClick={handleAddPidWeightItem}
                    disabled={currentEstimation?.status === "completed"}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                    추가
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          내용
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          가중치
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          설명
                        </th>
                        <th className="relative px-2 py-2">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {pidWeightTable.map((weight) => {
                        return (
                          <tr
                            key={weight.id}
                            className={
                              selectedPidWeightId === weight.id
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="whitespace-nowrap px-2 py-2">
                              <input
                                type="text"
                                value={weight.content || ""}
                                onChange={(e) =>
                                  handlePidWeightItemChange(
                                    weight.id,
                                    "content",
                                    e.target.value
                                  )
                                }
                                placeholder="내용 입력"
                                disabled={currentEstimation?.status === "completed"}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="whitespace-nowrap px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={weight.weight}
                                onChange={(e) =>
                                  handlePidWeightItemChange(
                                    weight.id,
                                    "weight",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={currentEstimation?.status === "completed"}
                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={weight.description || ""}
                                onChange={(e) =>
                                  handlePidWeightItemChange(
                                    weight.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="설명 입력"
                                disabled={currentEstimation?.status === "completed"}
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right">
                              <button
                                onClick={() => setSelectedPidWeightId(weight.id)}
                                disabled={currentEstimation?.status === "completed"}
                                className={`rounded px-2 py-1 text-xs ${selectedPidWeightId === weight.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                선택
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 상단 오른쪽: 계산 결과 요약 */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  ○ P&ID 산정 공수
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">합계 (M/D)</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(totalPidMd, 2)} M/D
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">선택된 가중치</span>
                    {selectedPidWeightId ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedPidWeight?.content} (
                        {formatNumber(selectedPidWeightValue, 2)})
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-semibold text-red-600">
                          미선택 - 가중치를 선택해주세요
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <span className="text-sm font-semibold text-blue-900">
                      최종 M/D
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatNumber(finalPidMd, 2)} M/D
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                    <span className="text-sm font-semibold text-green-900">
                      최종 M/M
                    </span>
                    <span className="text-lg font-bold text-green-900">
                      {formatNumber(finalPidMm, 2)} M/M
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <label className="text-sm text-gray-600">M/M 계산 기준값:</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={mmCalculationBase}
                      onChange={(e) => setMmCalculationBase(parseFloat(e.target.value) || 21)}
                      disabled={currentEstimation?.status === "completed"}
                      className="w-20 rounded-xl border border-gray-300 px-2 h-10 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600">일</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단: 공수 기준표 */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  ○ P&ID 공수 기준표
                </h3>
              </div>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">※ 계산 방식:</span> 산정M/D = 수량 × 기준M/D, 최종M/D = 합계(M/D) × 가중치, 최종M/M = 최종M/D / M/M 계산 기준값
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        구분
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        수량
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        기준M/D
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left border-r border-gray-200">
                        산정M/D
                      </th>
                      <th className="px-3 py-4 text-sm font-bold tracking-wider text-slate-700 text-left">
                        비고
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pidItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900">
                          {item.category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handlePidItemChange(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={currentEstimation?.status === "completed"}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.baseMd || ""}
                            onChange={(e) =>
                              handlePidItemChange(
                                item.id,
                                "baseMd",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={currentEstimation?.status === "completed"}
                            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                            <Calculator className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                              {formatNumber(item.calculatedMd || 0, 2)} M/D
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {item.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-sm font-medium text-gray-900"
                      >
                        합계 (M/D)
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            {formatNumber(totalPidMd, 2)} M/D
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* M/D 산정 목록 모달 */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                M/D 산정 목록
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowListModal(false)}
                  className="rounded-xl border border-gray-300 bg-white px-4 h-10 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      버전
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      총 M/D
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      총 M/M
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      작성자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      작성일
                    </th>
                    <th className="relative px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {mdEstimations.map((estimation) => (
                    <tr
                      key={estimation.id}
                      className={
                        estimation.id === currentEstimationId
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        v{estimation.version}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatNumber(estimation.totalMd, 2)} M/D
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatNumber(estimation.totalMm, 2)} M/M
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${estimation.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {estimation.status === "completed" ? "완료" : "작성중"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {estimation.createdBy}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {estimation.createdAt}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSelectEstimation(estimation.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            선택
                          </button>
                          <button
                            onClick={() => handleCopyEstimation(estimation.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="복사"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentEstimation && !isNewEstimation && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                <span className="font-bold">현재 선택:</span> M/D 산정 v{currentEstimation.version} ({currentEstimation.status === "completed" ? "완료" : "작성중"})
              </span>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
