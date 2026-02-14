# WEWORKS 데이터베이스 구현 가이드

## 개요

이 문서는 WEWORKS 시스템의 데이터베이스 구현을 위한 가이드입니다. 프로젝트 생성부터 M/D 산정까지 실제 데이터를 입력할 수 있도록 모든 기준 데이터와 테이블을 준비했습니다.

## 파일 구조

```
database/
├── schema.sql          # 전체 데이터베이스 스키마 (테이블 생성)
├── seed.sql            # 기준 데이터 및 초기 데이터
├── README.md           # 데이터베이스 설정 가이드
└── IMPLEMENTATION_GUIDE.md  # 구현 가이드 (이 파일)
```

## 주요 테이블 구조

### 1. 기준 데이터 테이블

모든 기준 데이터는 코드로 관리되며, 관리 화면에서 수정 가능합니다.

#### 프로젝트 카테고리 (`project_categories`)
- Energy, Environment, Safety, Disaster, 기타

#### 인력구분 (`labor_categories`)
- PM, 개발, 설계, I/F, 2D디자인, 포탈, QA

#### M/D 산정 기준 데이터
- **난이도 항목** (`md_difficulty_items`): 공통 난이도 40개 항목
- **분야별 난이도** (`md_field_difficulty_items`): 대시보드, 디지털트윈 13개 항목
- **개발 항목** (`md_development_items`): 25개 기본 개발 항목
- **3D 모델링 기준표** (`md_modeling_3d_items`): 12개 항목
- **3D 모델링 가중치** (`md_modeling_3d_weights`): 5개 가중치
- **P&ID 기준표** (`md_pid_items`): 2개 항목
- **P&ID 가중치** (`md_pid_weights`): 3개 가중치

### 2. 프로젝트 M/D 산정 테이블

프로젝트별 M/D 산정 데이터를 저장하는 테이블들:

- `project_md_estimations`: M/D 산정 헤더 (버전 관리)
- `project_md_estimation_difficulties`: 선택된 난이도 항목
- `project_md_estimation_field_categories`: 적용된 분야 (대시보드, 디지털트윈)
- `project_md_estimation_development_items`: 개발 항목별 입력 데이터
- `project_md_estimation_modeling_3d_items`: 3D 모델링 입력 데이터
- `project_md_estimation_pid_items`: P&ID 입력 데이터

## 데이터베이스 설정 방법

### 1. PostgreSQL 설치 및 데이터베이스 생성

```bash
# PostgreSQL 설치 (이미 설치되어 있다면 생략)
# Windows: https://www.postgresql.org/download/windows/
# 또는 winget install PostgreSQL.PostgreSQL

# 데이터베이스 생성
psql -U postgres
CREATE DATABASE weworks;
\q
```

### 2. 스키마 적용

```bash
psql -U postgres -d weworks -f database/schema.sql
```

### 3. 시드 데이터 적용

```bash
psql -U postgres -d weworks -f database/seed.sql
```

## 다음 단계

### 1. ORM 설정 (선택사항)

Prisma, TypeORM, 또는 직접 SQL을 사용할 수 있습니다.

**Prisma 예시:**
```bash
npm install prisma @prisma/client
npx prisma init
```

### 2. API 엔드포인트 구현

- 프로젝트 CRUD API
- M/D 산정 CRUD API
- 기준 데이터 조회 API

### 3. 프론트엔드 연동

현재 하드코딩된 데이터를 API 호출로 교체:
- `app/(main)/projects/new/page.tsx`: 프로젝트 생성 API
- `app/(main)/projects/[id]/md-estimation/page.tsx`: M/D 산정 API
- `app/(main)/settings/labor-categories/page.tsx`: 인력구분 관리 API

## 데이터 흐름

1. **프로젝트 생성**
   - `projects` 테이블에 프로젝트 생성
   - `project_categories`에서 카테고리 선택
   - `clients`에서 고객사/발주처 선택
   - `users`에서 PM, 영업대표 선택

2. **M/D 산정 시작**
   - `project_md_estimations`에 새 버전 생성
   - `md_difficulty_items`에서 난이도 항목 로드
   - `md_development_items`에서 개발 항목 기준표 로드
   - `md_modeling_3d_items`, `md_pid_items`에서 기준표 로드

3. **M/D 산정 입력**
   - 난이도 선택 → `project_md_estimation_difficulties`
   - 개발 항목 입력 → `project_md_estimation_development_items`
   - 3D 모델링 입력 → `project_md_estimation_modeling_3d_items`
   - P&ID 입력 → `project_md_estimation_pid_items`

4. **M/D 산정 완료**
   - 모든 계산 결과를 `project_md_estimations`에 저장
   - 상태를 'completed'로 변경

## 기준 데이터 관리

모든 기준 데이터는 관리 화면에서 수정 가능합니다:
- 프로젝트 카테고리: Settings → 프로젝트 카테고리 관리 (추가 필요)
- 인력구분: Settings → 인력구분 관리
- M/D 산정 기준표: Settings → M/D 산정 기준표 관리 (추가 필요)

## 주의사항

1. **프로젝트 코드**: `project_code`는 NULL 허용이며, 계약 완료 후에만 생성됩니다.
2. **M/D 산정 버전**: 프로젝트당 여러 버전의 M/D 산정을 관리할 수 있습니다.
3. **기준 데이터 수정**: 기준 데이터를 수정하면 기존 프로젝트의 M/D 산정에는 영향을 주지 않습니다 (스냅샷 방식).
