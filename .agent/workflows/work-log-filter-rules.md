---
description: 개인별 작업일지 팝업의 업무유형별 프로젝트 필터링 규칙
---

한글로 대화하세요.

# 개인별 작업일지 - 업무유형별 프로젝트 필터링 규칙

**파일 위치:** `app/(main)/resources/work-logs/components/work-log-panel.tsx`

## 1. 업무유형 코드 상수 (CD_002_05 하위)

| 상수명 | 코드 | 업무유형명 |
|--------|------|------------|
| `GENERAL_CODE` | `CD_002_05_01` | 프로젝트 |
| `PRESALES_CODE` | `CD_002_05_02` | 프리세일즈 |
| `MAINTENANCE_FREE_CODE` | `CD_002_05_03` | 무상 유지보수 |
| `MAINTENANCE_PAID_CODE` | `CD_002_05_04` | 유상 유지보수 |
| `RESEARCH_CODE` | `CD_002_05_06` | 연구과제 |
| (하위코드) | `CD_002_05_07` | R&D 지원 |
| (하위코드) | `CD_002_05_05` | 일반 업무 |

## 2. 업무유형별 오른쪽 영역 동작

팝업은 `grid-cols-4` 레이아웃으로, **업무유형(1/4) + 오른쪽 영역(3/4)** 구조입니다.

| 업무유형 | 오른쪽 영역 표시 | 프로젝트 필터 조건 |
|----------|-----------------|-------------------|
| **프로젝트** (`GENERAL_CODE`) | [프로젝트 유형 1/3] + [프로젝트 검색 2/3] | `project_type_id`로 필터링 (계약/내부 프로젝트) |
| **프리세일즈** (`PRESALES_CODE`) | [프로젝트 검색] | `project_code`가 **없는** 프로젝트 |
| **무상 유지보수** (`MAINTENANCE_FREE_CODE`) | [프로젝트 검색] | `maintenance_free_code`가 **있는** 프로젝트 → `[무상코드] 이름` 표시 |
| **유상 유지보수** (`MAINTENANCE_PAID_CODE`) | [프로젝트 검색] | `maintenance_paid_code`가 **있는** 프로젝트 → `[유상코드] 이름` 표시 |
| **연구과제** (`RESEARCH_CODE`) | [프로젝트 검색] | `research_code`가 **있는** 프로젝트 → `[연구코드] 이름` 표시 |
| **R&D 지원** (`CD_002_05_07`) | [하위 업무 선택] | `CD_002_05_07` 하위 코드 목록 |
| **일반 업무** (`CD_002_05_05`) | [하위 업무 선택] | `CD_002_05_05` 하위 코드 목록 |

### 프로젝트 유형 필터 (GENERAL_CODE 전용)
- `CD_002_05_01` 하위 코드 (계약 프로젝트, 내부 프로젝트)
- `project_type_id`로 `we_projects` 테이블에서 필터링
- 디폴트: **첫 번째 유형 (계약 프로젝트)**
- 유형 변경 시 프로젝트 선택 초기화

## 3. we_projects 테이블 관련 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `project_code` | VARCHAR | 프로젝트 코드 (계약/내부 프로젝트) |
| `maintenance_free_code` | VARCHAR(50) | 무상 유지보수 코드 |
| `maintenance_paid_code` | VARCHAR(50) | 유상 유지보수 코드 |
| `research_code` | VARCHAR(50) | 연구과제 코드 |
| `project_type_id` | BIGINT | FK → we_codes.id (CD_002_05_01 하위) |

## 4. 프로젝트 등록/수정 팝업 (ProjectModal) 코드 입력 필드

**1행 (4등분):**
- 프로젝트 코드 | 무상 유지보수 코드 | 유상 유지보수 코드 | 연구과제 코드

**2행:**
- 프로젝트 유형 (col-span-1) | 프로젝트명 (col-span-3)

## 5. 팝업 레이아웃 (work-log-panel)

- 팝업 너비: `780px`
- 날짜/시간: `grid-cols-4` — 날짜(1/4) + 시간(3/4)
- 업무유형/프로젝트: `grid-cols-4` — 업무유형(1/4) + 오른쪽(3/4)
- 하위업무 선택 시 오른쪽(3/4)에 `SearchableCombobox`
- 프로젝트(GENERAL_CODE) 선택 시 오른쪽(3/4)을 `grid-cols-3`으로 분할
