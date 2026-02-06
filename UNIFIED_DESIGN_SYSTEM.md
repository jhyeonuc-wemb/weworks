# 통일 디자인 시스템 (Unified Design System)

## 목적
- 모든 화면의 일관된 사용자 경험 제공
- 정보 밀도 최적화 (여백 최소화, 가독성 유지)
- 데이터와 기능은 유지, 스타일만 통일

---

## 1. 페이지 레이아웃

### 컨테이너
```tsx
className="space-y-4"  // 섹션 간 간격
```

### 페이지 패딩
```tsx
// 제거: 과도한 애니메이션, 여백
```

---

## 2. 헤더 영역

### 제목
```tsx
<h1 className="text-2xl font-bold text-slate-900">
  프로젝트 현황
</h1>
```

### 부제목
```tsx
<p className="text-sm text-slate-600 mt-1">
  사업본부의 모든 프로젝트 현황을 한눈에 파악합니다.
</p>
```

### 액션 버튼 (생성, 저장 등)
```tsx
<button className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
  <Plus size={16} />
  <span>신규 생성</span>
</button>
```

---

## 3. 검색/필터 바

### 컨테이너
```tsx
<div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg">
```

### 검색 입력
```tsx
<input 
  type="text"
  placeholder="검색..."
  className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
/>
```

### 정렬 드롭다운
```tsx
<button className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">
  <ArrowUpDown size={14} />
  <span>정렬</span>
  <ChevronDown size={14} />
</button>
```

---

## 4. 테이블

### 컨테이너
```tsx
<div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
  <table className="w-full">
```

### 테이블 헤더
```tsx
<thead>
  <tr className="bg-slate-50 border-b border-slate-200">
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
      컬럼명
    </th>
  </tr>
</thead>
```

### 테이블 바디
```tsx
<tbody className="divide-y divide-slate-100">
  <tr className="hover:bg-slate-50 cursor-pointer transition-colors">
    <td className="px-3 py-2.5 text-sm text-slate-900">
      데이터
    </td>
  </tr>
</tbody>
```

### 로딩 상태
```tsx
<tr>
  <td colSpan={99} className="px-3 py-12 text-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">데이터를 불러오고 있습니다...</p>
    </div>
  </td>
</tr>
```

### 빈 상태
```tsx
<tr>
  <td colSpan={99} className="px-3 py-12 text-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
        <Plus size={24} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-900">데이터가 없습니다</p>
      <p className="text-xs text-slate-500">새로운 항목을 추가해주세요</p>
    </div>
  </td>
</tr>
```

---

## 5. 폼 (Form)

### 폼 그룹
```tsx
<div className="space-y-1.5">
  <label className="block text-xs font-semibold text-slate-700">
    라벨명 <span className="text-red-500">*</span>
  </label>
  <input 
    type="text"
    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
  />
</div>
```

### Select
```tsx
<select className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
  <option>옵션</option>
</select>
```

### Textarea
```tsx
<textarea 
  rows={3}
  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
/>
```

---

## 6. 모달

### 오버레이
```tsx
<div className="fixed inset-0 bg-black/50 z-40" />
```

### 모달 컨테이너
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
```

### 모달 헤더
```tsx
<div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
  <h2 className="text-lg font-bold text-slate-900">모달 제목</h2>
  <button className="text-slate-400 hover:text-slate-600">
    <X size={20} />
  </button>
</div>
```

### 모달 바디
```tsx
<div className="p-4 overflow-y-auto">
  {/* 내용 */}
</div>
```

### 모달 푸터
```tsx
<div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
  <button className="h-9 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">
    취소
  </button>
  <button className="h-9 px-4 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800">
    저장
  </button>
</div>
```

---

## 7. 상태 배지

### 완료
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md">
  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
  완료
</span>
```

### 진행중
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md">
  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
  진행중
</span>
```

### 대기
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md">
  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
  대기
</span>
```

---

## 8. 드롭다운

### 버튼
```tsx
<button className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">
  <span>선택</span>
  <ChevronDown size={14} />
</button>
```

### 메뉴
```tsx
<div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
  <div className="px-3 py-2 border-b border-slate-100">
    <span className="text-xs font-semibold text-slate-500">옵션</span>
  </div>
  <div className="py-1">
    <button className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
      옵션 1
    </button>
  </div>
</div>
```

---

## 9. 탭

### 탭 컨테이너
```tsx
<div className="border-b border-slate-200">
  <div className="flex gap-1">
```

### 탭 버튼
```tsx
<button className="px-4 py-2 text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-slate-900 hover:border-slate-300">
  탭 1
</button>

{/* 활성 탭 */}
<button className="px-4 py-2 text-sm font-semibold text-slate-900 border-b-2 border-slate-900">
  탭 2
</button>
```

---

## 10. 색상 팔레트

### Primary (Slate)
- `slate-50`: 배경, 비활성
- `slate-100`: 구분선, 호버 배경
- `slate-200`: 테두리
- `slate-600`: 부제목, 라벨
- `slate-900`: 제목, 버튼

### Success (Emerald)
- `emerald-50`: 배경
- `emerald-500`: 아이콘
- `emerald-700`: 텍스트

### Warning (Amber)
- `amber-50`: 배경
- `amber-500`: 아이콘
- `amber-700`: 텍스트

### Error (Red/Rose)
- `red-500`: 필수 표시
- `rose-50`: 배경
- `rose-500`: 아이콘
- `rose-700`: 텍스트

---

## 11. 간격 (Spacing)

### 섹션 간
- `space-y-4`: 기본 섹션 간격

### 요소 간
- `gap-2`: 작은 요소 (아이콘-텍스트)
- `gap-3`: 중간 요소 (버튼 그룹)
- `gap-4`: 큰 요소 (폼 필드)

### 패딩
- `p-3`: 검색바, 카드
- `p-4`: 모달, 섹션
- `px-3 py-2`: 테이블 셀, 버튼

---

## 12. 타이포그래피

### 크기
- `text-2xl`: 페이지 제목
- `text-lg`: 모달 제목
- `text-sm`: 기본 텍스트, 버튼
- `text-xs`: 라벨, 배지, 테이블 헤더

### 굵기
- `font-bold`: 페이지 제목, 모달 제목
- `font-semibold`: 라벨, 버튼, 활성 탭
- `font-medium`: 일반 버튼, 텍스트

---

## 적용 대상 화면

1. ✅ 프로젝트 목록 (`/projects`)
2. ✅ 프로젝트 생성/수정 (`/projects/new`, `/projects/[id]`)
3. ✅ M/D 산정 목록 (`/md-estimation`)
4. ✅ M/D 산정 생성 (`/projects/[id]/md-estimation`)
5. ✅ VRB 목록 (`/vrb-review`)
6. ✅ VRB 생성 (`/projects/[id]/vrb-review`)
7. ✅ 수지분석서 목록 (`/profitability`)
8. ✅ 수지분석서 생성 (`/projects/[id]/profitability`)
9. ✅ 수지정산서 목록 (`/settlement`)
10. ✅ 수지정산서 생성 (`/projects/[id]/settlement`)
11. ✅ 설정 > 프로젝트 기준정보 (`/settings/clients`)
12. ✅ 설정 > 사용자관리 (`/settings/users`)
13. ✅ 설정 > 부서관리 (`/settings/departments`)
