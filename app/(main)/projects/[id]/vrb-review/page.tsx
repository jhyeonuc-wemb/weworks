"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, Download, XCircle } from "lucide-react";
import { Button, StatusBadge } from "@/components/ui";
import { ProjectPhaseNav } from "@/components/projects/ProjectPhaseNav";
import VrbReviewTab, { VrbReviewTabHandle } from "./components/VrbReviewTab";
import ChecklistTab from "./components/ChecklistTab";
import MdEstimationTab from "./components/MdEstimationTab";
import { useProjectPhase } from "@/hooks/useProjectPhase";

const TABS = [
  { id: "vrb", label: "VRB 심의" },
  { id: "checklist", label: "난이도" },
  { id: "md-estimation", label: "M/D 산정" },
];

export default function VrbReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("vrb");
  const [project, setProject] = useState<{
    name: string;
    projectCode?: string;
    customerName?: string;
  } | null>(null);
  const [vrbId, setVrbId] = useState<number | null>(null);
  const [vrbReviewResult, setVrbReviewResult] = useState<string | undefined>(undefined);
  const vrbRef = useRef<VrbReviewTabHandle | null>(null);

  // ✅ 중앙집중 단계/상태 관리 훅 (단일 소스: we_project_phase_progress)
  // isInitialStatus: 아직 시작 안 한 상태 (구 STANDBY 역할)
  // isFinalStatus: 완료된 상태 (구 COMPLETED 역할)
  const { status: vrbStatus, isInitialStatus, isFinalStatus, onSaveSuccess, onCompleteSuccess, loadPhaseStatus } = useProjectPhase(id, "vrb");

  // 프로젝트 정보 + VRB ID/review_result 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, vrbRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/vrb-reviews?projectId=${id}`),
        ]);

        if (projectRes.ok) {
          const data = await projectRes.json();
          setProject({
            name: data.project.name,
            projectCode: data.project.projectCode,
            customerName: data.project.customerName || "미지정",
          });
        }

        // VRB ID와 review_result만 vrb_reviews 테이블에서 로드
        if (vrbRes.ok) {
          const vrbData = await vrbRes.json();
          const reviews = (vrbData.reviews || []).filter((r: any) => {
            const rId = typeof r.project_id === "string"
              ? parseInt(r.project_id, 10)
              : Number(r.project_id);
            return rId === parseInt(id, 10);
          });

          if (reviews.length > 0) {
            const latest = reviews[0];
            setVrbId(latest.id);
            const detailRes = await fetch(`/api/vrb-reviews/${latest.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              setVrbReviewResult(detailData.review?.review_result || undefined);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching VRB page data:", e);
      }
    };
    fetchData();
  }, [id]);

  const isVrbTab = activeTab === "vrb";
  // ✅ 동적 상태 조건 (project_phase_statuses 기반, 하드코딩 없음)
  const canDelete = !isInitialStatus && !isFinalStatus && !!vrbId && isVrbTab; // 진행 중 상태
  const canExcel = !isInitialStatus; // 시작 이후
  const canComplete = !isFinalStatus && !isInitialStatus; // 진행 중
  const showReviewResult = isFinalStatus && !!vrbReviewResult; // 완료 상태

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}`}
            className="p-2 -ml-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 line-clamp-2 max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[800px] leading-snug">
                <span className="text-blue-600">VRB</span> - {project?.name || "프로젝트"}
              </h1>
              <StatusBadge status={vrbStatus} className="h-9" />
              <ProjectPhaseNav projectId={id} />
            </div>
            <p className="text-sm text-gray-600">
              {project?.projectCode} | {project?.customerName}
            </p>
          </div>
        </div>

        {/* 헤더 우측: 심의 결과 + 액션 버튼 */}
        {(showReviewResult || canDelete || canExcel || canComplete) && (
          <div className="flex items-center gap-3">
            {showReviewResult && (
              vrbReviewResult === "PROCEED" ? (
                <span className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  심의결과 : 진행
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  심의결과 : 미진행
                </span>
              )
            )}
            {canDelete && (
              <Button
                variant="secondary"
                onClick={() => vrbRef.current?.deleteVrb()}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            )}
            {canExcel && (
              <Button
                variant="secondary"
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm transition-all"
              >
                <Download className="h-4 w-4" />
                엑셀
              </Button>
            )}
            {canComplete && (
              <Button
                variant="primary"
                onClick={() => vrbRef.current?.complete()}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                작성완료
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {activeTab === "vrb" && (
          <VrbReviewTab
            ref={vrbRef}
            projectId={id}
            onTabChange={(tabId) => setActiveTab(tabId)}
            onStatusChange={async (status, vid, reviewResult) => {
              setVrbId(vid);
              setVrbReviewResult(reviewResult);
              // ✅ 훅의 표준 메서드 사용
              if (status === "COMPLETED") {
                // 심의결과가 '미진행'이면 종료 단계로 직접 이동 (분기)
                const isMijinhaeng = reviewResult === 'STOP';
                await onCompleteSuccess(isMijinhaeng ? { targetPhaseCode: 'closure' } : undefined);
              } else {
                await loadPhaseStatus();
              }
            }}
          />
        )}
        {activeTab === "checklist" && <ChecklistTab projectId={id} vrbStatus={vrbStatus} />}
        {activeTab === "md-estimation" && (
          <MdEstimationTab projectId={id} vrbStatus={vrbStatus} />
        )}
      </div>
    </div>
  );
}
