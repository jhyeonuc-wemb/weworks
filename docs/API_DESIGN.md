# API 설계 문서

## 1. API 아키텍처 개요

모든 프론트엔드 데이터는 RESTful API를 통해 데이터베이스에서 가져옵니다.
현재는 임시 데이터(hardcoded)를 사용하고 있으나, 다음 단계에서 실제 API로 교체 예정입니다.

### 기술 스택 (예상)
- **Backend**: Next.js API Routes 또는 별도 백엔드 서버
- **Database**: PostgreSQL (설계 완료)
- **ORM**: Prisma 또는 Drizzle ORM (선택 필요)
- **인증**: JWT 또는 Session 기반

---

## 2. API 엔드포인트 설계

### 2.1 사용자 관련 API

#### **GET /api/users**
사용자 목록 조회

**Query Parameters:**
- `role` (optional): 역할 필터 (PM, Sales, Manager 등)
- `department_id` (optional): 부서 ID
- `search` (optional): 이름 또는 이메일 검색
- `page` (optional): 페이지 번호 (기본: 1)
- `limit` (optional): 페이지당 항목 수 (기본: 50)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "email": "hong@weworks.com",
      "name": "홍길동",
      "employeeNumber": "E001",
      "departmentId": 1,
      "departmentName": "IT기획팀",
      "roleId": 3,
      "roleName": "PM",
      "status": "active",
      "phone": "010-1234-5678",
      "position": "시니어 프로젝트 매니저"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### **GET /api/users/:id**
사용자 상세 정보 조회

#### **GET /api/users/me**
현재 로그인한 사용자 정보

---

### 2.2 프로젝트 관련 API

#### **GET /api/projects**
프로젝트 목록 조회

**Query Parameters:**
- `status` (optional): 상태 필터
- `current_phase` (optional): 현재 단계 필터
- `client_name` (optional): 클라이언트명 검색
- `manager_id` (optional): PM ID
- `sales_representative_id` (optional): 영업대표 ID
- `search` (optional): 프로젝트 코드, 이름 검색
- `page`, `limit`: 페이지네이션

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "projectCode": "P24-039",
      "name": "KOEN 스마트 도면관리시스템 구축 용역",
      "clientName": "한국남동발전",
      "status": "profitability_approved",
      "currentPhase": "in_progress",
      "managerId": 1,
      "managerName": "홍길동",
      "salesRepresentativeId": 2,
      "salesRepresentativeName": "김철수",
      "plannedStartDate": "2024-01-01",
      "plannedEndDate": "2024-12-31",
      "teamMemberCount": 5
    }
  ],
  "pagination": { ... }
}
```

#### **GET /api/projects/:id**
프로젝트 상세 정보 조회

**Response:**
```json
{
  "id": 1,
  "projectCode": "P24-039",
  "name": "KOEN 스마트 도면관리시스템 구축 용역",
  "clientName": "한국남동발전",
  "description": "...",
  "status": "profitability_approved",
  "currentPhase": "in_progress",
  "managerId": 1,
  "manager": {
    "id": 1,
    "name": "홍길동",
    "email": "hong@weworks.com"
  },
  "salesRepresentative": {
    "id": 2,
    "name": "김철수",
    "email": "kim@weworks.com"
  },
  "plannedStartDate": "2024-01-01",
  "plannedEndDate": "2024-12-31",
  "actualStartDate": "2024-01-05",
  "actualEndDate": null,
  "teamMembers": [
    {
      "userId": 3,
      "userName": "이영희",
      "role": "Developer",
      "allocationPercentage": 100
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### **POST /api/projects**
새 프로젝트 생성

**Request Body:**
```json
{
  "projectCode": "P25-020",
  "name": "프로젝트명",
  "clientName": "클라이언트명",
  "description": "설명",
  "managerId": 1,
  "salesRepresentativeId": 2,
  "plannedStartDate": "2025-01-01",
  "plannedEndDate": "2025-12-31"
}
```

**Response:**
```json
{
  "id": 3,
  "projectCode": "P25-020",
  "status": "draft",
  "currentPhase": "md_estimation",
  ...
}
```

#### **PATCH /api/projects/:id**
프로젝트 정보 수정

#### **PATCH /api/projects/:id/status**
프로젝트 상태 변경

**Request Body:**
```json
{
  "status": "md_estimated",
  "comments": "MD 산정 완료"
}
```

---

### 2.3 MD 산정 관련 API

#### **GET /api/projects/:id/md-estimation**
프로젝트 MD 산정 조회

**Response:**
```json
{
  "projectId": 1,
  "version": 1,
  "status": "completed",
  "items": [
    {
      "id": 1,
      "role": "PM",
      "personnelCount": 1,
      "mdPerPerson": 1,
      "totalMd": 1,
      "category": "PM"
    }
  ],
  "totalMd": 22,
  "createdAt": "2024-01-15T00:00:00Z"
}
```

#### **POST /api/projects/:id/md-estimation**
MD 산정 생성/수정

**Request Body:**
```json
{
  "version": 1,
  "items": [
    {
      "role": "PM",
      "personnelCount": 1,
      "mdPerPerson": 1,
      "category": "PM"
    }
  ]
}
```

#### **POST /api/projects/:id/md-estimation/complete**
MD 산정 완료 처리 (상태 변경)

---

### 2.4 VRB 검토 관련 API

#### **GET /api/projects/:id/vrb-reviews**
VRB 검토 이력 조회

#### **POST /api/projects/:id/vrb-reviews**
VRB 검토 요청

**Request Body:**
```json
{
  "mdEstimationVersion": 1,
  "comments": "검토 요청합니다"
}
```

#### **POST /api/projects/:id/vrb-reviews/:reviewId/approve**
VRB 승인

#### **POST /api/projects/:id/vrb-reviews/:reviewId/reject**
VRB 반려

**Request Body:**
```json
{
  "comments": "반려 사유"
}
```

---

### 2.5 수지분석서 관련 API

#### **GET /api/projects/:id/profitability**
수지분석서 조회

**Response:**
```json
{
  "id": 1,
  "projectId": 1,
  "version": 1,
  "status": "completed",
  "softwareRevenue": 50000000,
  "hardwareRevenue": 20000000,
  "totalRevenue": 70000000,
  "laborCost": 45000000,
  "otherCost": 5000000,
  "totalCost": 50000000,
  "netProfit": 20000000,
  "profitRate": 28.57,
  "laborCostSummary": [
    {
      "month": "2024-01",
      "totalHours": 160,
      "totalCost": 8000000
    }
  ],
  "revenueForecast": [
    {
      "month": "2024-01",
      "revenueAmount": 10000000,
      "costAmount": 8000000,
      "profitAmount": 2000000,
      "profitRate": 20.0
    }
  ]
}
```

#### **POST /api/projects/:id/profitability**
수지분석서 생성/수정

**Request Body:**
```json
{
  "version": 1,
  "softwareRevenue": 50000000,
  "hardwareRevenue": 20000000,
  "otherCost": 5000000,
  "laborCost": 45000000
}
```

#### **POST /api/projects/:id/profitability/complete**
수지분석서 작성 완료

#### **POST /api/projects/:id/profitability/reviews**
수지분석서 승인 요청

#### **POST /api/projects/:id/profitability/reviews/:reviewId/approve**
수지분석서 승인

#### **POST /api/projects/:id/profitability/reviews/:reviewId/reject**
수지분석서 반려

---

### 2.6 정산서 관련 API

#### **GET /api/projects/:id/settlement**
정산서 조회

#### **POST /api/projects/:id/settlement**
정산서 생성/수정

#### **POST /api/projects/:id/settlement/complete**
정산서 작성 완료

#### **POST /api/projects/:id/settlement/reviews/:reviewId/approve**
정산서 승인

#### **POST /api/projects/:id/settlement/reviews/:reviewId/reject**
정산서 반려

---

### 2.7 인력 배치 관련 API

#### **GET /api/projects/:id/team**
프로젝트 팀원 목록

#### **POST /api/projects/:id/team/members**
팀원 추가

**Request Body:**
```json
{
  "userId": 3,
  "role": "Developer",
  "allocationPercentage": 100,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

#### **GET /api/projects/:id/labor-allocation**
인력 배치 상세 (월별)

**Query Parameters:**
- `month` (optional): YYYY-MM 형식

#### **POST /api/projects/:id/labor-allocation**
인력 배치 추가/수정

---

### 2.8 단가표 관련 API

#### **GET /api/labor-rates**
인건비 단가표 조회

**Query Parameters:**
- `role` (optional): 역할 필터
- `rate_type` (optional): 단가 유형 (standard/current/year_ago)
- `effective_date` (optional): 적용 일자 기준

#### **GET /api/md-rates**
MD 단가표 조회

---

### 2.9 조직/부서 관련 API

#### **GET /api/departments**
부서 목록 조회

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "IT기획팀",
      "parentDepartmentId": null,
      "parentDepartmentName": null,
      "managerId": 1,
      "managerName": "홍길동",
      "children": [
        {
          "id": 2,
          "name": "개발팀",
          "parentDepartmentId": 1
        }
      ]
    }
  ]
}
```

---

## 3. 현재 구현 상태

### 3.1 하드코딩된 데이터 (임시)
현재 다음 화면들은 임시 데이터를 사용 중:
- ✅ 프로젝트 목록 (`app/(main)/projects/page.tsx`)
- ✅ 프로젝트 상세 (`app/(main)/projects/[id]/page.tsx`)
- ✅ 프로젝트 생성 (`app/(main)/projects/new/page.tsx`)
- ✅ MD 산정 (`app/(main)/projects/[id]/md-estimation/page.tsx`)
- ✅ VRB 검토 (`app/(main)/projects/[id]/vrb-review/page.tsx`)
- ✅ 수지분석서 (`app/(main)/projects/[id]/profitability/page.tsx`)
- ✅ 사용자 관리 (`app/(main)/settings/users/page.tsx`)
- ✅ 역할 관리 (`app/(main)/settings/roles/page.tsx`)

### 3.2 API로 교체해야 할 영역
1. **사용자 데이터**
   - PM, 영업대표 선택 드롭다운
   - 사용자 목록 (사용자 관리)
   - 현재 로그인한 사용자 정보

2. **프로젝트 데이터**
   - 프로젝트 목록
   - 프로젝트 상세 정보
   - 프로젝트 상태 변경

3. **MD 산정 데이터**
   - MD 산정 입력/조회
   - 단가표 조회

4. **수지분석서 데이터**
   - 수익성 데이터 입력/조회
   - 인건비 자동 계산

5. **조직/부서 데이터**
   - 부서 목록
   - 조직도

---

## 4. API 통신 구조

### 4.1 API 클라이언트 구조 (제안)

```typescript
// lib/api/projects.ts
export async function getProjects(params?: {
  status?: string;
  search?: string;
  page?: number;
}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`/api/projects?${queryString}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getProject(id: string) {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function createProject(data: CreateProjectInput) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function updateProjectStatus(
  id: string,
  status: string,
  comments?: string
) {
  const res = await fetch(`/api/projects/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comments }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}
```

### 4.2 React Query / SWR 사용 (제안)

데이터 페칭 및 캐싱을 위해 React Query 또는 SWR 사용 권장:

```typescript
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '@/lib/api/projects';

export function useProjects(params?: { status?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => getProjects(params),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

---

## 5. 데이터베이스 연동 계획

### Phase 1: 기본 인프라
1. ORM 설정 (Prisma 또는 Drizzle)
2. 데이터베이스 연결
3. 마이그레이션 스크립트 생성

### Phase 2: 기본 API 구현
1. 사용자 API
2. 프로젝트 CRUD API
3. 인증/인가 API

### Phase 3: 워크플로우 API
1. MD 산정 API
2. VRB 검토 API
3. 상태 변경 API

### Phase 4: 수지분석서/정산서 API
1. 수지분석서 API
2. 정산서 API
3. 계산 로직 API

### Phase 5: 프론트엔드 연동
1. React Query / SWR 설정
2. API 클라이언트 구현
3. 기존 하드코딩 데이터를 API 호출로 교체

---

## 6. 다음 단계

1. **ORM 선택 및 설정**
   - Prisma vs Drizzle ORM
   - 데이터베이스 연결 설정

2. **API Routes 구현**
   - Next.js API Routes 또는 별도 백엔드
   - 기본 CRUD API 구현

3. **인증 시스템 구현**
   - JWT 또는 Session
   - 권한 체크 미들웨어

4. **프론트엔드 연동**
   - API 클라이언트 생성
   - React Query / SWR 설정
   - 기존 화면 API 연동

---

## 참고

- 모든 API는 인증이 필요합니다 (JWT 토큰 또는 세션)
- 권한에 따라 접근 가능한 API가 달라집니다
- 에러 처리는 일관된 형식으로 반환됩니다
- 페이지네이션은 표준 형식을 따릅니다
