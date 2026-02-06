# WEWORKS 시스템 전체 설계안

## 1. 시스템 개요

**WEWORKS**는 기술그룹 관리 시스템입니다.
기존 엑셀 기반의 수동 업무 프로세스를 자동화하고, 실시간 데이터 관리 및 분석을 제공합니다.

### 주요 목표
- 엑셀 템플릿 기반 수동 업무의 웹 자동화
- 실시간 데이터 계산 및 분석
- 프로젝트, 인력, 리소스 통합 관리
- 사용자 및 권한 관리

---

## 2. 화면 구조 설계

### 2.1 메인 네비게이션 구조

```
┌─────────────────────────────────────────┐
│  WEWORKS Console                        │
├─────────────────────────────────────────┤
│  📊 Dashboard                           │
│  📁 Projects                            │
│  📋 Delivery                            │
│  👥 Resources                           │
│  ⚙️  Settings                           │
│    ├── Users                            │
│    └── Roles & Permissions              │
└─────────────────────────────────────────┘
```

### 2.2 화면 상세 설계

#### **2.2.1 Dashboard (대시보드)**
**경로:** `/dashboard`

**기능:**
- 전체 시스템 개요 (KPI 카드)
- 프로젝트 현황 요약
- 인력 배치 현황
- 최근 활동 내역
- 차트 및 그래프 (프로젝트 진행률, 인력 활용률 등)

**컴포넌트:**
- 프로젝트 포트폴리오 카드 → `/projects` 이동
- 과제 실행 현황 카드 → `/delivery` 이동
- 인력 & 기술 리소스 카드 → `/resources` 이동

---

#### **2.2.2 Projects (프로젝트 관리)**
**경로:** `/projects`

**기능:**
- 프로젝트 목록 조회 (테이블/그리드)
- 프로젝트 검색 및 필터링
- 프로젝트 상세 정보
- 프로젝트 생성/수정/삭제
- 프로젝트별 인력 배치 관리

**하위 화면:**
- `/projects` - 프로젝트 목록
- `/projects/[id]` - 프로젝트 상세
- `/projects/new` - 새 프로젝트 생성
- `/projects/[id]/edit` - 프로젝트 수정
- `/projects/[id]/team` - 프로젝트 팀 관리

**데이터:**
- 프로젝트 정보 (이름, 설명, 기간, 예산, 상태)
- 프로젝트별 인력 배치
- 프로젝트 진행률
- 리스크 및 이슈

---

#### **2.2.3 Delivery (과제 실행 현황)**
**경로:** `/delivery`

**기능:**
- 과제(마일스톤) 목록 및 일정 관리
- 간트 차트 뷰
- 진행률 추적
- 리스크 관리
- 보고서 생성

**하위 화면:**
- `/delivery` - 과제 목록 및 간트 차트
- `/delivery/[id]` - 과제 상세
- `/delivery/risks` - 리스크 관리
- `/delivery/reports` - 보고서

**엑셀 연동 가능 영역:**
- 프로젝트 일정 관리 템플릿
- 마일스톤 추적 시트
- 리스크 관리 시트

---

#### **2.2.4 Resources (인력 & 기술 리소스)**
**경로:** `/resources`

**기능:**
- 인력 목록 및 상세 정보
- 기술 스택 관리
- 인력 배치 현황 (어떤 프로젝트에 배치됨)
- 인력 활용률 분석
- 조직도

**하위 화면:**
- `/resources` - 인력 목록
- `/resources/[id]` - 인력 상세 (프로필, 스킬, 프로젝트 이력)
- `/resources/skills` - 기술 스택 관리
- `/resources/organization` - 조직도
- `/resources/allocation` - 인력 배치 현황 (매트릭스 뷰)

**엑셀 연동 가능 영역:**
- 인력 현황 시트
- 기술 스택 시트
- 인력 배치 매트릭스
- 활용률 계산 시트

---

#### **2.2.5 Settings (설정)**
**경로:** `/settings`

**2.2.5.1 Users (사용자 관리)**
- 경로: `/settings/users`
- 기능: 사용자 목록, 생성, 수정, 삭제, 권한 설정

**2.2.5.2 Roles & Permissions (역할 및 권한)**
- 경로: `/settings/roles`
- 기능: 역할 생성/수정, 권한 설정

---

#### **2.2.6 Login (로그인)**
**경로:** `/login`
- 이메일/비밀번호 로그인
- 로그인 상태 유지
- 비밀번호 찾기

---

## 3. 엑셀 템플릿 자동화 영역

### 3.1 예상되는 엑셀 템플릿 영역

#### **A. 프로젝트 관리 관련**
- 프로젝트 예산 관리 시트
- 프로젝트 일정 관리 시트
- 프로젝트 매출/비용 계산 시트

#### **B. 인력 관리 관련**
- 인력 배치 매트릭스 (프로젝트별 인력 배치)
- 인건비 계산 시트
- 인력 활용률 계산 시트
- 프로젝트별 투입 인원 계산

#### **C. 리소스 관리 관련**
- 기술 스택 현황 시트
- 조직 구조 시트

#### **D. 보고서 관련**
- 프로젝트 현황 보고서
- 인력 활용 보고서
- 매출/비용 분석 보고서

### 3.2 엑셀 → 웹 전환 전략

1. **데이터 입력 화면**: 엑셀 시트와 유사한 그리드/테이블 UI
2. **자동 계산**: 엑셀 수식 → JavaScript 함수/서버 로직
3. **데이터 저장**: 데이터베이스에 구조화하여 저장
4. **조회/분석**: 실시간 계산 및 시각화
5. **엑셀 내보내기**: 필요시 엑셀 다운로드 기능

---

## 4. 데이터베이스 설계 (초안)

### 4.1 핵심 엔티티

#### **4.1.1 Users (사용자)**
```sql
users
- id (PK)
- email (unique)
- password_hash
- name
- department
- role_id (FK -> roles.id)
- status (active/inactive)
- created_at
- updated_at
- last_login_at
```

#### **4.1.2 Roles (역할)**
```sql
roles
- id (PK)
- name (unique)
- description
- created_at
- updated_at

role_permissions
- id (PK)
- role_id (FK -> roles.id)
- permission (string)
```

#### **4.1.3 Projects (프로젝트)**
```sql
projects
- id (PK)
- name
- description
- client_name
- start_date
- end_date
- budget
- status (planning/active/on_hold/completed/cancelled)
- manager_id (FK -> users.id)
- created_at
- updated_at
- created_by (FK -> users.id)
```

#### **4.1.4 Project_Members (프로젝트 인력)**
```sql
project_members
- id (PK)
- project_id (FK -> projects.id)
- user_id (FK -> users.id)
- role (PM/Developer/Designer/etc)
- allocation_percentage (0-100)
- start_date
- end_date
- hourly_rate (인건비 계산용)
- created_at
- updated_at
```

#### **4.1.5 Tasks/Milestones (과제/마일스톤)**
```sql
tasks
- id (PK)
- project_id (FK -> projects.id)
- name
- description
- start_date
- end_date
- status (not_started/in_progress/completed/blocked)
- progress_percentage (0-100)
- assigned_to (FK -> users.id)
- parent_task_id (FK -> tasks.id, NULL if root)
- created_at
- updated_at
```

#### **4.1.6 Risks (리스크)**
```sql
risks
- id (PK)
- project_id (FK -> projects.id)
- task_id (FK -> tasks.id, nullable)
- title
- description
- severity (low/medium/high/critical)
- status (open/mitigated/closed)
- created_at
- updated_at
- created_by (FK -> users.id)
```

#### **4.1.7 Skills (기술 스택)**
```sql
skills
- id (PK)
- name (unique)
- category (language/framework/tool/etc)
- description
- created_at
- updated_at

user_skills
- id (PK)
- user_id (FK -> users.id)
- skill_id (FK -> skills.id)
- proficiency_level (1-5)
- certified (boolean)
- created_at
```

#### **4.1.8 Departments (부서)**
```sql
departments
- id (PK)
- name (unique)
- parent_department_id (FK -> departments.id, nullable)
- manager_id (FK -> users.id, nullable)
- created_at
- updated_at
```

#### **4.1.9 Budget/Cost (예산/비용) - 엑셀 계산 자동화**
```sql
project_budgets
- id (PK)
- project_id (FK -> projects.id)
- category (labor/equipment/software/etc)
- planned_amount
- actual_amount
- month (YYYY-MM)
- created_at
- updated_at

cost_items
- id (PK)
- project_id (FK -> projects.id)
- name
- category
- amount
- date
- created_at
```

#### **4.1.10 Time Tracking (시간 추적) - 엑셀 계산 자동화**
```sql
time_entries
- id (PK)
- project_id (FK -> projects.id)
- user_id (FK -> users.id)
- task_id (FK -> tasks.id, nullable)
- date
- hours
- description
- created_at
- updated_at
```

---

## 5. 화면별 상세 기능 정의

### 5.1 프로젝트 관리 화면 상세

#### **프로젝트 목록 (`/projects`)**
- 그리드/테이블 뷰
- 필터: 상태, 기간, 매니저, 클라이언트
- 정렬: 이름, 시작일, 예산
- 검색: 프로젝트 이름, 클라이언트
- 액션: 새 프로젝트, 상세보기, 편집, 삭제

#### **프로젝트 상세 (`/projects/[id]`)**
- 기본 정보 탭
- 인력 배치 탭 (매트릭스 뷰)
- 일정 탭 (간트 차트)
- 예산/비용 탭 (엑셀 계산 자동화)
- 리스크 탭
- 문서/파일 탭

#### **프로젝트 인력 배치 (`/projects/[id]/team`)**
- 프로젝트별 인력 배치 매트릭스
- 인력 추가/제거
- 배치 기간 및 할당률 설정
- 인건비 자동 계산 (엑셀 자동화)

---

### 5.2 Delivery (과제 실행) 화면 상세

#### **과제 목록 (`/delivery`)**
- 간트 차트 뷰
- 리스트 뷰
- 필터: 프로젝트, 상태, 담당자
- 검색

#### **과제 상세 (`/delivery/[id]`)**
- 과제 정보
- 하위 작업 목록
- 진행률 표시
- 시간 추적 (엑셀 자동화)
- 리스크 연동

---

### 5.3 Resources (인력) 화면 상세

#### **인력 목록 (`/resources`)**
- 그리드 뷰 (카드/테이블 토글)
- 필터: 부서, 기술 스택, 배치 상태
- 검색: 이름, 이메일

#### **인력 상세 (`/resources/[id]`)**
- 기본 정보
- 기술 스택
- 프로젝트 이력
- 시간 추적 내역
- 활용률 차트 (엑셀 자동화)

#### **인력 배치 현황 (`/resources/allocation`)**
- 매트릭스 뷰 (프로젝트 × 인력)
- 할당률 표시
- 인건비 자동 계산 (엑셀 자동화)
- 활용률 분석

#### **기술 스택 관리 (`/resources/skills`)**
- 기술 스택 목록
- 카테고리별 분류
- 인력별 기술 보유 현황

---

## 6. 엑셀 계산 자동화 상세 설계

### 6.1 인력 배치 및 인건비 계산

**엑셀 시나리오:**
- 프로젝트별 인력 배치 × 할당률 × 단가 × 기간 = 총 인건비

**웹 자동화:**
- `project_members` 테이블에서 실시간 계산
- 할당률 변경 시 자동 재계산
- 프로젝트 예산 대비 인건비 차트

### 6.2 프로젝트 예산/비용 관리

**엑셀 시나리오:**
- 예산 계획 vs 실제 비용
- 카테고리별 비용 집계
- 월별 비용 추이

**웹 자동화:**
- `project_budgets`, `cost_items` 테이블 연동
- 실시간 예산 대비 비용 계산
- 차트 시각화

### 6.3 시간 추적 및 활용률 계산

**엑셀 시나리오:**
- 인력별 프로젝트 투입 시간
- 월별/주별 시간 집계
- 활용률 계산 (실제 투입 시간 / 가용 시간)

**웹 자동화:**
- `time_entries` 테이블로 시간 추적
- 자동 활용률 계산
- 대시보드 차트

---

## 7. 프로젝트 진행 워크플로우

프로젝트 진행 순서가 명확히 정의되었습니다:
1. **MD 산정** → 2. **VRB 검토** → 3. **컨펌** → 4. **수지분석서 작성** → 5. **프로젝트 진행** → 6. **수지정산서 작성**

상세 워크플로우 설계는 `docs/PROJECT_WORKFLOW.md` 파일을 참고하세요.

---

## 8. 구현 우선순위 (업데이트)

### Phase 1: 기본 구조 (현재 완료)
- ✅ 레이아웃 및 네비게이션
- ✅ 로그인 페이지
- ✅ 설정 (사용자, 권한)

### Phase 2: 프로젝트 기본 관리
1. 프로젝트 목록 및 CRUD
2. 프로젝트 상태 관리 시스템
3. 프로젝트 상세 화면 (단계별 표시)

### Phase 3: MD 산정
1. MD 산정 화면
2. 단가표 관리
3. MD 계산 로직
4. MD 산정 완료 (상태 전이)

### Phase 4: VRB 검토
1. VRB 검토 화면
2. 승인/반려 기능
3. 상태 전이

### Phase 5: 컨펌
1. 컨펌 화면
2. 상태 전이

### Phase 6: 수지분석서
1. 수지분석서 기본 구조
2. MD 산정 데이터 연동
3. 인건비 자동 계산
4. 수익성 계산

### Phase 7: 프로젝트 진행
1. 프로젝트 인력 배치
2. 일정 관리
3. 진행률 추적

### Phase 8: 정산서
1. 정산서 화면
2. 수지분석서 연동
3. 정산 계산

### Phase 9: 인력 관리
1. 인력 목록 및 프로필
2. 기술 스택 관리
3. 인력 배치 현황 (매트릭스)

---

## 8. 데이터베이스 및 API 연동

현재는 임시 데이터(hardcoded)를 사용하고 있으나, **모든 데이터는 데이터베이스에서 가져옵니다**.

### 현재 상태
- ✅ 데이터베이스 스키마 설계 완료 (`docs/DATABASE_SCHEMA.md`)
- ✅ API 설계 완료 (`docs/API_DESIGN.md`)
- ✅ 엑셀 템플릿 분석 완료 (`docs/EXCEL_ANALYSIS.md`)
- ⏳ 실제 API 구현 및 DB 연동 (다음 단계)

### 데이터 흐름
```
프론트엔드 (React/Next.js)
    ↓
API Routes (/api/*)
    ↓
데이터베이스 (PostgreSQL)
```

### 다음 단계
1. **ORM 설정**: Prisma 또는 Drizzle ORM 선택 및 설정
2. **데이터베이스 마이그레이션**: 스키마 기반 마이그레이션 생성
3. **API Routes 구현**: Next.js API Routes 또는 별도 백엔드 구현
4. **프론트엔드 API 연동**: 기존 하드코딩 데이터를 API 호출로 교체

상세 API 설계는 `docs/API_DESIGN.md`를 참고하세요.

---

## 엑셀 템플릿 분석 완료

엑셀 템플릿 분석이 완료되었습니다. 상세 분석 결과는 `docs/EXCEL_ANALYSIS.md` 파일을 참고하세요.

### 분석된 파일
- ✅ 수지분석서 (8개 시트, 복잡한 계산 로직)
- ✅ MD산정 파일 (4개 시트, 인력 산정)
- ✅ 정산서 (6개 시트, 프로젝트 정산)

### 주요 발견
- 인건비 계산이 가장 복잡하고 핵심적
- 시트 간 참조가 많음 (데이터 연동 중요)
- 월별 계산이 많음 (시간 기반 데이터 필요)
- 수익성 분석이 주요 목표
