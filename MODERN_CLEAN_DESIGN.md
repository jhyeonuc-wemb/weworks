# Modern Clean Design System (Tailwind UI 기반)

## 디자인 원칙
- **심플함**: 불필요한 장식 제거
- **명확함**: 명확한 구분선과 계층 구조
- **일관성**: 모든 화면이 동일한 패턴

---

## 1. 라운드 규칙

```tsx
// 버튼, 입력 필드
rounded-md    // 6px - 기본

// 카드, 모달
rounded-lg    // 8px - 큰 컨테이너

// 배지
rounded-full  // 완전 라운드 - 작은 요소만
```

---

## 2. 페이지 레이아웃 (모든 목록 화면 통일)

```tsx
<div className="space-y-6">
  {/* 헤더 */}
  <div className="sm:flex sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">페이지 제목</h1>
      <p className="mt-2 text-sm text-gray-700">설명</p>
    </div>
    <div className="mt-4 sm:mt-0">
      <button className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
        신규 생성
      </button>
    </div>
  </div>

  {/* 검색 및 필터 */}
  <div className="flex items-center gap-x-3">
    <div className="flex-1">
      <input
        type="text"
        placeholder="검색..."
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
    </div>
    <select className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
      <option>정렬</option>
    </select>
  </div>

  {/* 테이블 */}
  <div className="mt-8 flow-root">
    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                컬럼
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                데이터
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
```

---

## 3. 색상 (Tailwind UI 표준)

### Primary (Indigo)
- `indigo-600`: 버튼, 링크
- `indigo-500`: 호버
- `indigo-50`: 배경

### Gray (기본)
- `gray-900`: 제목, 중요 텍스트
- `gray-700`: 본문
- `gray-500`: 보조 텍스트
- `gray-300`: 구분선
- `gray-200`: 테이블 행 구분선

### 상태
- `green-600`: 성공
- `yellow-600`: 경고
- `red-600`: 오류

---

## 4. 버튼

### Primary
```tsx
<button className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
  버튼
</button>
```

### Secondary
```tsx
<button className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
  버튼
</button>
```

---

## 5. 입력 필드

```tsx
<input
  type="text"
  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
/>
```

---

## 6. 테이블

### 헤더
```tsx
<th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
  컬럼명
</th>
```

### 셀
```tsx
<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
  데이터
</td>
```

### 구분선
- 헤더: `divide-y divide-gray-300`
- 행: `divide-y divide-gray-200`

---

## 7. 배지

```tsx
<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
  완료
</span>
```

---

## 8. 로딩/빈 상태

### 로딩
```tsx
<div className="text-center py-12">
  <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
  <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
</div>
```

### 빈 상태
```tsx
<div className="text-center py-12">
  <svg className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-2 text-sm font-semibold text-gray-900">데이터 없음</h3>
  <p className="mt-1 text-sm text-gray-500">새로운 항목을 추가하세요</p>
</div>
```
