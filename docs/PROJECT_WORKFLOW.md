# 프로젝트 워크플로우 설계

## 1. 프로젝트 진행 순서

```
1. 영업단계 (딜 관리)
   ↓
2. MD 산정
   ↓
3. VRB (Value Review Board) 작성/검토
   ↓
4. 프로젝트 진행 결정 (승인/반려)
   ↓
5. 인력 매칭 (프로젝트 시작 전)
   ↓
6. 경비 산정 + 수지분석서 작성
   ↓
7. 수지분석서 승인
   ↓
8. 프로젝트 진행
   ↓
9. 프로젝트 완료 → 수지정산서 작성 (수지분석서 대비 결과 확인)
   ↓
10. 수지정산서 승인
   ↓
11. 하자보증단계 (보통 1년)
   ↓
12. 유상유지보수 (별도 계약 시)
```

---

## 2. 프로젝트 상태 정의

### 2.1 프로젝트 상태 (Project Status)

```typescript
enum ProjectStatus {
  SALES = "sales",                    // 영업단계 (딜 관리)
  MD_ESTIMATION = "md_estimation",    // MD 산정 중
  MD_ESTIMATED = "md_estimated",      // MD 산정 완료
  VRB_REVIEW = "vrb_review",          // VRB 검토 중
  VRB_APPROVED = "vrb_approved",      // VRB 승인
  VRB_REJECTED = "vrb_rejected",      // VRB 반려
  TEAM_ALLOCATION = "team_allocation", // 인력 매칭 중
  PROFITABILITY_ANALYSIS = "profitability_analysis",  // 수지분석서 작성 중
  PROFITABILITY_COMPLETED = "profitability_completed", // 수지분석서 작성 완료
  PROFITABILITY_REVIEW = "profitability_review",      // 수지분석서 검토 중
  PROFITABILITY_APPROVED = "profitability_approved",  // 수지분석서 승인
  PROFITABILITY_REJECTED = "profitability_rejected",  // 수지분석서 반려
  IN_PROGRESS = "in_progress",        // 프로젝트 진행 중
  ON_HOLD = "on_hold",                // 보류
  COMPLETED = "completed",            // 프로젝트 완료
  SETTLEMENT = "settlement",          // 정산서 작성 중
  SETTLEMENT_COMPLETED = "settlement_completed",  // 정산서 작성 완료
  SETTLEMENT_REVIEW = "settlement_review",        // 정산서 검토 중
  SETTLEMENT_APPROVED = "settlement_approved",    // 정산서 승인
  SETTLEMENT_REJECTED = "settlement_rejected",    // 정산서 반려
  WARRANTY = "warranty",              // 하자보증단계
  WARRANTY_COMPLETED = "warranty_completed",      // 하자보증 완료
  PAID_MAINTENANCE = "paid_maintenance",          // 유상유지보수
  CANCELLED = "cancelled"             // 취소
}
```

### 2.2 상태 전이 (State Transition)

```
sales (영업단계)
  → md_estimation (MD 산정 시작)
  → cancelled (딜 취소)
  
md_estimation
  → md_estimated (MD 산정 완료)
  → sales (영업단계로 복귀)

md_estimated
  → vrb_review (VRB 검토 요청)
  → md_estimation (재산정)

vrb_review
  → vrb_approved (VRB 승인)
  → vrb_rejected (VRB 반려)
  → md_estimation (재산정)

vrb_rejected
  → md_estimation (재산정)
  → cancelled (딜 취소)

vrb_approved
  → team_allocation (인력 매칭 시작)

team_allocation
  → profitability_analysis (수지분석서 작성 시작)
  → vrb_review (인력 재매칭)

profitability_analysis
  → profitability_completed (수지분석서 작성 완료)
  → team_allocation (인력 재매칭)

profitability_completed
  → profitability_review (수지분석서 검토 요청)
  → profitability_analysis (재작성)

profitability_review
  → profitability_approved (수지분석서 승인)
  → profitability_rejected (수지분석서 반려)
  → profitability_analysis (재작성)

profitability_rejected
  → profitability_analysis (재작성)
  → cancelled (프로젝트 취소)

profitability_approved
  → in_progress (프로젝트 시작)

in_progress
  → on_hold (보류)
  → completed (완료)
  → cancelled (취소)

on_hold
  → in_progress (재개)
  → cancelled (취소)

completed
  → settlement (정산서 작성 시작)

settlement
  → settlement_completed (정산서 작성 완료)
  → completed (정산서 작성 취소)

settlement_completed
  → settlement_review (정산서 검토 요청)
  → settlement (재작성)

settlement_review
  → settlement_approved (정산서 승인)
  → settlement_rejected (정산서 반려)
  → settlement (재작성)

settlement_rejected
  → settlement (재작성)
  → completed (취소)

settlement_approved
  → warranty (하자보증단계 시작)

warranty
  → warranty_completed (하자보증 완료)
  → paid_maintenance (유상유지보수 계약 시)
  → (프로젝트 종료)

warranty_completed
  → paid_maintenance (유상유지보수 계약 시)
  → (프로젝트 종료)

paid_maintenance
  → (유지보수 계약 기간 동안 지속)
  → (계약 종료 시 프로젝트 종료)
```

---

## 3. 각 단계별 상세 설계

### 3.0 Phase 0: 영업단계 (딜 관리)

**경로:** `/projects` (새 프로젝트 생성 시)

**상태:** `sales`

**기능:**
- 딜(Deal) 정보 관리
- 고객사/발주처 정보 입력
- 영업 담당자 지정
- 딜 금액 및 예상 기간 입력
- 딜 단계 추적 (잠재고객 → 제안 → 협상 → 확정)
- 딜 타입 분류

**액션:**
- 딜 생성 (상태: `sales`)
- MD 산정 시작 (상태: `md_estimation`)
- 딜 취소 (상태: `cancelled`)

**데이터:**
- `projects` 테이블
  - sales_stage (lead/proposal/negotiation/won)
  - expected_amount (예상 금액)
  - expected_start_date
  - expected_end_date
  - sales_representative_id

---

### 3.1 Phase 1: MD 산정

**경로:** `/projects/[id]/md-estimation`

**상태:** `md_estimation` → `md_estimated`

**기능:**
- 역할별 인력 수 입력
- 역할별 MD 단가 입력
- 총 MD 계산 (인력 수 × MD 단가)
- 단가표 관리 (표준 단가)
- 3D 모델링, P&ID 등 세부 작업별 MD
- MD 산정서 저장

**액션:**
- 저장 (임시 저장, 상태 변경 없음)
- 완료 (상태: `md_estimated`로 변경)

**데이터:**
- `project_md_estimation` 테이블에 저장
- MD 산정 버전 관리

---

### 3.2 Phase 2: VRB 검토

**경로:** `/projects/[id]/vrb-review`

**상태:** `md_estimated` → `vrb_review` → `vrb_approved` / `vrb_rejected`

**기능:**
- VRB 검토 요청
- MD 산정 내용 검토
- 승인/반려 의견 입력
- 승인/반려 처리

**액션:**
- VRB 검토 요청 (상태: `vrb_review`)
- 승인 (상태: `vrb_approved`)
- 반려 (상태: `vrb_rejected`, 사유 입력)

**데이터:**
- `project_vrb_review` 테이블
  - review_date
  - reviewer_id
  - status (approved/rejected)
  - comments
  - reviewed_at

---

### 3.3 Phase 3: 인력 매칭

**경로:** `/projects/[id]/team-allocation`

**상태:** `vrb_approved` → `team_allocation`

**기능:**
- 프로젝트 인력 배치
- 역할별 인력 할당
- 인력 배치율 설정
- 인력 배치 기간 설정
- 인력 가용성 확인

**액션:**
- 인력 매칭 완료 (상태: `profitability_analysis`)
- VRB 재검토 (상태: `vrb_review`)

**데이터:**
- `project_labor_allocation` 테이블
  - user_id
  - role
  - allocation_percentage
  - start_date
  - end_date

---

### 3.4 Phase 4: 수지분석서 작성

**경로:** `/projects/[id]/profitability`

**상태:** `team_allocation` → `profitability_analysis` → `profitability_completed` → `profitability_review` → `profitability_approved` / `profitability_rejected`

**기능:**
- 수지분석서 작성 (8개 시트)
  - 개요정보
  - 프로젝트전경
  - 수익전망
  - 수익성
  - 인건비용 (MD 산정 데이터 활용)
  - 프로젝트일정
  - 단가-인건
  - 단가-기타
- MD 산정 데이터 자동 연동
- 인건비 자동 계산
- 수익성 계산 (총 매출, 총 비용, 순이익, 수익률)

**액션:**
- 저장 (임시 저장)
- 작성 완료 (상태: `profitability_completed`)
- 검토 요청 (상태: `profitability_review`)

**데이터:**
- `project_profitability` 테이블
- `project_labor_cost_summary` 테이블
- `project_revenue_forecast` 테이블

---

### 3.4-1 Phase 4-1: 수지분석서 승인

**경로:** `/projects/[id]/profitability/review`

**상태:** `profitability_completed` → `profitability_review` → `profitability_approved` / `profitability_rejected`

**기능:**
- 수지분석서 검토
- 승인/반려 처리
- 승인/반려 의견 입력

**액션:**
- 승인 (상태: `profitability_approved`)
- 반려 (상태: `profitability_rejected`, 사유 입력)

**데이터:**
- `project_profitability_review` 테이블
  - review_date
  - reviewer_id
  - status (approved/rejected)
  - comments
  - reviewed_at

---

### 3.5 Phase 5: 프로젝트 진행

**경로:** `/projects/[id]`

**상태:** `profitability_approved` → `in_progress` → `completed`

**기능:**
- 프로젝트 일정 관리
- 인력 배치 현황 확인/수정
- 진행률 추적
- 이슈/리스크 관리
- 시간 추적 (실제 투입 시간)
- 산출물(Delivery) 관리

**액션:**
- 프로젝트 시작 (상태: `in_progress`)
- 보류 (상태: `on_hold`)
- 완료 (상태: `completed`)

---

### 3.6 Phase 6: 수지정산서 작성

**경로:** `/projects/[id]/settlement`

**상태:** `completed` → `settlement` → `settlement_completed` → `settlement_review` → `settlement_approved` / `settlement_rejected`

**기능:**
- 수지정산서 작성
- 수지분석서 데이터 자동 연동
- 실제 매출/비용 입력
- 정산 계산 (실제 vs 계획 비교)
- 수지분석서 대비 결과 확인
- 정산서 저장 및 출력

**액션:**
- 정산 시작 (상태: `settlement`)
- 작성 완료 (상태: `settlement_completed`)
- 검토 요청 (상태: `settlement_review`)

**데이터:**
- `project_settlement` 테이블
- `project_settlement_items` 테이블

---

### 3.6-1 Phase 6-1: 수지정산서 승인

**경로:** `/projects/[id]/settlement/review`

**상태:** `settlement_completed` → `settlement_review` → `settlement_approved` / `settlement_rejected`

**기능:**
- 정산서 검토
- 승인/반려 처리
- 승인/반려 의견 입력

**액션:**
- 승인 (상태: `settlement_approved`)
- 반려 (상태: `settlement_rejected`, 사유 입력)

**데이터:**
- `project_settlement_review` 테이블
  - review_date
  - reviewer_id
  - status (approved/rejected)
  - comments
  - reviewed_at

---

### 3.7 Phase 7: 하자보증단계

**경로:** `/projects/[id]/warranty`

**상태:** `settlement_approved` → `warranty` → `warranty_completed`

**기능:**
- 하자보증 기간 관리 (보통 1년)
- 하자보증 시작일/종료일 관리
- 하자 이슈 관리 및 추적
- 하자 보수 작업 관리
- 하자보증 완료 처리

**액션:**
- 하자보증 시작 (상태: `warranty`)
- 하자보증 완료 (상태: `warranty_completed`)
- 유상유지보수 계약 (상태: `paid_maintenance`)

**데이터:**
- `project_warranty` 테이블
  - warranty_start_date (하자보증 시작일)
  - warranty_end_date (하자보증 종료일, 보통 1년)
  - warranty_issues (하자 이슈)
  - completed_at (완료일)

---

### 3.8 Phase 8: 유상유지보수

**경로:** `/projects/[id]/maintenance`

**상태:** `warranty_completed` → `paid_maintenance` (또는 `warranty` → `paid_maintenance`)

**기능:**
- 유상유지보수 계약 관리
- 유지보수 계약 기간 관리
- 유지보수 작업 관리
- 유지보수 수익 추적
- 유지보수 인력 배치
- 유지보수 계약 갱신

**액션:**
- 유상유지보수 시작 (상태: `paid_maintenance`)
- 유지보수 계약 갱신
- 유지보수 계약 종료

**데이터:**
- `project_maintenance` 테이블
  - contract_start_date (계약 시작일)
  - contract_end_date (계약 종료일)
  - contract_amount (계약 금액)
  - maintenance_type (유지보수 유형)
  - renewal_date (갱신일)

---

## 4. 데이터베이스 스키마 (워크플로우 반영)

### 4.1 프로젝트 테이블 (수정)

```sql
projects
- id (PK)
- project_code (프로젝트 코드, 예: P24-039, P25-019)
- name (프로젝트명)
- client_name (클라이언트명)
- description
- start_date (계획 시작일)
- end_date (계획 종료일)
- actual_start_date (실제 시작일)
- actual_end_date (실제 종료일)
- status (enum: sales/md_estimation/md_estimated/vrb_review/...)
- current_phase (enum: sales/md_estimation/vrb/team_allocation/profitability/in_progress/settlement/warranty/paid_maintenance)
- sales_stage (enum: lead/proposal/negotiation/won, 영업단계)
- expected_amount (DECIMAL, 예상 금액)
- created_at
- updated_at
- created_by (FK -> users.id)
```

### 4.2 VRB 검토 테이블

```sql
project_vrb_reviews
- id (PK)
- project_id (FK -> projects.id)
- review_date
- reviewer_id (FK -> users.id)
- status (approved/rejected)
- comments
- md_estimation_id (FK -> project_md_estimation.id, 참조된 MD 산정)
- reviewed_at
- created_at
- updated_at
```

### 4.2-1 수지분석서 승인 테이블

```sql
project_profitability_reviews
- id (PK)
- project_id (FK -> projects.id)
- profitability_analysis_id (FK -> project_profitability.id)
- review_date
- reviewer_id (FK -> users.id)
- status (approved/rejected)
- comments
- reviewed_at
- created_at
- updated_at
```

### 4.2-2 정산서 승인 테이블

```sql
project_settlement_reviews
- id (PK)
- project_id (FK -> projects.id)
- settlement_id (FK -> project_settlement.id)
- review_date
- reviewer_id (FK -> users.id)
- status (approved/rejected)
- comments
- reviewed_at
- created_at
- updated_at
```

### 4.3 프로젝트 컨펌 테이블

```sql
project_confirmations
- id (PK)
- project_id (FK -> projects.id)
- confirmed_date
- confirmed_by (FK -> users.id)
- profitability_analysis_id (FK -> project_profitability.id, 참조된 수지분석서)
- confirmed_at
- created_at
```

### 4.4 프로젝트 단계 이력

```sql
project_status_history
- id (PK)
- project_id (FK -> projects.id)
- from_status
- to_status
- changed_by (FK -> users.id)
- comments
- changed_at
- created_at
```

### 4.5 하자보증 테이블

```sql
project_warranty
- id (PK)
- project_id (FK -> projects.id, UNIQUE)
- warranty_start_date (DATE, 하자보증 시작일)
- warranty_end_date (DATE, 하자보증 종료일, 보통 1년)
- status (VARCHAR, active/completed)
- completed_at (TIMESTAMP)
- notes (TEXT, 비고)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4.5-1 하자 이슈 테이블

```sql
project_warranty_issues
- id (PK)
- project_id (FK -> projects.id)
- warranty_id (FK -> project_warranty.id)
- issue_title (VARCHAR, 이슈 제목)
- issue_description (TEXT, 이슈 설명)
- reported_date (DATE, 보고일)
- reported_by (FK -> users.id, 보고자)
- assigned_to (FK -> users.id, 담당자)
- status (VARCHAR, open/in_progress/resolved/closed)
- resolved_date (DATE, 해결일)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4.6 유상유지보수 테이블

```sql
project_maintenance
- id (PK)
- project_id (FK -> projects.id)
- contract_number (VARCHAR, 계약 번호)
- contract_start_date (DATE, 계약 시작일)
- contract_end_date (DATE, 계약 종료일)
- contract_amount (DECIMAL, 계약 금액)
- maintenance_type (VARCHAR, 유지보수 유형)
- renewal_date (DATE, 갱신일)
- status (VARCHAR, active/expired/renewed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4.6-1 유지보수 작업 테이블

```sql
project_maintenance_tasks
- id (PK)
- project_id (FK -> projects.id)
- maintenance_id (FK -> project_maintenance.id)
- task_title (VARCHAR, 작업 제목)
- task_description (TEXT, 작업 설명)
- task_date (DATE, 작업일)
- assigned_to (FK -> users.id, 담당자)
- status (VARCHAR, pending/in_progress/completed)
- completed_date (DATE, 완료일)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 5. 화면 설계 (워크플로우 반영)

### 5.1 프로젝트 목록 화면

**경로:** `/projects`

**필터:**
- 상태별 필터 (진행 단계별)
- 클라이언트별
- 기간별

**표시 정보:**
- 프로젝트 코드
- 프로젝트명
- 클라이언트
- 현재 단계 (MD 산정 / VRB 검토 / 진행 중 / 정산 등)
- 상태 배지
- 진행률
- 시작일/종료일

---

### 5.2 프로젝트 상세 화면

**경로:** `/projects/[id]`

**구성:**
- 프로젝트 기본 정보
- 현재 단계 표시 (워크플로우 진행 상태)
- 단계별 진행 상황 (Step Indicator)
- 다음 액션 버튼 (현재 단계에 따라)
- 탭 메뉴:
  - 개요
  - MD 산정 (해당 단계일 때)
  - VRB 검토 (해당 단계일 때)
  - 수지분석서 (해당 단계일 때)
  - 일정
  - 인력
  - 정산서 (프로젝트 완료 후)
  - 하자보증 (정산 승인 후)
  - 유상유지보수 (하자보증 완료 후 또는 계약 시)

---

### 5.3 단계별 전용 화면

#### **MD 산정 화면** (`/projects/[id]/md-estimation`)
- 현재 단계가 MD 산정일 때 표시
- MD 산정 폼
- 완료 버튼 → 상태 변경

#### **VRB 검토 화면** (`/projects/[id]/vrb-review`)
- MD 산정 내용 표시
- 승인/반려 버튼
- 의견 입력

#### **수지분석서 화면** (`/projects/[id]/profitability`)
- 8개 탭 (시트별)
- MD 산정 데이터 자동 연동
- 작성 완료 버튼 → 상태: `profitability_completed`
- 검토 요청 버튼 → 상태: `profitability_review`

#### **수지분석서 승인 화면** (`/projects/[id]/profitability/review`)
- 수지분석서 내용 검토
- 승인/반려 버튼
- 의견 입력

#### **정산서 화면** (`/projects/[id]/settlement`)
- 프로젝트 완료 후 접근 가능
- 수지분석서 데이터 연동
- 정산 계산
- 작성 완료 버튼 → 상태: `settlement_completed`
- 검토 요청 버튼 → 상태: `settlement_review`

#### **정산서 승인 화면** (`/projects/[id]/settlement/review`)
- 정산서 내용 검토
- 승인/반려 버튼
- 의견 입력

#### **하자보증 화면** (`/projects/[id]/warranty`)
- 하자보증 기간 표시
- 하자 이슈 관리
- 하자 보수 작업 관리
- 하자보증 완료 처리

#### **유상유지보수 화면** (`/projects/[id]/maintenance`)
- 유지보수 계약 정보 관리
- 유지보수 작업 관리
- 유지보수 수익 추적
- 계약 갱신

---

## 6. 권한 및 역할

### 6.1 단계별 권한

- **MD 산정**: PM, 프로젝트 매니저
- **VRB 검토**: VRB 멤버, 관리자
- **컨펌**: 관리자, 임원
- **수지분석서 작성**: PM, 프로젝트 매니저
- **수지분석서 승인**: 관리자, 임원, VRB 멤버
- **프로젝트 진행**: 프로젝트 팀 멤버
- **정산서 작성**: PM, 회계 담당자
- **정산서 승인**: 관리자, 임원, 회계 담당자
- **하자보증 관리**: PM, 운영 담당자
- **유상유지보수 관리**: PM, 운영 담당자, 영업 담당자

---

## 7. 알림 및 워크플로우

### 7.1 상태 변경 알림

- MD 산정 완료 → VRB 검토 요청 알림
- VRB 승인 → 컨펌 알림
- 컨펌 완료 → 수지분석서 작성 알림
- 수지분석서 작성 완료 → 수지분석서 승인 요청 알림
- 수지분석서 승인 → 프로젝트 시작 알림
- 수지분석서 반려 → 재작성 알림
- 프로젝트 완료 → 정산서 작성 알림
- 정산서 작성 완료 → 정산서 승인 요청 알림
- 정산서 승인 → 하자보증단계 시작 알림
- 정산서 반려 → 재작성 알림
- 하자보증 완료 → 유상유지보수 계약 안내 알림
- 유상유지보수 계약 체결 → 유지보수 시작 알림

---

## 8. 구현 우선순위 (업데이트)

### Phase 1: 기본 프로젝트 관리
1. ✅ 프로젝트 CRUD
2. ✅ 프로젝트 상태 관리
3. 프로젝트 목록 (상태별 필터)

### Phase 2: MD 산정
1. MD 산정 화면
2. 단가표 관리
3. MD 계산 로직
4. MD 산정 완료 (상태 변경)

### Phase 3: VRB 검토
1. VRB 검토 화면
2. 승인/반려 기능
3. 상태 전이

### Phase 4: 컨펌
1. 컨펌 화면
2. 상태 전이

### Phase 5: 수지분석서
1. 수지분석서 기본 구조
2. MD 산정 데이터 연동
3. 수익성 계산
4. 인건비 자동 계산

### Phase 6: 프로젝트 진행
1. 일정 관리
2. 인력 배치
3. 진행률 추적

### Phase 7: 정산서
1. 정산서 화면
2. 수지분석서 연동
3. 정산 계산

### Phase 8: 하자보증
1. 하자보증 화면
2. 하자 이슈 관리
3. 하자 보수 작업 관리

### Phase 9: 유상유지보수
1. 유상유지보수 화면
2. 유지보수 계약 관리
3. 유지보수 작업 관리
4. 유지보수 수익 추적

---

## 9. 다음 단계

1. 프로젝트 상태 관리 시스템 구현
2. 워크플로우 엔진 설계
3. 단계별 화면 상세 설계
4. 권한 시스템 구현
