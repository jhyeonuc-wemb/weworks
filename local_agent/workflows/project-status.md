---
description: 프로젝트 상태 관리 및 단계 전환 표준 가이드
---

# 프로젝트 상태 및 단계 전환 표준

이 워크플로우는 프로젝트의 생명주기(Lifecycle)에 따른 단계 및 상태값과 단계 전환 로직을 규정합니다.

## 프로젝트 단계 (Project Phases)
시스템의 프로젝트 단계는 '사업단계' 기준정보에 따라 관리되며, 크게 4개의 그룹으로 나뉩니다.

### 1. 영업/PS 그룹
- **리드 (Lead):** 잠재 고객 확보 단계
- **영업기회 (Sales Opportunity):** 구체적인 사업 제안 및 영업 활동 단계
- **M/D산정 (M/D Estimation):** 투입 인력 및 공수 산정 단계
- **VRB 심의 (VRB Review):** 사업 수주 및 리스크 심의 단계

### 2. 프로젝트 그룹
- **계약 (Contract):** 사업 수주 및 정식 계약 체결 단계
- **수지분석 (Profitability Analysis):** 예산 편성 및 예상 이익 분석 단계
- **프로젝트 진행 (Project In Progress):** 실제 수행 단계
- **수지정산 (Settlement):** 프로젝트 종료 후 실적 정산 단계

### 3. 유지보수 그룹
- **하자보증 (Warranty):** 종료 후 무상 하자보수 기간
- **유상유지보수 (Paid Maintenance):** 정식 유지보수 계약 수행 단계

### 4. 종료 그룹
- **종료 (Closure):** 프로젝트 종료

**전체 시퀀스:** 리드 → 영업기회 → M/D산정 → VRB 심의 → 계약 → 수지분석 → 프로젝트 진행 → 수지정산 → 하자보증 → 유상유지보수 → 종료


## 표준 상태 코드 (Common Codes)
프로젝트의 각 단계별 상태는 `we_codes` 테이블의 `PROJECT_PHASE_STATUS` 하위에 정의되어 관리됩니다.

### 코드 구조
- **Root:** `PROJECT_PHASE_STATUS`
  - **MD 산정 (`MD_ESTIMATION`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성
    - `COMPLETED`: 완료
  - **VRB 심의 (`VRB`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성
    - `COMPLETED`: 완료
  - **수지분석 (`PROFITABILITY`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성
    - `COMPLETED`: 완료
  - **수지정산 (`SETTLEMENT`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성
    - `COMPLETED`: 완료

### 상태 설명
1. **`STANDBY` (대기):** 
   - 저장을 한번도 하지 않음 화면 초기 상태.
   - UI 라벨: "대기" / 배경색: 회색 (`bg-gray-100`)

2. **`IN_PROGRESS` (작성):** 
   - 사용자가 한 번이라도 저장을 실행한 상태.
   - UI 라벨: "작성 중" / 배경색: 파란색 (`bg-blue-50`)

3. **`COMPLETED` (완료):**
   - 작성이 완료되어 다음 단계로 넘어갈 준비가 된 상태.
   - 완료 후에는 상세 페이지가 **Read-only** 모드로 전환되어야 함.
   - UI 라벨: "작성완료" / 배경색: 녹색 (`bg-green-50`)

## 단계 전환 (Phase Transition) 고정 로직
아래 모듈의 상태가 `COMPLETED`로 변경될 때, `we_projects` 테이블의 `current_phase가 갱신됩니다.

| 현재 완료된 단계 | 변경되는 `current_phase` |
| :--- | :--- |
| **MD 산정** | `vrb` |
| **VRB 검토** | `profitability` |
| **수지분석서** | `in_progress` |
| **수지정산서** | `completed` |

### `we_projects` 필드 역할
- **`current_phase`**: 현재 어떤 단계인지를 나타냄 (`md_estimation`, `vrb`, `profitability`, `in_progress`, `settlement`, `completed` 등)
- **`status`**: 프로젝트 전체 라이프사이클 상태만 표현
  - `active` — 진행 중인 프로젝트
  - `on_hold` — 보류
  - `completed` — 수지정산 완료 후 최종 종료
  - `cancelled` — 취소

## API 구현 가이드
- **저장(PUT/POST) 시:** 
  기존 상태가 `STANDBY`인 경우 자동으로 `IN_PROGRESS`로 업데이트하는 로직을 포함해야 합니다.
- **완료 처리 시:** 
  단순 상태 변경뿐만 아니라 위 표에 정의된 `we_projects` 테이블의 업데이트 프로세스를 반드시 수행해야 합니다.

## 프론트엔드 구현 가이드

### 1. 상태별 상단 액션 버튼 노출 정의 (4단계 공통)
각 단계(M/D산정, VRB, 수지분석서, 수지정산서)의 상단 헤더에 배치되는 버튼 노출 규칙입니다.

| 상태 | 삭제 버튼 | 엑셀 버튼 | 작성완료 버튼 |
| :--- | :---: | :---: | :---: |
| **`STANDBY` (대기)** | 비노출 | 비노출 | 비노출 |
| **`IN_PROGRESS` (작성 중)** | **노출** | **노출** | **노출** |
| **`COMPLETED` (완료)** | 비노출 | **노출** | 비노출 |


### 2. 컴포넌트 제어 규칙
- **저장 버튼 (Save):** 상태가 **`COMPLETED`**인 경우, 화면 하단 및 각 섹션의 모든 '저장' 버튼은 **비노출** 처리합니다.
- **읽기 전용 (Read-only):** `status === 'COMPLETED'` 인 경우 모든 입력 필드를 Read-only 또는 Disabled 처리합니다.
- **디자인 가이드:** 버튼의 스타일 및 배치는 `ui-standard.md`의 표준을 따릅니다.
- **상태 배지:** `StatusBadge` 컴포넌트를 사용하여 헤더 타이틀 옆에 현재 상태를 명확히 표시합니다.

