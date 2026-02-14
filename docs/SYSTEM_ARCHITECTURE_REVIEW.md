# 시스템 아키텍처 검토 및 개선안

## 현재 구조 분석

### 1. 데이터베이스 구조

#### 프로젝트 (we_projects)
- **기준 키**: `id` (프로젝트 ID)
- **상태 관리**: `status`, `current_phase`
- **워크플로우**: sales → md_estimation → vrb → team_allocation → profitability → in_progress → settlement → warranty

#### M/D 산정 (we_project_md_estimations)
- **외래키**: `project_id` → `we_projects(id)`
- **버전 관리**: `version` (프로젝트별 UNIQUE 제약)
- **상태**: `draft`, `completed`, `approved`
- **문제점**: 
  - `UNIQUE(project_id, version)` 제약으로 인해 같은 프로젝트에서 같은 버전을 가진 draft가 여러 개 있을 수 없음
  - 버전 관리 로직이 복잡함

#### VRB Review (we_project_vrb_reviews)
- **외래키**: `project_id` → `we_projects(id)`
- **버전 관리**: `version` (프로젝트별 UNIQUE 제약)
- **상태**: `draft`, `submitted`, `approved`, `rejected`
- **연계**: `md_estimation_id` → `we_project_md_estimations(id)`

### 2. 현재 문제점

#### 문제 1: 버전 관리 복잡성
- **현상**: 저장할 때마다 버전이 증가하거나 중복 키 에러 발생
- **원인**: 
  - draft 상태의 산정이 여러 개 생성될 수 있음
  - 완료 전까지는 같은 버전을 유지해야 하는데, 로직이 일관되지 않음

#### 문제 2: 프로젝트 ID 기준 데이터 관리 불일치
- **현상**: 프로젝트별 데이터가 제대로 필터링되지 않음
- **원인**:
  - API에서 프로젝트 ID 검증이 일관되지 않음
  - 프론트엔드에서 프로젝트 ID 필터링이 누락되는 경우가 있음

#### 문제 3: 데이터 저장/로드 로직 복잡성
- **현상**: 저장 후 다시 로드할 때 데이터가 사라지거나 다른 프로젝트 데이터가 표시됨
- **원인**:
  - 저장 시 프로젝트 ID 검증 부족
  - 로드 시 프로젝트 ID 필터링 누락

## 개선 방향

### 원칙
1. **프로젝트 ID가 기준 키**: 모든 단계별 데이터는 프로젝트 ID로 관리
2. **Draft는 1개만**: 각 프로젝트당 각 단계별로 draft 상태의 데이터는 1개만 존재
3. **완료 시에만 버전 증가**: 저장은 기존 draft를 업데이트, 완료 시에만 새 버전 생성
4. **프로젝트 ID 검증 강화**: 모든 API에서 프로젝트 ID 검증 필수

### 개선 사항

#### 1. 버전 관리 로직 단순화

**현재 로직**:
- 저장 시마다 버전 체크 및 증가 시도
- draft가 여러 개 생성될 수 있음

**개선 로직**:
```
저장 시:
  1. 프로젝트 ID로 draft 상태의 데이터 조회
  2. 있으면 → 기존 데이터 업데이트 (버전 유지)
  3. 없으면 → 새 draft 생성 (완료된 최대 버전 + 1)

완료 시:
  1. 현재 draft를 'completed'로 변경
  2. 프로젝트 상태 업데이트
  3. 다음 단계로 진행 가능
```

#### 2. API 프로젝트 ID 검증 강화

**모든 API 엔드포인트에서**:
- GET: `projectId` 쿼리 파라미터 필수 또는 URL에서 추출
- POST: `project_id` body 필수, 프로젝트 존재 여부 확인
- PUT: `project_id` body 필수, 기존 데이터의 `project_id`와 일치 확인
- DELETE: 프로젝트 ID 검증 후 삭제

#### 3. 프론트엔드 데이터 필터링 보장

**모든 데이터 로드 시**:
- URL에서 프로젝트 ID 추출
- API 호출 시 프로젝트 ID 포함
- 응답 데이터를 프로젝트 ID로 한 번 더 필터링 (안전장치)

## 구현 계획

### Phase 1: M/D 산정 개선
- [x] API에서 기존 draft 확인 및 반환 로직 추가
- [x] 프론트엔드에서 draft 재사용 로직 개선
- [ ] 버전 관리 로직 완전히 단순화
- [ ] 프로젝트 ID 검증 강화

### Phase 2: VRB Review 개선
- [ ] M/D 산정과 동일한 패턴으로 draft 관리
- [ ] 프로젝트 ID 검증 강화

### Phase 3: 수지분석서 개선
- [ ] 동일한 패턴 적용
- [ ] 프로젝트 ID 검증 강화

### Phase 4: 통합 테스트
- [ ] 프로젝트별 데이터 격리 확인
- [ ] 버전 관리 정확성 확인
- [ ] 저장/로드 정확성 확인
