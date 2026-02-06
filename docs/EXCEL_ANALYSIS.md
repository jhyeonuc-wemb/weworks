# 엑셀 템플릿 분석 결과

## 1. 분석된 파일 목록

1. **VRB (Value Review Board) 파일** - 1개
   - `250429_VRB_고성 천연가스발전사업 디지털 트윈 구축 용역_V.1.1_250610.xlsx`

2. **수지분석서 파일** - 2개
   - `P24-039_ES_한국남동발전_KOEN 스마트 도면관리시스템 구축 용역_수지분석서_(ver_20241217).xlsx`
   - `P25-019_한국전력기술_고성 천연가스발전사업 디지털 트윈 구축 용역_수지분석서_V.0.1_20250609.xlsx`

3. **MD산정 파일** - 1개
   - `P25-019_한국전력기술_고성 천연가스발전사업 디지털 트윈 구축 용역_MD산정_250609.xlsx`

4. **정산서 파일** - 1개
   - `PJT 정산_P24-039_ES_한국남동발전_KOEN 스마트 도면관리시스템 구축 용역 정산초안_ver1_20251230.xlsx`

---

## 2. 수지분석서 구조 분석

### 2.1 시트 구조 (8개 시트)

#### **1. 개요정보**
- 프로젝트 기본 정보
- 프로젝트명, 클라이언트, 설명 등
- 구조: 간단한 텍스트 정보 (77행 × 6열)

#### **2. 프로젝트전경**
- 프로젝트 전체 전경 (Overview)
- 구조: 43행 × 13열
- 주요 수식:
  - `=인건비용!AG34` (인건비용 시트 참조)
  - `=수익성!E12`, `=수익성!E18` (수익성 시트 참조)

#### **3. 수익전망**
- 매출/비용 전망 정보
- 구조: 28행 × 20열
- 주요 계산:
  - 합계 계산: `=SUM(G5:G16)`
  - 비율 계산: `=IF(E17>0,G17/E17,0)`
  - 수익률 계산: `=IFERROR((G17-H17)/G17,"")`

#### **4. 수익성**
- 수익성 분석 시트
- 구조: 37행 × 12열
- 주요 수식:
  - `=인건비용!AK33`, `=인건비용!AK45` (인건비용 참조)
  - `=수익전망!H17` (수익전망 참조)
  - 총액 계산: `=E4+E5`

#### **5. 인건비용** (핵심 시트)
- 인력별 인건비 계산
- 구조: 47-48행 × 46열 (매우 큰 시트)
- 주요 기능:
  - 월별 인건비 계산 (2024년/2025년 분기)
  - 총 인건비 합계
  - 시트 간 참조가 많음
  - 수식 개수: 1000개 이상

#### **6. 프로젝트일정**
- 프로젝트 일정 관리
- 구조: 19행 × 41열
- 주요 계산:
  - 합계 계산: `=SUM(D5:E5)`, `=SUM(F5:Q5)`
  - 인건비용 시트 참조: `=인건비용!I34`, `=인건비용!J34` 등

#### **7. 단가-인건**
- 인건비 단가 관리
- 구조: 36행 × 30열
- 주요 계산:
  - 날짜 계산: `=TODAY()`, `=TODAY()-365`
  - 단가 계산: `=(E5-F5)/E5` (변동률)
  - 연도별 단가 비교

#### **8. 단가-기타**
- 기타 비용 단가
- 구조: 12행 × 8열
- 주요 계산:
  - 단가 × 수량: `=+E4*F4`

---

### 2.2 주요 계산 로직

#### **인건비 계산**
```
월별 인건비 = 인력별 투입 시간 × 단가
총 인건비 = SUM(월별 인건비)
```

#### **수익성 계산**
```
총 매출 = 소프트웨어 매출 + 하드웨어 매출
총 비용 = 인건비 + 기타 비용
순이익 = 총 매출 - 총 비용
수익률 = 순이익 / 총 매출
```

#### **시트 간 참조**
- 인건비용 시트가 핵심 (가장 많은 참조를 받음)
- 수익성 시트가 인건비용과 수익전망을 참조
- 프로젝트일정이 인건비용을 참조

---

## 3. MD산정 파일 구조

### 3.1 시트 구조 (4개 시트)

#### **1. 전체MD산정**
- 프로젝트 전체 MD (Man Day) 산정
- 구조: 30행 × 11열
- 주요 계산:
  - MD = 인력 수 × MD 단가
  - 합계: `=SUMIF(A3:A23,G3,E3:E23)`
  - 단가표 시트 참조: `=단가표!E60`

#### **2. 단가표**
- 인력별 단가표
- 구조: 60행 × 5열
- 주요 계산:
  - 총 단가: `=SUM(D3:D42)`
  - 단가: `=D43/80` (총 단가 / 80시간)

#### **3. 3D 모델링**
- 3D 모델링 관련 MD 산정
- 구조: 16행 × 14열
- 주요 계산:
  - `=C4*D4` (수량 × 단가)
  - `=VLOOKUP(I3,L3:M7,2,0)` (VLOOKUP 참조)

#### **4. P&ID**
- P&ID 관련 MD 산정
- 구조: 18행 × 13열
- 주요 계산:
  - `=B5*C5` (수량 × 단가)
  - `=VLOOKUP(H5,K5:L9,2,0)` (VLOOKUP 참조)

---

## 4. 정산서 파일 구조

### 4.1 시트 구조 (6개 시트)

#### **1. P24-039** (메인 시트)
- 프로젝트 정산 메인 데이터
- 구조: 313행 × 138열 (매우 큰 시트)
- 주요 기능:
  - 프로젝트 정산 상세 데이터
  - 여러 계산 수식 포함 (898개)

#### **2. 2014년 표준단가**
- 2014년 표준 단가표
- 구조: 32행 × 10열
- 단가 기준 데이터

---

## 5. 데이터베이스 설계 (수정안)

### 5.1 프로젝트 관련 테이블

```sql
-- 프로젝트 기본 정보
projects
- id (PK)
- project_code (프로젝트 코드, 예: P24-039)
- name (프로젝트명)
- client_name (클라이언트명)
- description
- start_date
- end_date
- status
- created_at
- updated_at

-- 프로젝트 수익성 분석
project_profitability
- id (PK)
- project_id (FK -> projects.id)
- software_revenue (소프트웨어 매출)
- hardware_revenue (하드웨어 매출)
- total_revenue (총 매출 = 소프트웨어 + 하드웨어)
- labor_cost (인건비)
- other_cost (기타 비용)
- total_cost (총 비용)
- net_profit (순이익 = 총 매출 - 총 비용)
- profit_rate (수익률 = 순이익 / 총 매출)
- calculated_at
- created_at
- updated_at

-- 프로젝트 수익 전망
project_revenue_forecast
- id (PK)
- project_id (FK -> projects.id)
- forecast_month (YYYY-MM)
- revenue_amount
- cost_amount
- profit_amount
- profit_rate
- created_at
- updated_at
```

### 5.2 인건비 관련 테이블

```sql
-- 인력 투입 계획/실적
project_labor_allocation
- id (PK)
- project_id (FK -> projects.id)
- user_id (FK -> users.id)
- role (역할)
- allocation_percentage (할당률 0-100)
- month (YYYY-MM)
- planned_hours (계획 시간)
- actual_hours (실제 시간)
- hourly_rate (시간당 단가)
- total_cost (총 비용 = 시간 × 단가)
- created_at
- updated_at

-- 인건비 단가표
labor_rate_table
- id (PK)
- role (역할)
- rate_type (standard/current/year_ago)
- hourly_rate (시간당 단가)
- effective_date (적용 시작일)
- expiry_date (적용 종료일)
- created_at
- updated_at

-- 인건비 집계 (월별)
project_labor_cost_summary
- id (PK)
- project_id (FK -> projects.id)
- month (YYYY-MM)
- total_hours (총 시간)
- total_cost (총 비용)
- created_at
- updated_at
```

### 5.3 MD 산정 관련 테이블

```sql
-- MD 산정
project_md_estimation
- id (PK)
- project_id (FK -> projects.id)
- role (역할)
- personnel_count (인력 수)
- md_per_person (인당 MD)
- total_md (총 MD = 인력 수 × 인당 MD)
- category (PM/개발/설계/I/F/3D모델링/P&ID)
- created_at
- updated_at

-- MD 단가표
md_rate_table
- id (PK)
- role (역할)
- hourly_rate (시간당 단가)
- md_rate (MD당 단가 = 시간당 단가 × 8시간)
- effective_date
- expiry_date
- created_at
- updated_at
```

### 5.4 정산 관련 테이블

```sql
-- 프로젝트 정산
project_settlement
- id (PK)
- project_id (FK -> projects.id)
- settlement_date
- total_revenue (총 매출)
- total_cost (총 비용)
- net_profit (순이익)
- status (draft/confirmed)
- created_at
- updated_at

-- 정산 항목 상세
project_settlement_items
- id (PK)
- settlement_id (FK -> project_settlement.id)
- item_name (항목명)
- item_type (revenue/cost)
- amount (금액)
- category
- description
- created_at
```

---

## 6. 화면 설계 (수정안)

### 6.1 수지분석서 화면

#### **6.1.1 수지분석서 목록 (`/projects/[id]/profitability`)**
- 프로젝트별 수지분석서 목록
- 생성일, 버전 관리

#### **6.1.2 수지분석서 상세 (`/projects/[id]/profitability/[version]`)**
**탭 구조:**
1. **개요정보 탭**
   - 프로젝트 기본 정보 입력/수정

2. **수익성 탭** (핵심)
   - 소프트웨어 매출 입력
   - 하드웨어 매출 입력
   - 인건비 자동 계산 (인건비용 탭 참조)
   - 기타 비용 입력
   - 자동 계산:
     - 총 매출 = 소프트웨어 매출 + 하드웨어 매출
     - 총 비용 = 인건비 + 기타 비용
     - 순이익 = 총 매출 - 총 비용
     - 수익률 = (순이익 / 총 매출) × 100

3. **인건비용 탭** (가장 복잡)
   - 그리드 뷰: 인력 × 월별
   - 각 셀: 투입 시간, 단가, 총 비용
   - 자동 계산:
     - 월별 인건비 = 시간 × 단가
     - 총 인건비 = SUM(월별)
   - 필터: 역할, 인력
   - 월별 합계 표시

4. **수익전망 탭**
   - 월별 수익/비용 전망
   - 차트 표시

5. **프로젝트일정 탭**
   - 간트 차트 연동
   - 인건비와 연동

6. **단가 관리 탭**
   - 인건비 단가 테이블
   - 기타 비용 단가 테이블
   - 연도별 단가 비교

---

### 6.2 MD산정 화면

#### **6.2.1 MD산정 목록 (`/projects/[id]/md-estimation`)**
- 프로젝트별 MD 산정 목록

#### **6.2.2 MD산정 상세 (`/projects/[id]/md-estimation/[id]`)**
**구성:**
1. **전체 MD산정 탭**
   - 역할별 MD 입력
   - 인력 수 × MD 단가 = 총 MD
   - 자동 계산

2. **단가표 탭**
   - 역할별 단가 관리
   - 단가표 버전 관리

3. **세부 산정 탭**
   - 3D 모델링 MD
   - P&ID MD
   - 기타 작업별 MD

---

### 6.3 정산서 화면

#### **6.3.1 정산서 목록 (`/projects/[id]/settlement`)**
- 프로젝트별 정산서 목록

#### **6.3.2 정산서 상세 (`/projects/[id]/settlement/[id]`)**
- 정산 항목 상세 입력
- 수지분석서 데이터 자동 연동
- 정산 금액 계산
- 엑셀 내보내기

---

## 7. 구현 우선순위

### Phase 1: 기본 구조
1. 프로젝트 CRUD
2. 인력 배치 기본 기능

### Phase 2: MD 산정
1. MD 산정 화면
2. 단가표 관리
3. MD 계산 로직

### Phase 3: 인건비 관리
1. 인건비 단가표 관리
2. 프로젝트 인력 배치 (월별)
3. 인건비 자동 계산

### Phase 4: 수지분석서
1. 수지분석서 기본 구조
2. 수익성 계산
3. 인건비 연동
4. 수익전망

### Phase 5: 정산서
1. 정산서 화면
2. 수지분석서 연동
3. 정산 계산

---

## 8. 다음 단계

1. 데이터베이스 스키마 상세 설계
2. API 엔드포인트 설계
3. 계산 로직 상세 설계
4. UI/UX 상세 설계
