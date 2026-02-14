# 🎨 WEWORKS 디자인 시스템

## 🎯 **원칙**

### **일관성 (Consistency)**
> 모든 화면에서 동일한 컴포넌트와 스타일 사용

### **재사용성 (Reusability)**
> 한 번 만들고 모든 곳에서 재사용

### **확장성 (Scalability)**
> 새 화면 추가 시 기존 컴포넌트로 빠르게 구축

---

## 🎨 **색상 팔레트**

### **Primary (파랑)**
```css
primary-50:  #eff6ff
primary-100: #dbeafe
primary-500: #3b82f6  /* 메인 버튼, 링크 */
primary-600: #2563eb  /* 버튼 hover */
primary-700: #1d4ed8
```

### **Success (초록)**
```css
success-50:  #f0fdf4
success-500: #10b981  /* 성공, 완료 */
success-600: #059669
```

### **Warning (주황)**
```css
warning-50:  #fffbeb
warning-500: #f59e0b  /* 경고, 대기 */
warning-600: #d97706
```

### **Danger (빨강)**
```css
danger-50:  #fef2f2
danger-500: #ef4444  /* 에러, 삭제 */
danger-600: #dc2626
```

### **Gray (회색)**
```css
gray-50:  #f9fafb  /* 배경 */
gray-100: #f3f4f6  /* 헤더 */
gray-200: #e5e7eb  /* 테두리 */
gray-500: #6b7280  /* 텍스트 보조 */
gray-900: #111827  /* 텍스트 주요 */
```

---

## 📐 **간격 (Spacing)**

### **일관된 간격 사용**
```css
gap-2:  0.5rem  (8px)   /* 작은 간격 */
gap-4:  1rem    (16px)  /* 기본 간격 */
gap-6:  1.5rem  (24px)  /* 섹션 간격 */

px-4:   1rem    (16px)  /* 좌우 패딩 */
py-3:   0.75rem (12px)  /* 상하 패딩 */
p-6:    1.5rem  (24px)  /* 카드 패딩 */
```

---

## 🔘 **버튼 스타일**

### **Primary Button** (주요 액션)
```typescript
className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white 
           shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
```
**사용**: 저장, 생성, 확인

### **Secondary Button** (보조 액션)
```typescript
className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm 
           font-medium text-gray-700 shadow-sm hover:bg-gray-50 
           disabled:opacity-50"
```
**사용**: 취소, 닫기, 뒤로가기

### **Danger Button** (삭제)
```typescript
className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white 
           shadow-sm hover:bg-red-700 disabled:opacity-50"
```
**사용**: 삭제

### **Small Button** (작은 버튼)
```typescript
className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs 
           font-medium text-gray-700 hover:bg-gray-50"
```
**사용**: 행 추가, 필터

### **Icon Button** (아이콘만)
```typescript
className="rounded-lg p-2 hover:bg-gray-100"
```
**사용**: 편집, 삭제, 뒤로가기

---

## 📋 **테이블 스타일**

### **표준 테이블**
```typescript
// 컨테이너
className="overflow-x-auto rounded-lg border border-gray-200 bg-white"

// 테이블
className="w-full divide-y divide-gray-200"

// 헤더
className="bg-gray-50"

// 헤더 셀
className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"

// 바디
className="divide-y divide-gray-200 bg-white"

// 바디 셀
className="whitespace-nowrap px-4 py-3 text-sm text-gray-900"

// Hover
className="hover:bg-gray-50"
```

---

## 📦 **카드 스타일**

### **기본 카드**
```typescript
className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
```

### **섹션 카드** (배경 있음)
```typescript
className="rounded-lg border border-gray-200 bg-gray-50 p-6"
```

### **강조 카드**
```typescript
className="rounded-lg border border-blue-200 bg-blue-50 p-6"
```

---

## 📝 **입력 필드 스타일**

### **Text Input**
```typescript
className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
           shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 
           focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
```

### **Select**
```typescript
className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
           shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 
           focus:ring-blue-500"
```

### **Textarea**
```typescript
className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
           shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 
           focus:ring-blue-500 resize-none"
```

### **Label**
```typescript
className="block text-sm font-medium text-gray-700 mb-1"
```

---

## 🏷️ **배지 (Badge) 스타일**

### **상태 배지**
```typescript
// 진행중
className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 
           text-xs font-medium text-blue-800"

// 완료
className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 
           text-xs font-medium text-green-800"

// 대기
className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 
           text-xs font-medium text-yellow-800"

// 취소/에러
className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 
           text-xs font-medium text-red-800"
```

---

## 📄 **페이지 레이아웃**

### **페이지 컨테이너**
```typescript
className="min-h-screen bg-gray-50 p-6"
```

### **내용 래퍼**
```typescript
className="mx-auto max-w-7xl space-y-6"
```

### **섹션 간격**
```typescript
className="space-y-6"  /* 섹션 사이 */
className="space-y-4"  /* 필드 사이 */
```

---

## 📑 **탭 스타일**

### **탭 네비게이션**
```typescript
// 컨테이너
className="border-b border-gray-200"

// 탭 버튼 (비활성)
className="flex items-center gap-2 border-b-2 border-transparent px-1 py-4 
           text-sm font-medium text-gray-500 hover:border-gray-300 
           hover:text-gray-700"

// 탭 버튼 (활성)
className="flex items-center gap-2 border-b-2 border-blue-500 px-1 py-4 
           text-sm font-medium text-blue-600"
```

---

## 🔔 **알림 (Toast)**

### **Sonner 사용**
```typescript
import { toast } from 'sonner';

// 성공
toast.success("저장되었습니다.");

// 에러
toast.error("저장에 실패했습니다.");

// 로딩
toast.loading("저장 중...");

// 정보
toast.info("알림 메시지");
```

---

## 🎯 **아이콘 사용**

### **표준 아이콘 (lucide-react)**
```typescript
import { 
  Plus,        // 추가
  Pencil,      // 수정
  Trash2,      // 삭제
  Save,        // 저장
  X,           // 닫기, 취소
  Check,       // 확인
  ArrowLeft,   // 뒤로
  Search,      // 검색
  Filter,      // 필터
  Download,    // 다운로드
  Upload,      // 업로드
  Calendar,    // 날짜
  Users,       // 사용자
  Settings,    // 설정
  BarChart3,   // 차트
  TrendingUp,  // 증가
  TrendingDown,// 감소
} from 'lucide-react';

// 크기 통일
className="h-4 w-4"  /* 일반 */
className="h-5 w-5"  /* 헤더 */
```

---

## 📐 **그리드 레이아웃**

### **2열 그리드**
```typescript
className="grid grid-cols-2 gap-4"
```

### **3열 그리드**
```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### **4열 그리드**
```typescript
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
```

---

## 🎨 **타이포그래피**

### **페이지 제목**
```typescript
className="text-2xl font-semibold tracking-tight text-gray-900"
```

### **섹션 제목**
```typescript
className="text-lg font-semibold text-gray-900"
```

### **설명 텍스트**
```typescript
className="text-sm text-gray-600"
```

### **본문 텍스트**
```typescript
className="text-sm text-gray-900"
```

---

## 📦 **공통 컴포넌트 위치**

```
components/ui/
├── DraggablePanel.tsx   ← 사이드 패널/드래그 패널 (표준 팝업)
├── Modal.tsx            ← 사용 금지 (중앙 정렬 팝업 지양)
├── Button.tsx           ← 모든 버튼
├── Input.tsx            ← 모든 입력 필드
├── Select.tsx           ← 모든 셀렉트
├── Card.tsx             ← 모든 카드
├── Table.tsx            ← 모든 테이블
├── Badge.tsx            ← 모든 배지
├── Tabs.tsx             ← 모든 탭
└── PageHeader.tsx       ← 페이지 헤더
```

---

## ✅ **사용 규칙**

### **팝업 표준 (Popup Standard)**
- **중앙 정렬 모달(Centered Modal)을 사용하지 않습니다.**
- 모든 상세 입력 및 정보 조회 팝업은 `DraggablePanel`을 사용합니다.
- `DraggablePanel`은 우측 또는 상단에 드래그 가능한 형태로 표시되며 배경 가림(Overlay) 없이 하단 화면과 상호작용이 가능하도록 지향합니다.

### **DO (해야 할 것)** ✅
```typescript
// 공통 컴포넌트 사용
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

<Button variant="primary" size="md">저장</Button>
<Card>내용</Card>
```

### **DON'T (하지 말 것)** ❌
```typescript
// 직접 스타일 작성
<button className="rounded-md bg-blue-600 px-4 py-2...">저장</button>

// 화면마다 다른 스타일
<button className="rounded-lg bg-blue-500 px-3 py-1...">저장</button>
```

---

## 📋 **스타일 체크리스트**

### **새 화면 만들 때**
- [ ] 공통 Button 컴포넌트 사용
- [ ] 공통 Card 컴포넌트 사용
- [ ] 공통 Table 컴포넌트 사용
- [ ] 표준 색상 사용 (primary, success, warning, danger)
- [ ] 표준 간격 사용 (gap-4, gap-6, p-6)
- [ ] 표준 아이콘 크기 (h-4 w-4, h-5 w-5)
- [ ] 표준 폰트 크기 (text-sm, text-lg, text-2xl)

---

## 🎯 **우선순위**

### **즉시 생성 (오늘)**
1. Button.tsx
2. Card.tsx
3. PageHeader.tsx
4. Badge.tsx

### **이번 주**
5. Table.tsx (TanStack Table 래퍼)
6. Input.tsx
7. Select.tsx
8. Dialog.tsx

---

**이 가이드를 항상 참조하여 일관된 UI를 유지합니다!** 🎨
