"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, Download, XCircle } from "lucide-react";
import { Button, StatusBadge } from "@/components/ui";
import { ProjectPhaseNav } from "@/components/projects/ProjectPhaseNav";
import VrbReviewTab, { VrbReviewTabHandle } from "./components/VrbReviewTab";
import ChecklistTab from "./components/ChecklistTab";
import MdEstimationTabs, { MdEstimationTabsHandle } from "./components/MdEstimationTabs";

const TABS = [
  { id: "vrb", label: "VRB 심의" },
  { id: "checklist", label: "난이도" },
  { id: "overview", label: "예상 M/D" },
  { id: "difficulty", label: "가중치" },
  { id: "development", label: "개발" },
  { id: "modeling3d", label: "3D 모델링" },
  { id: "pid", label: "P&ID" },
];

const MD_TAB_IDS = ["overview", "difficulty", "development", "modeling3d", "pid"];

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

  // VRB 상태 — 페이지 전체 공통 (탭과 무관하게 API에서 직접 로드)
  const [vrbStatus, setVrbStatus] = useState<string>("STANDBY");
  const [vrbId, setVrbId] = useState<number | null>(null);
  const [vrbReviewResult, setVrbReviewResult] = useState<string | undefined>(undefined);
  const vrbRef = useRef<VrbReviewTabHandle | null>(null);

  // MD 산정 ref
  const [mdEstimationId, setMdEstimationId] = useState<number | null>(null);
  const mdRef = useRef<MdEstimationTabsHandle | null>(null);

  // 페이지 레벨에서 프로젝트 정보 + VRB 상태를 직접 fetch
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
            projectCode: data.project.project_code,
            customerName: data.project.customer_name || "미지정",
          });
        }

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
            setVrbStatus(latest.status || "STANDBY");

            // 상세 조회로 review_result 가져오기
            const detailRes = await fetch(`/api/vrb-reviews/${latest.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const reviewResult = detailData.review?.review_result;
              setVrbReviewResult(reviewResult || undefined);
            }
          }
        }
      } catch (e) {
        console.error("Error fetching VRB page data:", e);
      }
    };
    fetchData();
  }, [id]);

  // 탭 상태 계산
  const isVrbTab = activeTab === "vrb";
  const isMdTab = MD_TAB_IDS.includes(activeTab);
  const currentId = isVrbTab ? vrbId : isMdTab ? mdEstimationId : null;
  const canDelete = vrbStatus === "IN_PROGRESS" && !!currentId;
  const canExcel = vrbStatus === "IN_PROGRESS" || vrbStatus === "COMPLETED";
  const canComplete = vrbStatus === "IN_PROGRESS";
  const showReviewResult = vrbStatus === "COMPLETED" && !!vrbReviewResult;

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
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                VRB - {project?.name || "프로젝트"}
              </h1>
              {vrbStatus !== "STANDBY" && <StatusBadge status={vrbStatus} />}
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
                onClick={() => {
                  if (isVrbTab) vrbRef.current?.deleteVrb();
                  else if (isMdTab) mdRef.current?.deleteEstimation();
                }}
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
            onStatusChange={(status, vid, reviewResult) => {
              setVrbStatus(status);
              setVrbId(vid);
              setVrbReviewResult(reviewResult);
            }}
          />
        )}
        {activeTab === "checklist" && <ChecklistTab projectId={id} vrbStatus={vrbStatus} />}
        {MD_TAB_IDS.includes(activeTab) && (
          <MdEstimationTabs
            ref={mdRef}
            projectId={id}
            activeSubTab={activeTab}
            onStatusChange={(status, estimationId) => {
              if (status) setVrbStatus(status);
              setMdEstimationId(estimationId);
            }}
          />
        )}
      </div>
    </div>
  );
}
