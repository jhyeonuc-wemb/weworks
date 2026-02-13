---
description: API 설계 및 데이터 핸들링 표준 가이드
---

# API 및 데이터 핸들링 표준

이 가이드는 `weworks` 시스템의 백엔드(DB)와 프론트엔드 간의 데이터 흐름을 일관되게 유지하기 위한 규칙입니다.

## 1. 명명 규칙 (Naming Convention)
- **Database (PostgreSQL):** `snake_case`를 사용합니다. (예: `project_id`, `total_amount`)
- **Frontend (TypeScript/React):** `camelCase`를 사용합니다. (예: `projectId`, `totalAmount`)
- **API Response:** DB의 `snake_case` 결과를 그대로 반환하기보다는 프론트엔드에서 사용하기 편한 `camelCase`로 변환하여 반환하는 것을 원칙으로 합니다.

## 2. API 엔드포인트 구조
- **목록 조회:** `GET /api/[module]`
- **상세 조회:** `GET /api/[module]/[id]`
- **생성/수정:** `PUT /api/[module]/[id]` (본 시스템은 생성과 수정을 PUT으로 통합하여 사용하는 경우가 많음)
- **상태 전용 업데이트:** `PUT /api/[module]/status` 또는 `PUT /api/[module]/[id]/status`

## 3. 데이터 변환 규칙
- API에서 데이터를 클라이언트로 보낼 때 숫자는 `Number()`로 변환하여 데이터 형식을 보장합니다.
- 날짜 데이터는 `ISO String` 형식을 사용하거나, 목록 페이지의 경우 프론트엔드에서 `new Date().toLocaleDateString()` 등으로 포맷팅합니다.

## 4. 에러 처리
- 성공 시: `{ success: true, data: ... }`
- 실패 시: `return NextResponse.json({ error: "에러 메시지", message: error.message }, { status: 500 })`
- 일관된 에러 메시지 형식을 사용하여 프론트엔드에서 `toast` 등으로 표시하기 용이하게 합니다.

## 5. SQL 쿼리 작성 시 주의사항
- `RETURNING id, status` 등을 활용하여 업데이트 직후의 상태를 클라이언트에 즉시 반영합니다.
- 복잡한 계산식은 가급적 SQL 단에서 처리하여 프론트엔드 부담을 줄입니다.
