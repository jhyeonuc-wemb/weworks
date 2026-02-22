---
description: 위엠비 시스템 UI 표준 가이드 (Neo-Modern Light 스타일)
---

# UI 표준 가이드 (Neo-Modern Light)

이 워크플로우는 `weworks` 시스템의 일관된 디자인 시스템을 유지하기 위한 가이드입니다. AI와 개발자는 컴포넌트를 생성하거나 수정할 때 이 가이드를 준수합니다.

## 디자인 및 타이포그래피 (Typography)
- **기본 폰트 (Sans-serif):** `Pretendard`를 시스템 전체 기본 폰트로 사용합니다.
  - 가독성을 최우선으로 하며, 본문은 `font-medium`, 강조는 `font-bold` 또는 `font-black`을 사용합니다.
- **기본 폰트 사이즈:** 시스템 기본 본문 사이즈는 `text-sm` (14px)을 원칙으로 합니다.
  - 특별한 지시가 없는 한 임의로 폰트 크기를 키우거나(`text-lg`, `text-xl` 등) 줄이지(`text-[10px]` 등) 않습니다.
  - 제목이나 헤더 등 위계가 필요한 경우에만 제한적으로 상위 사이즈를 사용합니다.
- **스타일 제한:** 특정하게 지시하지 않는 한, 강조를 목적으로 임의의 **이탤릭체(italic)**를 사용하지 않습니다.
- **데이터 폰트 (Monospace):** 프로젝트 코드, 숫자, 금액, ID 등 데이터 성격이 강한 텍스트에는 `font-mono`를 적용하여 등폭으로 시각적 정렬감을 줍니다.
- **글로벌 스타일:** `globals.css`에 정의된 폰트 스택을 따르며, 인라인 스타일링 시에도 이 원칙을 유지합니다.

## 기본 원칙
1. **Neo-Modern Light:** 밝고 공기가 잘 통하는(Airy) 느낌을 지향합니다.
2. **Backdrop Blur:** 모달, 카드, 헤더에 `backdrop-blur`를 적극 활용하여 깊이감을 줍니다.
3. **Rounded Corners:** 기본적으로 `rounded-xl` 이상을 사용하며, 버튼과 입력창에는 `rounded-2xl`을 권장합니다.
4. **Exception (예외):** 상세 데이터 그리드(엑셀 스타일) 사용 시 라운드를 제거하고 직각(sharp) 모서리를 사용하여 전문적인 느낌을 줍니다.

## 주요 디자인 토큰
- **Primary Color:** `oklch(0.55 0.15 250)` (Tech Blue)
- **Background:** `oklch(0.99 0.005 240)` (Ice White)
- **Card Background:** `bg-white/80 backdrop-blur-md`
- **Border:** `oklch(0.94 0.01 240)` (Soft Gray)

## 컴포넌트별 권장 스타일

### 1. 버튼 (Button)
- `@/components/ui/Button.tsx` 사용
- **신규 생성/저장:** `variant="primary"` (주로 검정색/어두운 회색 계열)
- **취소/목록:** `variant="secondary"` (밝은 회색 계열)
- **삭제 (Delete):** `variant="danger"` (빨간색 계열 - 저장 버튼과 동일한 레이아웃 형태)
- 버튼 둥글기: `rounded-xl` (글로벌 테마 적용됨)

### 2. 카드 (Card)
- 공통 클래스: `neo-light-card` (globals.css 참조)
- 예: `<div className="neo-light-card border border-border/40 overflow-hidden">`

### 3. 테이블 표준 (Table Standard)
시스템 내 데이터 테이블은 두 가지 유형(목록형, 상세/입력형)으로 구분하여 정형화합니다.

#### 3.1 목록형 테이블 (List Tables)
기준: **프로젝트 현황 테이블**
- **컨테이너:** `neo-light-card` 내부에 위치, `overflow-hidden border border-border/40`.
- **헤더:** `bg-muted/30`, `px-8 py-3 text-sm font-bold`.
- **행 스타일:** `h-[52px]` 기준 (내부 패딩 `px-8 py-3`).
- **데이터 행 폰트:**
    - **기본 텍스트:** `text-sm text-foreground/80` (일반 정보).
    - **강조 항목(예: 프로젝트명):** `text-sm font-bold text-foreground tracking-tight`.
    - **데이터 성격(코드, 수치, 날짜):** `font-mono` 적용.
    - **상태/배지:** `text-xs font-bold`.
- **인터랙션:** `hover:bg-primary/[0.02] cursor-pointer`.
- **푸터:** 페이지네이션 포함, `min-h-[56px]`.

#### 3.2 상세/입력형 테이블 (Detail/Input Tables)
기준: **수지분석서 프로젝트 경비 탭, M/D 산정 난이도 탭**
- **구조 및 레이아웃:**
  - **테두리(Border):** `border-collapse`를 사용하며, 테이블 요소(`table`) 자체에는 테두리를 적용하지 않습니다. (컨테이너 div에도 테두리 없음)
  - **셀 테두리:** 모든 셀(`th`, `td`)에 `border border-gray-300`을 적용하여 **1px 두께**의 실선 그리드를 구현합니다. (Tailwind 기본 `border` 클래스 사용)
  - **둥글기(Radius):** 컨테이너와 내부 요소 모두 **`rounded-none`** (직각)을 사용하여 엑셀과 같은 전문적인 느낌을 줍니다.
  - **그림자(Shadow):** **`shadow-none`** (그림자 없음)을 원칙으로 합니다.
  - **인터랙션(Interaction):**
    - **행 호버 효과 제거:** 데이터 입력의 집중도를 위해 행 전체 호버 효과는 제거합니다.
  - 셀 호버 효과:** 데이터 입력이 가능한 셀(Input/Select)에는 `hover:bg-blue-50/50`을 적용하여 상호작용 가능함을 표시합니다.
- **헤더 및 세션 구분:**
  - 헤더 배경: `bg-blue-50/50` (또는 `bg-slate-50/50`).
  - **행 및 셀 높이:** `tr`뿐만 아니라 **입력 필드가 포함된 `td`에도 `h-[35px]`를 명시**하여, 내부 `h-full` 요소가 정확한 높이를 가지도록 합니다.
  - **셀 패딩:** 
    - 일반 텍스트 셀: `px-[10px] py-1`.
    - **입력 셀 (Input/Select):** **`p-0`를 필수 적용**하여 입력 필드가 셀 전체를 채우도록 합니다. (내부 `input`에는 `px-[10px]` 적용)
- **폰트 및 텍스트:**
  - 기본 텍스트: `text-sm` (Pretendard).
  - 수치/금액: `text-sm text-right` (천 단위 콤마 필수).
- **선택 열 (Selection Column):**
  - **헤더:** `w-12`, `text-center`, `text-sm font-bold`.
  - **데이터 셀:** `p-0`, `text-center`.
  - **UI:** 라디오 버튼 형태의 직관적인 선택 UI 사용 (`rounded-full`, 선택 시 색상 변경).
- **작업/삭제 열 (Action Column):**
  - **헤더:** 타이틀 **"작업"** 사용, `w-12`, `text-center`.
  - **데이터 셀:** `p-0`, `text-center` (아이콘 버튼 배치).
  - **입력 컴포넌트 (Interactive Elements):**
    > ※ 주의: 이 섹션의 스타일은 **테이블 내부**에만 적용됩니다. 일반적인 폼 입력은 **[8. 폼 입력 컴포넌트 표준]**을 따르십시오.
  - **Dropdown:** 
    - 높이: `h-[35px]`, 패딩: `p-0` (셀 내부 꽉 채움).
    - 스타일: `border-none`, `bg-transparent`, `rounded-none`.
    - 목록 팝업: `listClassName="rounded-none border-gray-300 shadow-md"`를 적용하여 직각 스타일 및 일관된 테두리 유지.
  - **Input/Select:** 
    - 기본: `border-none`, `bg-transparent`, `h-full`, `w-full`, `rounded-none`, `p-0`.
    - 패딩 및 폰트: `px-[10px]`, `text-sm` (기본 사이즈 유지).
    - 포커스: `focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50/50`.
  - **행 추가 버튼 (Add Row):**
    - 위치: `tbody`의 최하단에 별도 `tr`로 구성.
    - 스타일: `w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors`.
    - 테두리: `border-none` (셀 내부 `p-0` 및 통합).

### 4. 상태 배지 (Badge)
- `@/components/ui/Badge.tsx` 사용
- `STANDBY`: `variant="info"` (대기)
- `IN_PROGRESS`: `variant="warning"` (작성 중)
- `COMPLETED`: `variant="success"` (완료)

### 4.1 상태 배지 (StatusBadge)
- `@/components/ui/StatusBadge.tsx` 사용
- 상세 페이지(MD, VRB, 수지분석, 정산)의 헤더 및 리스트에서 현재 프로젝트의 진행 상태를 시각화할 때 사용합니다.
- **주요 특징:**
  - 드롭다운 형식이 아닌 **단순 표시용 아이콘 배지** 형태입니다. (상태 변경은 비즈니스 로직에 의해 자동으로 처리되거나 특정 액션 버튼으로 유도)
  - 상태별 아이콘(Clock, Check, Circle 등)과 배경색을 통해 직관적인 인지를 돕습니다.
  - `STANDBY` (대기), `IN_PROGRESS` (작성중), `COMPLETED` (작성완료), `APPROVED` (승인), `REJECTED` (반려) 지원

### 4.2 상세 페이지 헤더 액션 표준 (Header Actions)
모든 상세 페이지(MD 산정, VRB, 수지분석, 정산)의 헤더 우측 액션 버튼 구성은 다음 순서와 규칙을 따릅니다.

1.  **배치 순서 (우측 → 좌측):**
    - `StatusBadge` (상태 표시)
    - `Write Complete` (작성완료 - 텍스트+아이콘 버튼)
    - `Excel Download` (엑셀 다운로드 - 아이콘 버튼)
    - `Version Select` (버전 선택 - 수지분석서 전용)

2.  **컴포넌트별 스타일:**
    - **StatusBadge:** 상태에 따른 아이콘과 라벨 자동 표시.
    - **Write Complete Button (작성완료):**
      - 아이콘: `CheckCircle2` (또는 `Save`)
      - 스타일: `variant="primary"` (검정색/진한 회색 계열)
      - 텍스트: "작성완료"
      - **기능:** 현재 내용을 저장하고 상태를 `COMPLETED`로 변경 (필요 시 유효성 검사 수행).
    - **Excel Download:** 
      - 아이콘: `Download`
      - 스타일: `bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm` (진한 녹색 배경, 흰색 텍스트)
      - 텍스트: "엑셀" (한글)
    - **Create/Save Button (저장/신규):**
      - **위치:** 헤더가 아닌 **각 탭(Tab) 또는 콘텐츠 영역 내부** 우측 상단에 배치합니다.
      - **스타일:** `inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`
      - 헤더는 "완료" 및 "상태 관리"에 집중하고, 수시 저장은 콘텐츠 영역에서 수행합니다.
    - **Delete Button (삭제):**
      - **위치:** 저장 버튼 좌측 또는 콘텐츠 영역 내 적절한 위치에 배치합니다.
      - **노출 로직:** 현재 단계의 상태가 **`IN_PROGRESS` (작성 중)**일 때만 노출됩니다.
      - **스타일:** `inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 h-10 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors` (저장 버튼과 높이, 둥글기가 동일한 형태)
      - **아이콘:** `Trash2` (lucide-react)
    - **Data Refresh Button (데이터 갱신):**
      - **아이콘:** `RefreshCw`
      - **텍스트:** "데이터 갱신"
      - **스타일:** `inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 h-10 text-sm font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors`
      - 외부 데이터(인력 계획, 기준 정보 등)를 가져와 현재 페이지의 연산 데이터를 동기화할 때 사용합니다.

3.  **상태 전환 로직:**
    - **초기 상태:** `STANDBY`
    - **저장(콘텐츠 영역) 클릭 시:** 데이터 저장 + `IN_PROGRESS` 전환.
    - **작성완료(헤더) 클릭 시:** 데이터 저장 + `COMPLETED` 전환 (수정 불가 상태).
    - **상태 드롭다운:** 관리자나 승인권자가 수동으로 변경 가능.

### 5. 날짜 및 기간 선택 (DatePicker / MonthPicker)
- **중요:** 브라우저 기본 `<input type="date">` 대신 공통 컴포넌트를 사용합니다.
- **DatePicker:** 일반 날짜 선택 시 사용. (`@/components/ui/DatePicker.tsx`)
  - 예: `<DatePicker date={startDate} setDate={setStartDate} label="계약시작일" />`
- **MonthPicker:** 연/월 선택 시 사용 (주로 인력 계획, 경비 계획 등). (`@/components/ui/MonthPicker.tsx`)
- **데이터 핸들링:**
  - UI에서는 `Date` 객체 또는 `yyyy-MM` 문자열을 사용하되, API 전송 시에는 서버 규격(예: `yyyy-MM-01`)에 맞춰 변환합니다.

### 6. 팝업 및 모달 (Modal / DraggablePanel)
- 기본적으로 `@/components/ui/DraggablePanel.tsx`를 사용하여 드래그 가능한 팝업을 구현합니다.
- **레이아웃:**
  - 폼 데이터는 `grid grid-cols-4 gap-x-6 gap-y-4` 레이아웃을 기본으로 사용합니다.
  - 섹션 간 간격은 `space-y-6`을 적용합니다.
- **푸터 구성:**
  - 우측 하단에 `취소`(variant="ghost")와 `저장/동작`(variant="primary") 버튼을 배치합니다.
  - 저장 버튼에는 관련 아이콘(예: `lucide-react`의 `Save`)을 포함하고 `min-w-[120px]`를 권장합니다.

### 7. 숫자 및 통화 포맷팅 (Number Formatting)
- **천 단위 콤마:** 모든 금액과 수치는 사용자가 보기 편하도록 천 단위 콤마(`,`)를 표시합니다.
  - 출력 시: `{value.toLocaleString()}` 사용.
  - 입력 시: 사용자가 입력할 때 실시간으로 콤마가 붙도록 처리하거나, `blur` 시점에 포맷팅합니다.
  - 예 (ProjectModal 방식): `value={formData.amount ? Number(formData.amount).toLocaleString() : ""}`
- **정렬:** 테이블이나 리스트에서 숫자는 가독성을 위해 **우측 정렬(`text-right`)**을 원칙으로 합니다.

### 8. 폼 입력 컴포넌트 표준 (Form Inputs)
시스템 전체의 입력 필드는 시각적 통일성을 위해 **높이값과 스타일을 규격화**합니다. 기준은 `ProjectModal`의 계약 시작일 섹션을 따릅니다.

- **공통 규격:**
  - **높이 (Height):** 모든 입력 필드(Input, Dropdown, DatePicker)는 **`h-10` (40px)**을 기본 높이로 사용합니다.
  - **둥글기 (Border Radius):** **`rounded-xl`**을 기본으로 사용합니다. (Button은 `rounded-2xl` 권장)
  - **테두리 (Border):** `border-gray-300`을 기본으로 하며, 포커스 시 `border-gray-900`으로 변경합니다.
  - **포커스 효과:** `focus:ring-2 focus:ring-gray-900 focus:ring-offset-0`를 적용하여 명확한 인터랙션을 제공합니다.

- **컴포넌트별 적용 스타일:**
  - **Input:** `<input className="h-10 rounded-xl border-gray-300 text-sm ..." />`
  - **Dropdown:** `@/components/ui/Dropdown.tsx` 사용 시 `variant="premium"`을 기본으로 하며, 높이는 `h-10`으로 고정합니다.
    - **Portal Rendering:** 드롭다운 메뉴는 `React Portal`을 사용하여 `document.body`에 렌더링되므로, 테이블이나 모달 내부의 `overflow: hidden`에 영향을 받지 않습니다.
    - **Smart Positioning:** 화면 공간에 따라 자동으로 위/아래 방향이 결정됩니다.
  - **DatePicker:** `@/components/ui/DatePicker.tsx`를 사용하며, 내부 버튼의 높이와 스타일이 위 공통 규격을 따르도록 보장합니다.

- **제약 사항:**
  - 레이아웃 구성 상 특별한 사유가 없는 한, 특정 컴포넌트의 높이를 임의로 조정(`h-8`, `h-12` 등)하지 않습니다.
  - 모든 입력 요소의 폰트 사이즈는 **`text-sm`**으로 통일합니다.

### 9. 검색 및 필터 (Search & Filters)
목록 상단의 검색바와 필터 요소는 다음 규격을 따릅니다. 기준은 `프로젝트 현황` 페이지를 따릅니다.

- **공통 규격:**
  - **높이 (Height):** 모든 검색 및 필터 요소는 **`h-10` (40px)**으로 통일합니다.
  - **둥글기 (Border Radius):** **`rounded-xl`**을 사용합니다.
- **구성 요소별 스타일:**
  - **SearchInput:** 왼쪽에 `Search` 아이콘을 배치하고, 배경은 `bg-white`, 테두리는 `border-gray-300`을 사용합니다.
  - **Dropdown (필터):** `variant="premium"`을 사용하여 `h-10`, `rounded-xl` 스타일을 유지합니다.
- **레이아웃:**
  - 요소 간 간격은 `gap-x-4`를 기본으로 사용합니다.
  - 검색바가 가변 너비를 가질 경우 `flex-1`을 적용합니다.

### 10. 안내 및 참고 박스 (Information/Alert Boxes)
설명이나 주의사항을 전달하는 안내 박스는 다음 규격을 따릅니다.

- **기본 스타일:**
  - 배경색: `bg-blue-50`
  - 테두리: `border border-blue-100`
  - 둥글기: `rounded-xl`
  - 패딩: `p-4`
- **텍스트 스타일:**
  - 폰트: `text-sm text-blue-800`
  - 강조: 핵심 키워드나 라벨은 `font-bold`를 사용합니다. (예: `※ 참고:`)
- **사용 예시:**
  ```tsx
  <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
    <p className="text-sm text-blue-800 flex items-center gap-2">
      <span className="font-bold">※ 참고:</span>
      안내 문구 내용을 입력합니다.
    </p>
  </div>
  ```
  

### 11. 깊이감 및 애니메이션 (Elevation & Animation)
전체적인 사용자 경험의 핵심인 깊이감과 움직임에 대한 표준입니다.

- **그림자(Shadow) 전략:**
  - **정적 상태 (Static):** Input, Dropdown, 보조 버튼(`secondary`)은 **Flat**(그림자 없음)을 기본으로 합니다. 깨끗한 레이아웃을 위해 Border(`border-gray-300`)만을 사용합니다.
  - **인터랙션 (Focus/Hover):** 마우스 호버 또는 입력 Focus 시 **`shadow-md`**를 적용하여 요소가 "떠오르는" 느낌을 줍니다.
  - **주요 버튼 (Primary):** `bg-primary`를 사용하는 주요 버튼은 기본적으로 아주 미세한 **`shadow-sm`**을 가져가 시각적 깊이를 부여합니다.
  - **부유 요소 (Floating):** 드롭다운 목록(`list`), 모달(`modal`), 도구 설명(`tooltip`)은 **`shadow-xl`** 또는 **`shadow-2xl`**을 사용하여 배경과 완전히 분리합니다.

- **애니메이션 및 피드백:**
  - **클릭 피드백 (Active):** 모든 버튼과 클릭 가능한 행(Table Row 등)은 클릭 시 **`active:scale-[0.97]`**을 적용하여 눌리는 피드백을 전달합니다. (기존 95는 과할 수 있으므로 97-98 권장)
  - **전환 속도 (Transition):** 모든 상태 변화는 **`transition-all duration-200`**을 기본으로 사용하여 부드럽게 연결합니다.


### 13. 알림 및 확인창 (Alert & Confirm Dialog)
시스템 내에서 브라우저 기본 `alert()` 및 `confirm()` 사용을 금지하며, 통일된 `AlertDialog` 컴포넌트를 사용합니다.

- **기본 형태 (Common Standards):**
  - **애니메이션:** 중앙에서 부드럽게 나타나는 `scale-in` 효과와 함께 배경에 `backdrop-blur-sm`을 적용합니다.
  - **아이콘:** 상황에 맞는 아이콘(Info, Success, Warning, Error, Question)을 상단 중앙에 배치하여 시각적 인지도를 높입니다.
  - **정렬:** 제목과 본문은 중앙 정렬(`text-center`)을 기본으로 합니다.
  - **버튼:** 
    - 확인 버튼은 우측(또는 단독)에 배치하며 `h-11`, `rounded-xl` 규격을 따릅니다.
    - 취소 버튼이 있는 경우(Confirm) 좌측에 배치하며 `variant="secondary"`를 사용합니다.

- **유형별 가이드:**
  1. **정보/안내 (Info):** 주요 정보 전달. 파란색 아이콘 사용.
  2. **성공 (Success):** 작업 완료 안내. 녹색 아이콘 사용.
  3. **경고 (Warning):** 주의가 필요한 상황. 주황색 아이콘 사용.
  4. **오류 (Error):** 작업 실패 또는 치명적 문제. 빨간색 아이콘 및 `variant="danger"` 버튼 사용.
  5. **확인 (Confirm):** 사용자의 선택이 필요한 경우. 물음표 아이콘과 취소/확인 버튼 두 개를 배치합니다.

- **사용 예시:**
  ```tsx
  <AlertDialog
    open={isOpen}
    onOpenChange={setIsOpen}
    type="confirm"
    title="수정사항 저장"
    message="변경된 내용을 저장하시겠습니까?"
    onConfirm={handleSave}
  />
  ```
