---
description: 상세 및 입력형 테이블(비정형 그리드)의 UI/UX 표준 가이드
---

# 상세/입력형 테이블 UI 표준 가이드 (Deep Dive)

이 가이드는 `ui-standard.md`의 **3.2 상세/입력형 테이블** 항목을 구체화한 실무 가이드입니다.
수지분석서, VRB, 견적서 등 **비정형 데이터**와 **복잡한 그리드**를 가진 화면에서 "엑셀(Excel)"과 같은 사용성을 제공하는 것을 목표로 합니다.

## 1. 기본 원칙 (Principles)

1.  **Excel-Like Experience:** 입력 필드는 평소에 텍스트처럼 보이며, 클릭 시에만 입력 모드로 전환된 느낌을 줍니다. 별도의 Input 박스 형태(`border`, `rounded` 등)를 노출하지 않습니다.
2.  **Fixed Row Height:** 모든 행의 높이는 **`35px`**로 엄격하게 통일합니다.
3.  **Dense & Visible:** 경계선은 명확해야 하며(`border-gray-300`), 정보 밀도는 높게 유지합니다(`text-sm`).
    *   **행 높이:** `h-[35px]` 고정
    *   **좌우 패딩:** `px-[10px]` 통일
    *   **정렬:** 구분 컬럼, 텍스트는 좌측 정렬(기본), 숫자는 우측 정렬. 단, **"소계" 및 "합계" 라벨은 중앙 정렬**.

## 2. 테이블 구조 (Table Layout)

HTML `<table>` 태그를 사용하며, 복잡한 `colspan`, `rowspan` 처리를 위해 CSS Grid보다는 고전적인 Table Layout을 권장합니다.

### 2.1 컨테이너 및 테이블
```tsx
<div className="overflow-x-auto bg-white">
  <table className="min-w-full border-collapse border border-gray-300 table-fixed">
    {/* colgroup 필수: 각 컬럼의 너비를 명시적으로 제어 */}
    <colgroup>
      <col className="w-[120px]" /> {/* 항목명 */}
      <col className="w-[100px]" /> {/* 데이터 */}
      {/* ... */}
    </colgroup>
    {/* ... */}
  </table>
</div>
```

### 2.2 테두리 정책 (Borders)
*   **Grid Style:** 모든 셀(`th`, `td`)에 **`border border-gray-300`**을 적용하여 엑셀 그리드와 같은 명확한 구분선을 만듭니다.
*   **Thin & Consistent Border:** 테이블의 가장 바깥쪽 테두리나 합계 행의 강조선도 굵은 선이나 다른 색상을 사용하지 않고 **`border-gray-300` 1px**로 통일합니다. 강조는 배경색(`bg-orange-100`)으로만 표현합니다.
*   Tailwind의 `divide-y` 대신 개별 보더를 사용하여 `rowspan`/`colspan` 시 끊김 없는 선을 구현합니다.

## 3. 행과 셀 스타일 (Rows & Cells)

### 3.1 헤더 (Header `th`)
*   **배경색:** `bg-blue-50/50` (통일)
*   **폰트:** `text-sm font-bold text-gray-900`
*   **정렬:** `text-center` (기본), 수치 컬럼이라도 헤더는 중앙 정렬 권장.
*   **높이:** `h-[35px]`

### 3.2 데이터 셀 (`td`)
*   **배경색:**
    *   **기본 (데이터/구분/메타):** `bg-white` (모든 일반 셀 흰색 통일)
    *   **소계 행:** `bg-gray-50` (회색 계열)
    *   **합계 행:** `bg-orange-100` (주황색 계열)
    *   **읽기 전용 (Disabled):** `bg-gray-50` (Input 컴포넌트 내부 처리, `bg-white`와 구분)
*   **높이:** `h-[35px]` (필수)
*   **패딩 (Padding):**
    *   모든 데이터 셀(텍스트, 숫자, 입력 필드 포함)의 좌우 패딩은 **`px-[10px]` (10px)**를 엄격하게 준수합니다.
    *   **입력 필드(Input)가 들어가는 셀:**
        *   `td` 자체에는 패딩을 주지 않거나(`p-0`), 상황에 따라 `h-[35px]`를 명시합니다.
        *   내부 `input` 태그에 `px-[10px]`와 `py-0`, `h-full`을 적용하여 텍스트 위치를 일반 셀과 동일하게 맞춥니다.
*   **폰트:** `text-sm text-gray-900`
*   **정렬:**
    *   텍스트: Left Align (기본).
    *   **소계/합계 라벨:** Center Align (중앙 정렬).
    *   숫자: Right Align.

## 4. 입력 컴포넌트 표준 (Cell Input)

"입력창처럼 보이지 않는" 스타일을 위해, 기존 `Input` 컴포넌트 대신 전용 스타일을 적용합니다.

### 4.1 스타일링 규칙
1.  **Full Fill:** Input은 `w-full h-full`로 셀 전체를 덮습니다.
2.  **No Border:** 평소에는 `border-none`, `bg-transparent`로 텍스트만 보이게 합니다.
3.  **Hover Effect:** 입력 가능한 셀임을 인지할 수 있도록 마우스 오버 시 `hover:bg-blue-50` 배경색을 적용합니다.
4.  **Focus Action:** 포커스(클릭) 시에만 `ring-2 ring-inset ring-blue-500`을 적용하여 파란색 테두리가 셀 **안쪽**으로 생기게 합니다.
4.  **Padding:** `px-[10px] py-0`를 적용하여 텍스트 수직 중앙 정렬 및 좌우 여백을 일반 셀과 일치시킵니다. 불필요한 `span`이나 이중 패딩을 주의합니다.

### 4.2 구현 코드 (Reference)
```tsx
// components/ui/table/TableInput.tsx (제안)

interface TableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  align?: 'left' | 'center' | 'right';
}

export function TableInput({ align = 'left', className, ...props }: TableInputProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <input
      type="text"
      className={`
        w-full h-full
        bg-transparent
        border-none
        rounded-none
        px-[10px]             /* 셀 패딩과 동일하게 맞춤 */
        text-sm text-gray-900
        placeholder:text-gray-400
        hover:bg-blue-50 transition-colors
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white
        disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
        transition-colors
        ${alignClass}
        ${className}
      `}
      {...props}
    />
  );
}
```

### 4.3 적용 예시 (Usage)
```tsx
// ❌ 기존 방식 (padding이 있는 td 안에 input)
// <td className="p-2 border...">
//   <input className="border rounded..." />
// </td>

// ✅ 표준 방식 (p-0 td 안에 꽉 찬 input)
<td className="p-0 border border-gray-300 h-[35px]">
  <TableInput 
    value={value} 
    onChange={handleChange} 
    align="right" 
    placeholder="0"
    className="h-full px-[10px] py-0"
  />
</td>
```

## 5. 기타 요소 표준

### 5.1 드롭다운 (Select)
*   Input과 동일하게 `w-full h-full border-none` 스타일을 적용합니다.
*   화살표 아이콘(Chevron)은 우측에 작게 표시하거나, hover 시에만 노출하여 깔끔함을 유지합니다.

### 5.2 숫자 포맷 (Number Formatting)
*   **표시:** 천 단위 콤마(`,`) 필수.
*   **정렬:** `text-right` 필수.
*   **패딩:** 우측 패딩 **`px-[10px]`**를 적용하여 수치가 우측 테두리에 달라붙지 않도록 여백을 확보합니다.
*   **폰트:** 숫자 데이터는 `font-mono` 사용을 적극 권장하지 않으나(일반 텍스트와 이질감), 정렬이 중요한 경우 고려 가능. 현재는 `Pretendard` 단일 사용을 원칙으로 함.

## 6. 요약 체크리스트

1.  [ ] `<table class="... table-fixed">` 인가?
2.  [ ] 모든 `td`, `th`에 `border border-gray-300`이 적용되었는가? (divide-y X)
3.  [ ] 행 높이가 `h-[35px]`로 고정되었는가?
4.  [ ] 입력 셀의 `td`에는 `p-0`가 적용되었는가?
5.  [ ] Input 요소에 `border-none focus:ring-inset`이 적용되어 엑셀 느낌이 나는가?
6.  [ ] 숫자 데이터의 우측 패딩이 `px-[10px]`이며, 텍스트 데이터의 좌측 패딩도 `px-[10px]`로 동일한가?
7.  [ ] "소계", "합계" 라벨이 `text-center`로 설정되어 있는가?
8.  [ ] 헤더 배경색은 `bg-blue-50/50`, 일반 셀(구분 포함)은 `bg-white`인가?
