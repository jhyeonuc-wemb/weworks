# WEWORKS 데이터베이스 설정 가이드

## 개요

WEWORKS 시스템의 데이터베이스 스키마와 시드 데이터를 관리합니다.

## 파일 구조

- `schema.sql`: 데이터베이스 스키마 정의 (테이블 생성)
- `seed.sql`: 기준 데이터 및 초기 데이터 삽입

## 데이터베이스 설정

### 1. PostgreSQL 설치

PostgreSQL 14 이상 버전이 필요합니다.

### 2. 데이터베이스 생성

```sql
CREATE DATABASE weworks;
```

### 3. 스키마 적용

```bash
psql -U postgres -d weworks -f schema.sql
```

### 4. 시드 데이터 적용

```bash
psql -U postgres -d weworks -f seed.sql
```

## 주요 테이블 구조

### 기준 데이터 테이블

1. **project_categories**: 프로젝트 카테고리 (Energy, Environment, Safety, Disaster, 기타)
2. **labor_categories**: 인력구분 (PM, 개발, 설계, I/F, 2D디자인, 포탈, QA)
3. **md_difficulty_items**: M/D 산정 난이도 항목 (공통 40개)
4. **md_field_difficulty_items**: M/D 산정 분야별 난이도 항목 (대시보드, 디지털트윈)
5. **md_development_items**: M/D 산정 개발 항목 기준표 (25개)
6. **md_modeling_3d_items**: M/D 산정 3D 모델링 기준표 (12개)
7. **md_modeling_3d_weights**: M/D 산정 3D 모델링 가중치 (5개)
8. **md_pid_items**: M/D 산정 P&ID 기준표 (2개)
9. **md_pid_weights**: M/D 산정 P&ID 가중치 (3개)

### 프로젝트 M/D 산정 테이블

1. **project_md_estimations**: 프로젝트별 M/D 산정 헤더
2. **project_md_estimation_difficulties**: 프로젝트별 난이도 선택
3. **project_md_estimation_field_categories**: 프로젝트별 분야별 적용
4. **project_md_estimation_development_items**: 프로젝트별 개발 항목
5. **project_md_estimation_modeling_3d_items**: 프로젝트별 3D 모델링 항목
6. **project_md_estimation_pid_items**: 프로젝트별 P&ID 항목

## 데이터 관리

### 기준 데이터 수정

기준 데이터는 `seed.sql` 파일을 수정한 후 다시 실행하면 됩니다. 
단, 기존 데이터를 보존하려면 UPDATE 문을 사용하거나 관리 화면을 통해 수정해야 합니다.

### 프로젝트 카테고리 추가

```sql
INSERT INTO project_categories (code, name, description, display_order) 
VALUES ('new_category', '새 카테고리', '설명', 6);
```

### 인력구분 추가

```sql
INSERT INTO labor_categories (code, name, description, display_order) 
VALUES ('new_role', '새 역할', '설명', 8);
```

### M/D 산정 개발 항목 추가

```sql
INSERT INTO md_development_items (classification, content, default_quantity, standard_md, display_order) 
VALUES ('개발', '새 개발 항목', 0, 5, 26);
```

## 다음 단계

1. ORM 설정 (Prisma, TypeORM 등 선택)
2. API 엔드포인트 구현
3. 프론트엔드와 데이터베이스 연동
