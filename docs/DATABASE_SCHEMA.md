# 데이터베이스 스키마 상세 설계

## 1. 테이블 목록

### 1.1 사용자 및 권한
- `users` - 사용자
- `roles` - 역할
- `role_permissions` - 역할별 권한
- `departments` - 부서
- `clients` - 고객사/발주처

### 1.2 기준 데이터
- `project_categories` - 프로젝트 카테고리 (Energy, Environment, Safety, Disaster, 기타)
- `labor_categories` - 인력구분 (M/D 산정용)
- `md_difficulty_items` - M/D 산정 난이도 항목 (공통)
- `md_field_difficulty_items` - M/D 산정 분야별 난이도 항목
- `md_development_items` - M/D 산정 개발 항목 기준표
- `md_modeling_3d_items` - M/D 산정 3D 모델링 기준표
- `md_modeling_3d_weights` - M/D 산정 3D 모델링 가중치
- `md_pid_items` - M/D 산정 P&ID 기준표
- `md_pid_weights` - M/D 산정 P&ID 가중치

### 1.3 프로젝트 관련
- `projects` - 프로젝트 기본 정보
- `project_status_history` - 프로젝트 상태 변경 이력
- `project_md_estimation` - MD 산정
- `project_vrb_reviews` - VRB 검토
- `project_confirmations` - 컨펌
- `project_profitability` - 수지분석서
- `project_profitability_reviews` - 수지분석서 승인
- `project_settlement` - 정산서
- `project_settlement_reviews` - 정산서 승인
- `project_warranty` - 하자보증
- `project_warranty_issues` - 하자 이슈
- `project_maintenance` - 유상유지보수
- `project_maintenance_tasks` - 유지보수 작업
- `project_labor_allocation` - 프로젝트 인력 배치
- `project_labor_cost_summary` - 인건비 집계
- `project_revenue_forecast` - 수익 전망
- `project_budgets` - 프로젝트 예산
- `project_time_entries` - 시간 추적

### 1.4 인력 및 리소스
- `skills` - 기술 스택
- `user_skills` - 사용자 기술 스택
- `labor_rate_table` - 인건비 단가표
- `md_rate_table` - MD 단가표

### 1.5 프로젝트 실행
- `project_tasks` - 프로젝트 과제/마일스톤
- `project_risks` - 리스크
- `project_issues` - 이슈

---

## 2. 상세 스키마

### 2.1 users (사용자)

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    employee_number VARCHAR(50),
    department_id BIGINT REFERENCES departments(id),
    role_id BIGINT REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    phone VARCHAR(20),
    position VARCHAR(100),
    joined_date DATE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
```

### 2.2 roles (역할)

```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
```

### 2.3 role_permissions (역할별 권한)

```sql
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);
```

### 2.4 departments (부서)

```sql
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_department_id BIGINT REFERENCES departments(id),
    manager_id BIGINT REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
```

### 2.4-1 clients (고객사/발주처)

```sql
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,  -- 고객사/발주처명
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'orderer')),  -- 고객사 또는 발주처
    code VARCHAR(50),  -- 고객사 코드
    description TEXT,
    contact_person VARCHAR(100),  -- 담당자
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_type ON clients(type);
CREATE INDEX idx_clients_code ON clients(code);
```

### 2.5 projects (프로젝트)

```sql
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,  -- 예: P24-039, P25-019
    name VARCHAR(200) NOT NULL,
    customer_id BIGINT REFERENCES clients(id),  -- 고객사
    orderer_id BIGINT REFERENCES clients(id),  -- 발주처
    description TEXT,
    
    -- 프로젝트 카테고리
    category_id BIGINT REFERENCES project_categories(id),
    
    -- 프로젝트 기간
    contract_start_date DATE,  -- 계약 시작일
    contract_end_date DATE,  -- 계약 종료일
    actual_start_date DATE,  -- 실제 시작일
    actual_end_date DATE,  -- 실제 종료일
    
    -- 영업 정보
    sales_stage VARCHAR(20) DEFAULT 'lead' CHECK (sales_stage IN ('lead', 'proposal', 'negotiation', 'won')),  -- 영업단계
    expected_amount DECIMAL(15, 2),  -- 예상 금액
    currency VARCHAR(3) DEFAULT 'KRW',  -- 통화 (KRW, USD 등)
    
    -- 프로젝트 상태
    status VARCHAR(50) NOT NULL DEFAULT 'sales' CHECK (
        status IN (
            'sales',  -- 영업단계
            'md_estimation', 'md_estimated',
            'vrb_review', 'vrb_approved', 'vrb_rejected',
            'team_allocation',  -- 인력 매칭
            'profitability_analysis', 'profitability_completed',
            'profitability_review', 'profitability_approved', 'profitability_rejected',
            'in_progress', 'on_hold', 'completed',
            'settlement', 'settlement_completed',
            'settlement_review', 'settlement_approved', 'settlement_rejected',
            'warranty', 'warranty_completed',  -- 하자보증
            'paid_maintenance',  -- 유상유지보수
            'cancelled'
        )
    ),
    current_phase VARCHAR(50) CHECK (
        current_phase IN ('sales', 'md_estimation', 'vrb', 'team_allocation', 'profitability', 'in_progress', 'settlement', 'warranty', 'paid_maintenance')
    ),
    
    -- 프로젝트 관리자
    manager_id BIGINT REFERENCES users(id),
    sales_representative_id BIGINT REFERENCES users(id),  -- 영업대표
    created_by BIGINT NOT NULL REFERENCES users(id),
    
    -- 프로세스 상태 및 위험도
    process_status VARCHAR(50) CHECK (
        process_status IN ('sales', 'md_estimation', 'vrb', 'confirmation', 'team_allocation', 'profitability', 'in_progress', 'settlement', 'warranty')
    ),  -- 프로젝트 프로세스 상태
    risk_level VARCHAR(10) CHECK (risk_level IN ('high', 'medium', 'low')),  -- 위험도 (상, 중, 하)
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_project_code ON projects(project_code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_current_phase ON projects(current_phase);
CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_sales_representative_id ON projects(sales_representative_id);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_orderer_id ON projects(orderer_id);
CREATE INDEX idx_projects_planned_start_date ON projects(planned_start_date);
```

### 2.6 project_status_history (프로젝트 상태 변경 이력)

```sql
CREATE TABLE project_status_history (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id),
    comments TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_status_history_project_id ON project_status_history(project_id);
CREATE INDEX idx_project_status_history_changed_at ON project_status_history(changed_at);
CREATE INDEX idx_project_status_history_to_status ON project_status_history(to_status);
```

### 2.7 기준 데이터 테이블

#### 2.7.1 project_categories (프로젝트 카테고리)

```sql
CREATE TABLE project_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.2 labor_categories (인력구분)

```sql
CREATE TABLE labor_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.3 md_difficulty_items (M/D 산정 난이도 항목 - 공통)

```sql
CREATE TABLE md_difficulty_items (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    content VARCHAR(200) NOT NULL,
    description TEXT,
    default_difficulty INTEGER DEFAULT 2 CHECK (default_difficulty IN (0, 1, 2, 3)),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.4 md_field_difficulty_items (M/D 산정 분야별 난이도 항목)

```sql
CREATE TABLE md_field_difficulty_items (
    id BIGSERIAL PRIMARY KEY,
    field_category VARCHAR(100) NOT NULL,
    content VARCHAR(200) NOT NULL,
    description TEXT,
    default_difficulty INTEGER DEFAULT 0 CHECK (default_difficulty IN (0, 1, 2, 3)),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.5 md_development_items (M/D 산정 개발 항목 기준표)

```sql
CREATE TABLE md_development_items (
    id BIGSERIAL PRIMARY KEY,
    classification VARCHAR(50) NOT NULL,
    content VARCHAR(200) NOT NULL,
    default_quantity DECIMAL(10, 2) DEFAULT 0,
    standard_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.6 md_modeling_3d_items (M/D 산정 3D 모델링 기준표)

```sql
CREATE TABLE md_modeling_3d_items (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50),
    default_quantity DECIMAL(10, 2) DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.7 md_modeling_3d_weights (M/D 산정 3D 모델링 가중치)

```sql
CREATE TABLE md_modeling_3d_weights (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(200) NOT NULL,
    description TEXT,
    weight DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.8 md_pid_items (M/D 산정 P&ID 기준표)

```sql
CREATE TABLE md_pid_items (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    default_quantity DECIMAL(10, 2) DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.7.9 md_pid_weights (M/D 산정 P&ID 가중치)

```sql
CREATE TABLE md_pid_weights (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(200) NOT NULL,
    description TEXT,
    weight DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.8 project_md_estimations (프로젝트 M/D 산정 헤더)

```sql
CREATE TABLE project_md_estimations (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
    
    -- 난이도 산정 결과
    common_difficulty_sum DECIMAL(10, 2) DEFAULT 0,
    field_difficulty_sum DECIMAL(10, 2) DEFAULT 0,
    project_difficulty DECIMAL(10, 4) DEFAULT 0,
    
    -- M/D 합계
    total_development_md DECIMAL(10, 2) DEFAULT 0,
    total_modeling_3d_md DECIMAL(10, 2) DEFAULT 0,
    total_pid_md DECIMAL(10, 2) DEFAULT 0,
    
    -- M/M 합계
    total_development_mm DECIMAL(10, 2) DEFAULT 0,
    total_modeling_3d_mm DECIMAL(10, 2) DEFAULT 0,
    total_pid_mm DECIMAL(10, 2) DEFAULT 0,
    total_mm DECIMAL(10, 2) DEFAULT 0,
    
    -- 선택된 가중치
    selected_modeling_3d_weight_id BIGINT REFERENCES md_modeling_3d_weights(id),
    selected_pid_weight_id BIGINT REFERENCES md_pid_weights(id),
    
    -- 메타데이터
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, version)
);
```

### 2.9 project_md_estimation_difficulties (프로젝트 M/D 산정 난이도 선택)

```sql
CREATE TABLE project_md_estimation_difficulties (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    difficulty_item_id BIGINT REFERENCES md_difficulty_items(id),
    field_difficulty_item_id BIGINT REFERENCES md_field_difficulty_items(id),
    selected_difficulty INTEGER NOT NULL CHECK (selected_difficulty IN (0, 1, 2, 3)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.10 project_md_estimation_field_categories (프로젝트 M/D 산정 분야별 적용)

```sql
CREATE TABLE project_md_estimation_field_categories (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    field_category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(md_estimation_id, field_category)
);
```

### 2.11 project_md_estimation_development_items (프로젝트 M/D 산정 개발 항목)

```sql
CREATE TABLE project_md_estimation_development_items (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    development_item_id BIGINT REFERENCES md_development_items(id),
    classification VARCHAR(50) NOT NULL,
    content VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    standard_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    calculated_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.12 project_md_estimation_modeling_3d_items (프로젝트 M/D 산정 3D 모델링 항목)

```sql
CREATE TABLE project_md_estimation_modeling_3d_items (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    modeling_3d_item_id BIGINT REFERENCES md_modeling_3d_items(id),
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    calculated_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.13 project_md_estimation_pid_items (프로젝트 M/D 산정 P&ID 항목)

```sql
CREATE TABLE project_md_estimation_pid_items (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    pid_item_id BIGINT REFERENCES md_pid_items(id),
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    calculated_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.8 project_vrb_reviews (VRB 검토)

```sql
CREATE TABLE project_vrb_reviews (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    md_estimation_version INTEGER NOT NULL,  -- 참조된 MD 산정 버전
    review_date DATE NOT NULL,
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_vrb_reviews_project_id ON project_vrb_reviews(project_id);
CREATE INDEX idx_project_vrb_reviews_reviewer_id ON project_vrb_reviews(reviewer_id);
CREATE INDEX idx_project_vrb_reviews_status ON project_vrb_reviews(status);
```

### 2.9 project_confirmations (컨펌)

```sql
CREATE TABLE project_confirmations (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    confirmed_date DATE NOT NULL,
    confirmed_by BIGINT NOT NULL REFERENCES users(id),
    comments TEXT,
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_confirmations_project_id ON project_confirmations(project_id);
CREATE INDEX idx_project_confirmations_confirmed_by ON project_confirmations(confirmed_by);
```

### 2.10 project_profitability (수지분석서)

```sql
CREATE TABLE project_profitability (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,  -- 수지분석서 버전
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved', 'rejected')),
    
    -- 매출 정보
    software_revenue DECIMAL(15, 2) DEFAULT 0,  -- 소프트웨어 매출
    hardware_revenue DECIMAL(15, 2) DEFAULT 0,  -- 하드웨어 매출
    total_revenue DECIMAL(15, 2) GENERATED ALWAYS AS (software_revenue + hardware_revenue) STORED,  -- 총 매출
    
    -- 비용 정보
    labor_cost DECIMAL(15, 2) DEFAULT 0,  -- 인건비 (자동 계산)
    other_cost DECIMAL(15, 2) DEFAULT 0,  -- 기타 비용
    total_cost DECIMAL(15, 2) GENERATED ALWAYS AS (labor_cost + other_cost) STORED,  -- 총 비용
    
    -- 수익성
    net_profit DECIMAL(15, 2) GENERATED ALWAYS AS (total_revenue - total_cost) STORED,  -- 순이익
    profit_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_revenue > 0 THEN (net_profit / total_revenue) * 100
            ELSE 0
        END
    ) STORED,  -- 수익률 (%)
    
    -- 메타데이터
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_profitability_project_id ON project_profitability(project_id);
CREATE INDEX idx_project_profitability_version ON project_profitability(project_id, version);
CREATE INDEX idx_project_profitability_status ON project_profitability(status);
```

### 2.11 project_profitability_reviews (수지분석서 승인)

```sql
CREATE TABLE project_profitability_reviews (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profitability_id BIGINT NOT NULL REFERENCES project_profitability(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_profitability_reviews_project_id ON project_profitability_reviews(project_id);
CREATE INDEX idx_project_profitability_reviews_profitability_id ON project_profitability_reviews(profitability_id);
CREATE INDEX idx_project_profitability_reviews_reviewer_id ON project_profitability_reviews(reviewer_id);
CREATE INDEX idx_project_profitability_reviews_status ON project_profitability_reviews(status);
```

### 2.12 project_labor_allocation (프로젝트 인력 배치)

```sql
CREATE TABLE project_labor_allocation (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    role VARCHAR(100),  -- 역할
    allocation_percentage DECIMAL(5, 2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),  -- 할당률
    month VARCHAR(7) NOT NULL,  -- YYYY-MM 형식
    planned_hours DECIMAL(10, 2) DEFAULT 0,  -- 계획 시간
    actual_hours DECIMAL(10, 2) DEFAULT 0,  -- 실제 시간
    hourly_rate DECIMAL(10, 2) NOT NULL,  -- 시간당 단가
    total_cost DECIMAL(15, 2) GENERATED ALWAYS AS (actual_hours * hourly_rate) STORED,  -- 총 비용
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id, month)
);

CREATE INDEX idx_project_labor_allocation_project_id ON project_labor_allocation(project_id);
CREATE INDEX idx_project_labor_allocation_user_id ON project_labor_allocation(user_id);
CREATE INDEX idx_project_labor_allocation_month ON project_labor_allocation(month);
```

### 2.13 project_labor_cost_summary (인건비 집계)

```sql
CREATE TABLE project_labor_cost_summary (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profitability_id BIGINT REFERENCES project_profitability(id),  -- 수지분석서 연동
    month VARCHAR(7) NOT NULL,  -- YYYY-MM 형식
    total_hours DECIMAL(10, 2) DEFAULT 0,  -- 총 시간
    total_cost DECIMAL(15, 2) DEFAULT 0,  -- 총 비용
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, profitability_id, month)
);

CREATE INDEX idx_project_labor_cost_summary_project_id ON project_labor_cost_summary(project_id);
CREATE INDEX idx_project_labor_cost_summary_profitability_id ON project_labor_cost_summary(profitability_id);
CREATE INDEX idx_project_labor_cost_summary_month ON project_labor_cost_summary(month);
```

### 2.14 project_revenue_forecast (수익 전망)

```sql
CREATE TABLE project_revenue_forecast (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profitability_id BIGINT REFERENCES project_profitability(id),
    forecast_month VARCHAR(7) NOT NULL,  -- YYYY-MM 형식
    revenue_amount DECIMAL(15, 2) DEFAULT 0,
    cost_amount DECIMAL(15, 2) DEFAULT 0,
    profit_amount DECIMAL(15, 2) GENERATED ALWAYS AS (revenue_amount - cost_amount) STORED,
    profit_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN revenue_amount > 0 THEN (profit_amount / revenue_amount) * 100
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, profitability_id, forecast_month)
);

CREATE INDEX idx_project_revenue_forecast_project_id ON project_revenue_forecast(project_id);
CREATE INDEX idx_project_revenue_forecast_profitability_id ON project_revenue_forecast(profitability_id);
CREATE INDEX idx_project_revenue_forecast_month ON project_revenue_forecast(forecast_month);
```

### 2.15 project_settlement (정산서)

```sql
CREATE TABLE project_settlement (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profitability_id BIGINT REFERENCES project_profitability(id),  -- 수지분석서 참조
    version INTEGER DEFAULT 1,  -- 정산서 버전
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved', 'rejected')),
    
    -- 정산 정보
    settlement_date DATE NOT NULL,
    total_revenue DECIMAL(15, 2) DEFAULT 0,  -- 총 매출
    total_cost DECIMAL(15, 2) DEFAULT 0,  -- 총 비용
    net_profit DECIMAL(15, 2) GENERATED ALWAYS AS (total_revenue - total_cost) STORED,  -- 순이익
    
    -- 메타데이터
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_settlement_project_id ON project_settlement(project_id);
CREATE INDEX idx_project_settlement_profitability_id ON project_settlement(profitability_id);
CREATE INDEX idx_project_settlement_status ON project_settlement(status);
```

### 2.16 project_settlement_reviews (정산서 승인)

```sql
CREATE TABLE project_settlement_reviews (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    settlement_id BIGINT NOT NULL REFERENCES project_settlement(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_settlement_reviews_project_id ON project_settlement_reviews(project_id);
CREATE INDEX idx_project_settlement_reviews_settlement_id ON project_settlement_reviews(settlement_id);
CREATE INDEX idx_project_settlement_reviews_reviewer_id ON project_settlement_reviews(reviewer_id);
CREATE INDEX idx_project_settlement_reviews_status ON project_settlement_reviews(status);
```

### 2.16-1 project_warranty (하자보증)

```sql
CREATE TABLE project_warranty (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    warranty_start_date DATE NOT NULL,  -- 하자보증 시작일
    warranty_end_date DATE NOT NULL,  -- 하자보증 종료일 (보통 1년)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    notes TEXT,  -- 비고
    completed_at TIMESTAMP,  -- 완료일
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id)
);

CREATE INDEX idx_project_warranty_project_id ON project_warranty(project_id);
CREATE INDEX idx_project_warranty_status ON project_warranty(status);
CREATE INDEX idx_project_warranty_warranty_end_date ON project_warranty(warranty_end_date);
```

### 2.16-2 project_warranty_issues (하자 이슈)

```sql
CREATE TABLE project_warranty_issues (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    warranty_id BIGINT NOT NULL REFERENCES project_warranty(id) ON DELETE CASCADE,
    issue_title VARCHAR(255) NOT NULL,  -- 이슈 제목
    issue_description TEXT,  -- 이슈 설명
    reported_date DATE NOT NULL,  -- 보고일
    reported_by BIGINT NOT NULL REFERENCES users(id),  -- 보고자
    assigned_to BIGINT REFERENCES users(id),  -- 담당자
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolved_date DATE,  -- 해결일
    resolution_notes TEXT,  -- 해결 내용
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_warranty_issues_project_id ON project_warranty_issues(project_id);
CREATE INDEX idx_project_warranty_issues_warranty_id ON project_warranty_issues(warranty_id);
CREATE INDEX idx_project_warranty_issues_status ON project_warranty_issues(status);
CREATE INDEX idx_project_warranty_issues_assigned_to ON project_warranty_issues(assigned_to);
```

### 2.16-3 project_maintenance (유상유지보수)

```sql
CREATE TABLE project_maintenance (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) UNIQUE,  -- 계약 번호
    contract_start_date DATE NOT NULL,  -- 계약 시작일
    contract_end_date DATE NOT NULL,  -- 계약 종료일
    contract_amount DECIMAL(15, 2) NOT NULL,  -- 계약 금액
    maintenance_type VARCHAR(50),  -- 유지보수 유형 (preventive/corrective/emergency)
    renewal_date DATE,  -- 갱신일
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewed', 'terminated')),
    notes TEXT,  -- 비고
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_maintenance_project_id ON project_maintenance(project_id);
CREATE INDEX idx_project_maintenance_status ON project_maintenance(status);
CREATE INDEX idx_project_maintenance_contract_end_date ON project_maintenance(contract_end_date);
```

### 2.16-4 project_maintenance_tasks (유지보수 작업)

```sql
CREATE TABLE project_maintenance_tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    maintenance_id BIGINT NOT NULL REFERENCES project_maintenance(id) ON DELETE CASCADE,
    task_title VARCHAR(255) NOT NULL,  -- 작업 제목
    task_description TEXT,  -- 작업 설명
    task_date DATE NOT NULL,  -- 작업일
    assigned_to BIGINT REFERENCES users(id),  -- 담당자
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_date DATE,  -- 완료일
    hours_spent DECIMAL(10, 2),  -- 소요 시간
    cost DECIMAL(15, 2),  -- 비용
    notes TEXT,  -- 비고
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_maintenance_tasks_project_id ON project_maintenance_tasks(project_id);
CREATE INDEX idx_project_maintenance_tasks_maintenance_id ON project_maintenance_tasks(maintenance_id);
CREATE INDEX idx_project_maintenance_tasks_status ON project_maintenance_tasks(status);
CREATE INDEX idx_project_maintenance_tasks_assigned_to ON project_maintenance_tasks(assigned_to);
```

### 2.17 labor_rate_table (인건비 단가표)

```sql
CREATE TABLE labor_rate_table (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(100) NOT NULL,  -- 역할
    rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('standard', 'current', 'year_ago')),  -- 단가 유형
    hourly_rate DECIMAL(10, 2) NOT NULL,  -- 시간당 단가
    effective_date DATE NOT NULL,  -- 적용 시작일
    expiry_date DATE,  -- 적용 종료일
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, rate_type, effective_date)
);

CREATE INDEX idx_labor_rate_table_role ON labor_rate_table(role);
CREATE INDEX idx_labor_rate_table_rate_type ON labor_rate_table(rate_type);
CREATE INDEX idx_labor_rate_table_effective_date ON labor_rate_table(effective_date);
```

### 2.18 md_rate_table (MD 단가표)

```sql
CREATE TABLE md_rate_table (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(100) NOT NULL,  -- 역할
    hourly_rate DECIMAL(10, 2) NOT NULL,  -- 시간당 단가
    md_rate DECIMAL(10, 2) GENERATED ALWAYS AS (hourly_rate * 8) STORED,  -- MD당 단가 (8시간 기준)
    effective_date DATE NOT NULL,  -- 적용 시작일
    expiry_date DATE,  -- 적용 종료일
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, effective_date)
);

CREATE INDEX idx_md_rate_table_role ON md_rate_table(role);
CREATE INDEX idx_md_rate_table_effective_date ON md_rate_table(effective_date);
```

### 2.19 skills (기술 스택)

```sql
CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),  -- language/framework/tool/etc
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);
```

### 2.20 user_skills (사용자 기술 스택)

```sql
CREATE TABLE user_skills (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),  -- 숙련도 1-5
    certified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
```

---

## 3. 트리거 및 함수

### 3.1 프로젝트 상태 변경 이력 자동 기록

```sql
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO project_status_history (
            project_id,
            from_status,
            to_status,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.updated_by,  -- updated_by 컬럼 추가 필요
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_status_change
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION log_project_status_change();
```

### 3.2 updated_at 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (다른 테이블들도 동일하게)
```

---

## 4. 초기 데이터 (Seed Data)

### 4.1 기본 역할

```sql
INSERT INTO roles (name, description) VALUES
('Admin', '시스템 전체 관리 권한'),
('Manager', '프로젝트 및 리소스 관리 권한'),
('PM', '프로젝트 매니저'),
('VRB_Member', 'VRB 검토 멤버'),
('User', '기본 사용자 권한');

-- Admin 권한
INSERT INTO role_permissions (role_id, permission) VALUES
(1, 'user.manage'),
(1, 'role.manage'),
(1, 'project.manage'),
(1, 'project.approve'),
(1, 'settlement.manage'),
(1, 'settlement.approve');

-- Manager 권한
INSERT INTO role_permissions (role_id, permission) VALUES
(2, 'project.create'),
(2, 'project.edit'),
(2, 'project.approve'),
(2, 'resource.manage');

-- PM 권한
INSERT INTO role_permissions (role_id, permission) VALUES
(3, 'project.create'),
(3, 'project.edit'),
(3, 'project.team.manage'),
(3, 'md.estimation'),
(3, 'profitability.create'),
(3, 'settlement.create');

-- VRB_Member 권한
INSERT INTO role_permissions (role_id, permission) VALUES
(4, 'vrb.review'),
(4, 'profitability.review');

-- User 권한
INSERT INTO role_permissions (role_id, permission) VALUES
(5, 'project.view'),
(5, 'resource.view');
```

---

## 5. 주요 쿼리 패턴

### 5.1 프로젝트 목록 (상태별 필터)

```sql
SELECT 
    p.id,
    p.project_code,
    p.name,
    p.client_name,
    p.status,
    p.current_phase,
    p.planned_start_date,
    p.planned_end_date,
    u.name as manager_name,
    COUNT(DISTINCT pla.id) as team_member_count
FROM projects p
LEFT JOIN users u ON p.manager_id = u.id
LEFT JOIN project_labor_allocation pla ON p.id = pla.project_id
WHERE p.status = $1  -- 상태 필터
GROUP BY p.id, u.name
ORDER BY p.created_at DESC;
```

### 5.2 프로젝트 현황 대시보드

```sql
SELECT 
    status,
    COUNT(*) as count
FROM projects
GROUP BY status
ORDER BY status;
```

### 5.3 인건비 자동 계산 (프로젝트별)

```sql
SELECT 
    project_id,
    SUM(total_cost) as total_labor_cost
FROM project_labor_allocation
WHERE project_id = $1
GROUP BY project_id;
```

---

## 6. 인덱스 최적화

모든 외래키와 자주 조회되는 컬럼에 인덱스가 생성되어 있습니다. 추가로 필요한 인덱스는 실제 사용 패턴에 따라 조정하세요.
