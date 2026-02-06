-- WEWORKS 데이터베이스 스키마
-- PostgreSQL 기반

-- ============================================
-- 0. 기본 테이블 (사용자, 권한, 부서, 고객사)
-- ============================================

-- roles (역할)
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- departments (부서)
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_department_id BIGINT REFERENCES departments(id),
    manager_id BIGINT,  -- users 테이블 참조는 나중에 추가
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

-- users (사용자)
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- departments 테이블의 manager_id 외래키 추가
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
ALTER TABLE departments ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id);

-- role_permissions (역할별 권한)
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- clients (고객사/발주처)
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'orderer')),
    code VARCHAR(50),
    description TEXT,
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(code);

-- ============================================
-- 1. 기준 데이터 테이블
-- ============================================

-- 프로젝트 카테고리
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

CREATE INDEX idx_project_categories_code ON project_categories(code);
CREATE INDEX idx_project_categories_is_active ON project_categories(is_active);

-- 인력구분 (M/D 산정용)
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

CREATE INDEX idx_labor_categories_code ON labor_categories(code);
CREATE INDEX idx_labor_categories_is_active ON labor_categories(is_active);

-- M/D 산정 난이도 항목 (공통)
CREATE TABLE md_difficulty_items (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,  -- 요구사항, 화면/기능, 연계 및 외부 시스템 등
    content VARCHAR(200) NOT NULL,
    description TEXT,
    default_difficulty INTEGER DEFAULT 2 CHECK (default_difficulty IN (0, 1, 2, 3)),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_difficulty_items_category ON md_difficulty_items(category);
CREATE INDEX idx_md_difficulty_items_is_active ON md_difficulty_items(is_active);

-- M/D 산정 분야별 난이도 항목
CREATE TABLE md_field_difficulty_items (
    id BIGSERIAL PRIMARY KEY,
    field_category VARCHAR(100) NOT NULL,  -- 대시보드, 디지털트윈
    content VARCHAR(200) NOT NULL,
    description TEXT,
    default_difficulty INTEGER DEFAULT 0 CHECK (default_difficulty IN (0, 1, 2, 3)),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_field_difficulty_items_field_category ON md_field_difficulty_items(field_category);
CREATE INDEX idx_md_field_difficulty_items_is_active ON md_field_difficulty_items(is_active);

-- M/D 산정 개발 항목 기준표
CREATE TABLE md_development_items (
    id BIGSERIAL PRIMARY KEY,
    classification VARCHAR(50) NOT NULL,  -- PM, 개발, I/F, 2D디자인, 포탈
    content VARCHAR(200) NOT NULL,
    default_quantity DECIMAL(10, 2) DEFAULT 0,
    standard_md DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 기준 M/D
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_development_items_classification ON md_development_items(classification);
CREATE INDEX idx_md_development_items_is_active ON md_development_items(is_active);

-- M/D 산정 3D 모델링 기준표
CREATE TABLE md_modeling_3d_items (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,  -- 부지, 건물, 층, 설비/장비, 캐릭터
    difficulty VARCHAR(50),  -- 난이도 정보
    default_quantity DECIMAL(10, 2) DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 기준 M/D
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_modeling_3d_items_category ON md_modeling_3d_items(category);
CREATE INDEX idx_md_modeling_3d_items_is_active ON md_modeling_3d_items(is_active);

-- M/D 산정 3D 모델링 가중치
CREATE TABLE md_modeling_3d_weights (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(200) NOT NULL,  -- 모델링 제공, 모델링 미제공 등
    description TEXT,
    weight DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_modeling_3d_weights_is_active ON md_modeling_3d_weights(is_active);

-- M/D 산정 P&ID 기준표
CREATE TABLE md_pid_items (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,  -- P&ID, SLD
    default_quantity DECIMAL(10, 2) DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 기준 M/D
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_pid_items_category ON md_pid_items(category);
CREATE INDEX idx_md_pid_items_is_active ON md_pid_items(is_active);

-- M/D 산정 P&ID 가중치
CREATE TABLE md_pid_weights (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(200) NOT NULL,  -- 수기 작성, DrawDX, MS Visio
    description TEXT,
    weight DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_md_pid_weights_is_active ON md_pid_weights(is_active);

-- ============================================
-- 2. 프로젝트 테이블
-- ============================================

-- projects (프로젝트)
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE,  -- NULL 허용 (계약 완료 후 생성), UNIQUE는 NULL 제외
    name VARCHAR(200) NOT NULL,
    category_id BIGINT REFERENCES project_categories(id),
    customer_id BIGINT REFERENCES clients(id),
    orderer_id BIGINT REFERENCES clients(id),
    description TEXT,
    
    -- 프로젝트 기간
    contract_start_date DATE,
    contract_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- 영업 정보
    sales_stage VARCHAR(20) DEFAULT 'lead' CHECK (sales_stage IN ('lead', 'proposal', 'negotiation', 'won')),
    expected_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    
    -- 프로젝트 상태
    status VARCHAR(50) NOT NULL DEFAULT 'sales_opportunity' CHECK (
        status IN (
            'sales_opportunity', 'deal_won',
            'md_estimation', 'md_estimated',
            'vrb_review', 'vrb_approved', 'vrb_rejected',
            'team_allocation',
            'profitability_analysis', 'profitability_completed',
            'profitability_review', 'profitability_approved', 'profitability_rejected',
            'in_progress', 'on_hold', 'completed',
            'settlement', 'settlement_completed',
            'settlement_review', 'settlement_approved', 'settlement_rejected',
            'warranty', 'warranty_completed',
            'paid_maintenance',
            'cancelled'
        )
    ),
    current_phase VARCHAR(50) CHECK (
        current_phase IN ('sales', 'md_estimation', 'vrb', 'team_allocation', 'profitability', 'in_progress', 'settlement', 'warranty', 'paid_maintenance')
    ),
    
    -- 프로젝트 관리자
    manager_id BIGINT REFERENCES users(id),
    sales_representative_id BIGINT REFERENCES users(id),
    created_by BIGINT NOT NULL REFERENCES users(id),
    
    -- 프로세스 상태 및 위험도
    process_status VARCHAR(50) CHECK (
        process_status IN ('sales', 'md_estimation', 'vrb', 'confirmation', 'team_allocation', 'profitability', 'in_progress', 'settlement', 'warranty')
    ),
    risk_level VARCHAR(10) CHECK (risk_level IN ('high', 'medium', 'low')),
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_current_phase ON projects(current_phase);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_sales_representative_id ON projects(sales_representative_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_orderer_id ON projects(orderer_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);

-- ============================================
-- 3. 프로젝트 M/D 산정 테이블
-- ============================================

-- 프로젝트 M/D 산정 헤더
CREATE TABLE project_md_estimations (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
    
    -- 난이도 산정 결과
    common_difficulty_sum DECIMAL(10, 2) DEFAULT 0,  -- 공통 난이도 합계
    field_difficulty_sum DECIMAL(10, 2) DEFAULT 0,  -- 분야별 난이도 합계
    project_difficulty DECIMAL(10, 4) DEFAULT 0,  -- 최종 프로젝트 난이도
    
    -- M/D 합계
    total_development_md DECIMAL(10, 2) DEFAULT 0,  -- 개발항목 총 M/D
    total_modeling_3d_md DECIMAL(10, 2) DEFAULT 0,  -- 3D 모델링 총 M/D
    total_pid_md DECIMAL(10, 2) DEFAULT 0,  -- P&ID 총 M/D
    
    -- M/M 합계
    total_development_mm DECIMAL(10, 2) DEFAULT 0,  -- 개발항목 M/M
    total_modeling_3d_mm DECIMAL(10, 2) DEFAULT 0,  -- 3D 모델링 M/M
    total_pid_mm DECIMAL(10, 2) DEFAULT 0,  -- P&ID M/M
    total_mm DECIMAL(10, 2) DEFAULT 0,  -- 전체 M/M
    
    -- 선택된 가중치
    selected_modeling_3d_weight_id BIGINT REFERENCES md_modeling_3d_weights(id),
    selected_pid_weight_id BIGINT REFERENCES md_pid_weights(id),
    
    -- 메타데이터
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, version)
);

CREATE INDEX idx_project_md_estimations_project_id ON project_md_estimations(project_id);
CREATE INDEX idx_project_md_estimations_version ON project_md_estimations(project_id, version);
CREATE INDEX idx_project_md_estimations_status ON project_md_estimations(status);

-- 프로젝트 M/D 산정 난이도 선택
CREATE TABLE project_md_estimation_difficulties (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    difficulty_item_id BIGINT REFERENCES md_difficulty_items(id),
    field_difficulty_item_id BIGINT REFERENCES md_field_difficulty_items(id),
    selected_difficulty INTEGER NOT NULL CHECK (selected_difficulty IN (0, 1, 2, 3)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (
        (difficulty_item_id IS NOT NULL AND field_difficulty_item_id IS NULL) OR
        (difficulty_item_id IS NULL AND field_difficulty_item_id IS NOT NULL)
    )
);

CREATE INDEX idx_project_md_estimation_difficulties_md_estimation_id ON project_md_estimation_difficulties(md_estimation_id);
CREATE INDEX idx_project_md_estimation_difficulties_difficulty_item_id ON project_md_estimation_difficulties(difficulty_item_id);
CREATE INDEX idx_project_md_estimation_difficulties_field_difficulty_item_id ON project_md_estimation_difficulties(field_difficulty_item_id);

-- 프로젝트 M/D 산정 분야별 적용
CREATE TABLE project_md_estimation_field_categories (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    field_category VARCHAR(100) NOT NULL,  -- 대시보드, 디지털트윈
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(md_estimation_id, field_category)
);

CREATE INDEX idx_project_md_estimation_field_categories_md_estimation_id ON project_md_estimation_field_categories(md_estimation_id);

-- 프로젝트 M/D 산정 개발 항목
CREATE TABLE project_md_estimation_development_items (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    development_item_id BIGINT REFERENCES md_development_items(id),  -- NULL이면 사용자 추가 항목
    classification VARCHAR(50) NOT NULL,
    content VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    standard_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    calculated_md DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- quantity * standard_md
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_md_estimation_development_items_md_estimation_id ON project_md_estimation_development_items(md_estimation_id);
CREATE INDEX idx_project_md_estimation_development_items_classification ON project_md_estimation_development_items(classification);

-- 프로젝트 M/D 산정 3D 모델링 항목
CREATE TABLE project_md_estimation_modeling_3d_items (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    modeling_3d_item_id BIGINT REFERENCES md_modeling_3d_items(id),  -- NULL이면 사용자 추가 항목
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    calculated_md DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- quantity * base_md
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_md_estimation_modeling_3d_items_md_estimation_id ON project_md_estimation_modeling_3d_items(md_estimation_id);

-- 프로젝트 M/D 산정 P&ID 항목
CREATE TABLE project_md_estimation_pid_items (
    id BIGSERIAL PRIMARY KEY,
    md_estimation_id BIGINT NOT NULL REFERENCES project_md_estimations(id) ON DELETE CASCADE,
    pid_item_id BIGINT REFERENCES md_pid_items(id),  -- NULL이면 사용자 추가 항목
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    base_md DECIMAL(10, 2) NOT NULL DEFAULT 0,
    calculated_md DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- quantity * base_md
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_md_estimation_pid_items_md_estimation_id ON project_md_estimation_pid_items(md_estimation_id);

