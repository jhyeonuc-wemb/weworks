---
description: 프로젝트 상태 관리 및 단계 전환 표준 가이드
---

# 프로젝트 상태 및 단계 전환 표준

이 워크플로우는 프로젝트의 생명주기(Lifecycle)에 따른 상태값과 단계 전환 로직을 규정합니다.

## 표준 상태 코드 (Common Codes)
프로젝트의 각 단계별 상태는 `we_codes` 테이블의 `PROJECT_PHASE_STATUS` 하위에 정의되어 관리됩니다.

### 코드 구조
- **Root:** `PROJECT_PHASE_STATUS`
  - **MD 산정 (`MD_ESTIMATION`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성중
    - `COMPLETED`: 완료
  - **VRB 심의 (`VRB`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성중
    - `COMPLETED`: 완료
  - **수지분석 (`PROFITABILITY`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성중
    - `COMPLETED`: 완료
  - **수지정산 (`SETTLEMENT`)**
    - `STANDBY`: 대기
    - `IN_PROGRESS`: 작성중
    - `COMPLETED`: 완료

### 상태 설명
1. **`STANDBY` (대기):** 
   - 데이터가 생성되었으나 아직 수정되지 않은 초기 상태.
   - UI 라벨: "대기" / 배경색: 회색 (`bg-gray-100`)

2. **`IN_PROGRESS` (작성중):** 
   - 사용자가 한 번이라도 저장을 실행한 상태.
   - UI 라벨: "작성중" / 배경색: 파란색 (`bg-blue-50`)

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
