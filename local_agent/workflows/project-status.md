---
description: 프로젝트 상태 관리 및 단계 전환 표준 가이드
---

# 프로젝트 상태 및 단계 전환 표준

이 워크플로우는 프로젝트의 생명주기(Lifecycle)에 따른 단계 및 상태값과 단계 전환 로직을 규정합니다.

## 프로젝트 단계 (Project Phases)
시스템의 프로젝트 단계는 '사업단계' 기준정보에 따라 관리되며, 크게 3개의 그룹으로 나뉩니다.

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

**전체 시퀀스:** 리드 → 영업기회 → M/D산정 → VRB 심의 → 계약 → 수지분석 → 프로젝트 진행 → 수지정산 → 하자보증 → 유상유지보수


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
각 모듈의 상태가 `COMPLETED`로 변경될 때, `we_projects` 테이블의 상태와 단계를 다음과 같이 동기화합니다.

| 현재 완료된 단계 | 프로젝트 상태 (`status`) | 프로젝트 현재 단계 (`current_phase`) |
| :--- | :--- | :--- |
| **MD 산정** | `md_estimation_completed` | `vrb` |
| **VRB 검토** | `vrb_completed` | `profitability` |
| **수지분석서** | `profitability_completed` | `settlement` |
| **수지정산서** | `completed` | `completed` |

## API 구현 가이드
- **저장(PUT/POST) 시:** 
  기존 상태가 `STANDBY`인 경우 자동으로 `IN_PROGRESS`로 업데이트하는 로직을 포함해야 합니다.
- **완료 처리 시:** 
  단순 상태 변경뿐만 아니라 위 표에 정의된 `we_projects` 테이블의 업데이트 프로세스를 반드시 수행해야 합니다.

## 프론트엔드 구현 가이드
- `status === 'COMPLETED'` 조건을 체크하여 `isReadOnly` 상태를 관리합니다.
- 리스트 페이지에서는 `getStatusLabel` 함수를 사용하여 통일된 한글 라벨을 표시합니다.
- **삭제 버튼 노출 로직:**
  - 현재 상태가 **`IN_PROGRESS` (작성 중)**일 때만 삭제 버튼이 화면에 노출됩니다.
  - 삭제 버튼의 디자인은 `ui-standard.md`의 삭제 버튼 표준을 따릅니다.
