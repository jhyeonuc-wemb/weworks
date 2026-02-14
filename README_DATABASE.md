# 데이터베이스 연결 가이드

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
DB_HOST=115.21.12.186
DB_PORT=7432
DB_NAME=weworks
DB_USER=weworks
DB_PASSWORD=weworks!1234
```

또는 `.env.local.example` 파일을 복사하여 사용하세요:
```bash
cp .env.local.example .env.local
```

## 데이터베이스 연결 확인

1. PostgreSQL이 실행 중인지 확인
2. 데이터베이스 `weworks`가 생성되어 있는지 확인
3. 테이블이 생성되어 있는지 확인

## API 엔드포인트

### 프로젝트
- `GET /api/projects` - 프로젝트 목록 조회
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects/[id]` - 프로젝트 상세 조회
- `PUT /api/projects/[id]` - 프로젝트 수정

### 사용자
- `GET /api/users` - 사용자 목록 조회 (검색, 역할 필터 지원)

### 고객사/발주처
- `GET /api/clients` - 고객사/발주처 목록 조회 (검색, 타입 필터 지원)

### 프로젝트 카테고리
- `GET /api/project-categories` - 프로젝트 카테고리 목록 조회

## 연결된 화면

✅ 프로젝트 목록 (`/projects`)
✅ 프로젝트 상세 (`/projects/[id]`)
✅ 프로젝트 생성 (`/projects/new`)

## 다음 단계

다음 화면들을 연결해야 합니다:
- M/D 산정 화면
- VRB 화면
- 수지분석서 화면
- 수지정산서 화면
- 인력 배치 화면
- 설정 화면들
