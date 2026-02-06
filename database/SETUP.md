# WEWORKS 데이터베이스 설정 가이드

## 실행 순서

### 처음 설치하는 경우
1. **01_create_tables.sql** - 테이블 생성
2. **02_insert_seed_data.sql** - 기준 데이터 삽입

### 기존 테이블을 모두 삭제하고 다시 만드는 경우
1. **00_drop_all_tables.sql** - 모든 테이블 삭제 (주의: 모든 데이터가 삭제됩니다!)
2. **01_create_tables.sql** - 테이블 생성
3. **02_insert_seed_data.sql** - 기준 데이터 삽입

## PostgreSQL 실행 방법

### 방법 1: psql 명령어 사용

```bash
# 데이터베이스 생성 (필요한 경우)
createdb weworks

# 기존 테이블 모두 삭제 (선택사항, 처음 설치 시에는 생략)
psql -U postgres -d weworks -f 00_drop_all_tables.sql

# 테이블 생성
psql -U postgres -d weworks -f 01_create_tables.sql

# 시드 데이터 삽입
psql -U postgres -d weworks -f 02_insert_seed_data.sql
```

### 방법 2: pgAdmin 사용

1. pgAdmin에서 데이터베이스 연결
2. `01_create_tables.sql` 파일 열기
3. 실행 (F5 또는 Execute)
4. `02_insert_seed_data.sql` 파일 열기
5. 실행 (F5 또는 Execute)

### 방법 3: DBeaver 등 GUI 도구 사용

1. 데이터베이스 연결
2. SQL 스크립트 파일을 열어서 실행

## 테이블 구조

### 기본 테이블
- `we_roles` - 역할
- `we_departments` - 부서
- `we_users` - 사용자
- `we_role_permissions` - 역할별 권한
- `we_clients` - 고객사/발주처

### 기준 데이터 테이블
- `we_project_categories` - 프로젝트 카테고리
- `we_labor_categories` - 인력구분
- `we_md_difficulty_items` - M/D 산정 난이도 항목 (공통)
- `we_md_field_difficulty_items` - M/D 산정 분야별 난이도 항목
- `we_md_development_items` - M/D 산정 개발 항목 기준표
- `we_md_modeling_3d_items` - M/D 산정 3D 모델링 기준표
- `we_md_modeling_3d_weights` - M/D 산정 3D 모델링 가중치
- `we_md_pid_items` - M/D 산정 P&ID 기준표
- `we_md_pid_weights` - M/D 산정 P&ID 가중치

### 프로젝트 테이블
- `we_projects` - 프로젝트 기본 정보

### M/D 산정 테이블
- `we_project_md_estimations` - 프로젝트 M/D 산정 헤더
- `we_project_md_estimation_difficulties` - 프로젝트 M/D 산정 난이도 선택
- `we_project_md_estimation_field_categories` - 프로젝트 M/D 산정 분야별 적용
- `we_project_md_estimation_development_items` - 프로젝트 M/D 산정 개발 항목
- `we_project_md_estimation_modeling_3d_items` - 프로젝트 M/D 산정 3D 모델링 항목
- `we_project_md_estimation_pid_items` - 프로젝트 M/D 산정 P&ID 항목

## 주의사항

1. **삭제 스크립트**: `00_drop_all_tables.sql`은 **모든 테이블과 데이터를 삭제**합니다. 신중하게 사용하세요!

2. **실행 순서**: 반드시 `01_create_tables.sql`을 먼저 실행한 후 `02_insert_seed_data.sql`을 실행해야 합니다.

2. **외래키 제약**: `departments` 테이블의 `manager_id`는 `users` 테이블을 참조하므로, `users` 테이블 생성 후 외래키가 추가됩니다.

3. **시드 데이터**: 시드 데이터는 `ON CONFLICT DO NOTHING`을 사용하므로 중복 실행해도 안전합니다.

4. **비밀번호**: 사용자 비밀번호는 임시 값입니다. 실제 운영 시 반드시 해시화된 비밀번호로 변경해야 합니다.

## 확인 방법

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 프로젝트 카테고리 확인
SELECT * FROM we_project_categories;

-- 인력구분 확인
SELECT * FROM we_labor_categories;

-- M/D 난이도 항목 확인
SELECT COUNT(*) FROM we_md_difficulty_items;
SELECT COUNT(*) FROM we_md_field_difficulty_items;
```
