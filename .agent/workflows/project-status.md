---
description: 프로젝트 단계 관리 및 단계별 상태 표준 가이드
---

# 프로젝트 사업단계 시스템

## 1. 데이터 구조 (Single Source of Truth)

| 테이블 | 역할 |
|---|---|
| `project_phase_groups` | 그룹 정의 (영업, 프로젝트, 유지보수 등) |
| `project_phases` | 단계 정의 (리드, VRB, 수지분석 등) |
| `project_phase_statuses` | **단계별 상태 목록** — 코드/이름/색상/순서 (관리자 설정) |
| `we_project_phase_progress` | **단일 소스** — 프로젝트별 단계 진행 상태 |
| `we_projects.current_phase` | 현재 활성 단계 code |

> [!CAUTION]
> `we_project_profitability.status`, `we_project_vrb_reviews.status`, `we_project_settlement.status` 컬럼은 **단계/상태 관리에 사용하지 않습니다.**  
> 모든 단계 상태는 반드시 `we_project_phase_progress.status`에서만 읽고 씁니다.

---

## 2. 핵심 원칙 — 동적 상태 코드

상태 코드(`STANDBY`, `IN_PROGRESS`, `COMPLETED` 등)는 `project_phase_statuses` 테이블에서 동적으로 읽습니다.  
**코드를 문자열로 직접 비교하지 않습니다.**

| 의미 | 표현 (올바름 ✅) | 표현 (금지 ❌) |
|---|---|---|
| 시작 전 | `isInitialStatus` | `status === 'STANDBY'` |
| 진행 중 | `!isInitialStatus && !isFinalStatus` | `status === 'IN_PROGRESS'` |
| 완료 | `isFinalStatus` | `status === 'COMPLETED'` |

---

## 3. 상태 전환 흐름

```
프로젝트 생성
  └→ initProjectPhases()
       각 단계의 첫 번째 상태(project_phase_statuses display_order=1)로 초기화

화면에서 저장
  └→ onSaveSuccess()
       isInitialStatus이면 → PATCH phase-progress {action:"start"} → 두 번째 상태로 전환

작성완료 버튼
  └→ onCompleteSuccess()
       advance-phase API →
         ① 현재 단계의 마지막 상태로 업데이트
         ② we_projects.current_phase = 다음 단계
              ⚠️ 단, current_phase는 절대 뒤로 밀리지 않음
                 nextPhase.display_order > 현재 current_phase.display_order 일 때만 갱신
                 (예: 수지분석 완료 후 VRB를 뒤늦게 완료해도 current_phase는 유지)
         ③ 다음 단계의 첫 번째 상태로 초기화 (ON CONFLICT DO NOTHING — 이미 초기화됨)
```

> [!IMPORTANT]
> **중간 단계 완료 처리 규칙**  
> 프로젝트는 단계를 순서대로 진행하지 않고 중간 단계를 건너뛰거나 나중에 소급 완료할 수 있습니다.  
> `advance-phase` API는 `current_phase`를 갱신할 때 반드시 **단방향 전진**만 허용합니다.  
> `we_projects.current_phase`는 항상 **가장 최근에 진입한(display_order가 가장 높은) 단계**를 유지해야 합니다.

---

## 4. Phase API (통합 API — 3개만 사용)

> [!IMPORTANT]
> 프로젝트 단계/상태 관련 작업은 **아래 3개 API만 사용합니다.**  
> 개별 화면(profitability/status, settlement/status 등) 전용 status API는 삭제되었습니다.

| API | 메서드 | 역할 |
|---|---|---|
| `/api/projects/[id]/phase-status` | GET | 전체 단계 진행 상황 조회 (initialStatus/finalStatus 포함) |
| `/api/projects/[id]/phase-progress` | PATCH | 상태 변경 (`action:"start"` 또는 `status:"CODE"`) |
| `/api/projects/[id]/advance-phase` | POST | 완료 처리 + 다음 단계로 전환 |

---

## 5. 사업단계 설정 API (관리자 화면 전용)

| API | 설명 |
|---|---|
| `/api/settings/phase-groups` | 그룹 CRUD |
| `/api/settings/phases` | 단계 CRUD |
| `/api/settings/phase-statuses` | 단계별 상태 CRUD |
| `/api/settings/phase-lifecycle` | 그룹→단계→상태 트리 조회 |

---

## 6. `useProjectPhase` 훅 (화면 표준 패턴)

```ts
const {
  status,           // 현재 상태 코드 (동적)
  isInitialStatus,  // 첫 번째 상태 여부
  isFinalStatus,    // 마지막 상태 여부
  finalStatus,      // 마지막 상태 코드값
  onSaveSuccess,    // 저장 후 호출 → 초기 상태면 다음 상태 자동 전환
  onCompleteSuccess,// 작성완료 후 호출 → 마지막 상태 + 다음 단계 전환
  loadPhaseStatus,  // 수동 상태 재로드
} = useProjectPhase(projectId, 'vrb');

// 버튼 제어
const canEdit    = !isFinalStatus;
const canDelete  = !isInitialStatus && !isFinalStatus;
const canComplete = !isInitialStatus && !isFinalStatus;
```

---

## 7. 핵심 함수 (lib/phase.ts)

| 함수 | 역할 |
|---|---|
| `getPhaseStatuses(phaseCode)` | 단계별 상태 목록 (display_order 순) |
| `getInitialStatus(phaseCode)` | 첫 번째 상태 코드 |
| `getFinalStatus(phaseCode)` | 마지막 상태 코드 |
| `initProjectPhases(projectId)` | 프로젝트 생성 시 초기화 |
| `advanceProjectPhase(projectId, phaseCode)` | 완료 + 다음 단계 전환 |
| `updatePhaseStatus(projectId, phaseCode, statusCode)` | 상태 코드 업데이트 |
