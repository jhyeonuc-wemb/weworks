# 🎨 UI 컴포넌트 사용 가이드

## ✅ **필수 규칙**

### **🔴 항상 지켜야 할 것**
1. ✅ **공통 컴포넌트만 사용** (`components/ui/`)
2. ✅ **색상은 variant로 지정** (직접 색상 코드 사용 금지)
3. ✅ **간격은 표준 사이즈** (gap-4, gap-6, p-6)
4. ✅ **아이콘 크기 통일** (h-4 w-4, h-5 w-5)

### **❌ 절대 하지 말 것**
1. ❌ 화면마다 다른 버튼 스타일
2. ❌ 직접 Tailwind 클래스로 버튼 만들기
3. ❌ 다른 색상 코드 사용
4. ❌ 다른 간격/크기 사용

---

## 📚 **사용 가능한 컴포넌트**

### **생성 완료** ✅
```
components/ui/
├── Button.tsx       ✅
├── Card.tsx         ✅
├── Input.tsx        ✅
├── Select.tsx       ✅
├── Badge.tsx        ✅
├── Table.tsx        ✅
└── PageHeader.tsx   ✅
```

---

## 🔘 **Button 사용법**

### **Import**
```typescript
import { Button } from "@/components/ui/Button";
```

### **기본 사용**
```typescript
// Primary (저장, 확인)
<Button variant="primary" size="md">저장</Button>

// Secondary (취소, 닫기)
<Button variant="secondary" size="md">취소</Button>

// Danger (삭제)
<Button variant="danger" size="md">삭제</Button>

// Small (행 추가 등)
<Button variant="secondary" size="sm">행 추가</Button>

// Icon (아이콘만)
<Button variant="ghost" size="icon">
  <Pencil className="h-4 w-4" />
</Button>

// Loading
<Button variant="primary" isLoading>저장 중...</Button>

// Disabled
<Button variant="primary" disabled>저장</Button>
```

### **아이콘과 함께**
```typescript
import { Save, Plus, Trash2 } from "lucide-react";

<Button variant="primary">
  <Save className="h-4 w-4" />
  저장
</Button>

<Button variant="secondary" size="sm">
  <Plus className="h-4 w-4" />
  추가
</Button>
```

---

## 📦 **Card 사용법**

### **Import**
```typescript
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/Card";
```

### **기본 사용**
```typescript
// 기본 카드
<Card>
  <CardHeader>
    <CardTitle>프로젝트 정보</CardTitle>
    <CardDescription>프로젝트 상세 내용입니다.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 내용 */}
  </CardContent>
  <CardFooter>
    <Button>저장</Button>
  </CardFooter>
</Card>

// 강조 카드
<Card variant="blue">
  <CardTitle>중요 정보</CardTitle>
  <CardContent>강조된 내용</CardContent>
</Card>
```

---

## 📝 **Input 사용법**

### **Import**
```typescript
import { Input, Textarea } from "@/components/ui/Input";
```

### **기본 사용**
```typescript
// 라벨 있는 입력
<Input 
  label="프로젝트명" 
  placeholder="프로젝트명을 입력하세요"
  required
/>

// 에러 표시
<Input 
  label="이메일" 
  error="올바른 이메일을 입력하세요"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// 도움말
<Input 
  label="프로젝트 코드" 
  helperText="예: P24-039"
  placeholder="P24-039"
/>

// 비활성
<Input 
  label="생성일" 
  value={createdAt}
  disabled
/>

// Textarea
<Textarea 
  label="설명" 
  rows={4}
  placeholder="프로젝트 설명을 입력하세요"
/>
```

---

## 🎯 **Select 사용법**

### **Import**
```typescript
import { Select } from "@/components/ui/Select";
```

### **기본 사용**
```typescript
// Options prop 사용
<Select 
  label="상태" 
  options={[
    { value: "draft", label: "초안" },
    { value: "review", label: "검토 중" },
    { value: "approved", label: "승인" },
  ]}
  value={status}
  onChange={(e) => setStatus(e.target.value)}
/>

// Children 사용
<Select label="직급">
  <option value="">선택하세요</option>
  <option value="manager">과장</option>
  <option value="senior">대리</option>
  <option value="staff">사원</option>
</Select>

// 에러 표시
<Select 
  label="고객사" 
  error="고객사를 선택하세요"
  options={customers}
/>
```

---

## 🏷️ **Badge 사용법**

### **Import**
```typescript
import { Badge, StatusBadge } from "@/components/ui/Badge";
```

### **기본 사용**
```typescript
// Variant 사용
<Badge variant="primary">진행 중</Badge>
<Badge variant="success">완료</Badge>
<Badge variant="warning">대기</Badge>
<Badge variant="danger">취소</Badge>

// 상태 배지 (자동 색상)
<StatusBadge status="in_progress" />
<StatusBadge status="completed" />
<StatusBadge status="approved" />
<StatusBadge status="rejected" />
```

---

## 📋 **Table 사용법**

### **Import**
```typescript
import { 
  TableContainer, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  EmptyTable
} from "@/components/ui/Table";
```

### **기본 사용**
```typescript
<TableContainer>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>프로젝트명</TableHead>
        <TableHead>고객사</TableHead>
        <TableHead>상태</TableHead>
        <TableHead>작업</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {projects.length === 0 ? (
        <tr>
          <td colSpan={4}>
            <EmptyTable 
              title="프로젝트가 없습니다"
              description="새 프로젝트를 생성하세요"
            />
          </td>
        </tr>
      ) : (
        projects.map((project) => (
          <TableRow key={project.id} clickable>
            <TableCell>{project.name}</TableCell>
            <TableCell>{project.customerName}</TableCell>
            <TableCell>
              <StatusBadge status={project.status} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</TableContainer>
```

---

## 📄 **PageHeader 사용법**

### **Import**
```typescript
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
```

### **기본 사용**
```typescript
// 페이지 헤더 (뒤로가기 + 액션 버튼)
<PageHeader
  title="수지분석서"
  description="프로젝트별 수익성 분석 및 관리"
  backLink="/profitability"
  actions={
    <>
      <Button variant="secondary">취소</Button>
      <Button variant="primary">저장</Button>
    </>
  }
/>

// 섹션 헤더 (탭 내부)
<SectionHeader
  title="제품계획"
  description="제품(자사) / 상품(타사)의 매출 계획을 작성합니다."
  actions={
    <Button variant="secondary" size="sm">
      <Plus className="h-4 w-4" />
      행 추가
    </Button>
  }
/>
```

---

## 🎨 **완전한 페이지 예시**

```typescript
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Save, Plus, Pencil, Trash2 } from "lucide-react";

export default function ProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 페이지 헤더 */}
        <PageHeader
          title="프로젝트 관리"
          description="프로젝트 목록 및 상세 정보"
          actions={
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              새 프로젝트
            </Button>
          }
        />

        {/* 필터 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Select label="상태" options={statusOptions} />
              <Select label="고객사" options={customerOptions} />
              <Input label="검색" placeholder="프로젝트명으로 검색" />
            </div>
          </CardContent>
        </Card>

        {/* 테이블 */}
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>프로젝트명</TableHead>
                <TableHead>고객사</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>수익률</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} clickable>
                  <TableCell className="font-medium">
                    {project.name}
                  </TableCell>
                  <TableCell>{project.customerName}</TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>{project.profitRate}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
```

---

## 📋 **체크리스트**

### **새 화면 만들 때**
- [ ] `Button` 컴포넌트 사용 (직접 스타일 금지)
- [ ] `Card` 컴포넌트 사용
- [ ] `Table` 컴포넌트 사용
- [ ] `Input/Select` 컴포넌트 사용
- [ ] `PageHeader` 컴포넌트 사용
- [ ] `StatusBadge` 컴포넌트 사용
- [ ] 표준 간격 사용 (gap-4, gap-6, space-y-6)
- [ ] 표준 색상 사용 (variant prop)
- [ ] 표준 아이콘 크기 (h-4 w-4)

---

## 🎯 **기존 화면 마이그레이션**

### **Before (❌)**
```typescript
// 화면마다 다른 스타일
<button className="rounded-md bg-blue-600 px-4 py-2...">저장</button>
<button className="rounded-lg bg-blue-500 px-3 py-1...">저장</button>
<button className="rounded bg-primary px-2 py-1...">저장</button>
```

### **After (✅)**
```typescript
// 모든 화면에서 동일
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="md">저장</Button>
<Button variant="primary" size="md">저장</Button>
<Button variant="primary" size="md">저장</Button>
```

---

## 🎨 **Variant 매핑**

### **Button Variants**
```typescript
"primary"   → 파랑 (저장, 생성, 확인)
"secondary" → 회색 (취소, 닫기)
"danger"    → 빨강 (삭제)
"success"   → 초록 (완료, 승인)
"ghost"     → 투명 (아이콘 버튼)
"link"      → 링크 (텍스트 링크)
```

### **Badge Variants**
```typescript
"default"  → 회색
"primary"  → 파랑 (진행 중)
"success"  → 초록 (완료, 승인)
"warning"  → 주황 (대기, 검토)
"danger"   → 빨강 (취소, 반려)
```

### **Card Variants**
```typescript
"default" → 흰색 (일반)
"gray"    → 회색 (배경)
"blue"    → 파랑 (강조)
```

---

## 💡 **실전 예제**

### **예제 1: 목록 페이지**
```typescript
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ListPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="프로젝트 목록"
          description="전체 프로젝트 관리"
          actions={
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              프로젝트
            </Button>
          }
        />
        
        <TableContainer>
          <Table>
            {/* 테이블 내용 */}
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
```

### **예제 2: 폼 페이지**
```typescript
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

export default function FormPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="프로젝트 생성"
          backLink="/projects"
        />
        
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="프로젝트명" required />
              <Select label="고객사" options={customers} required />
              <Textarea label="설명" rows={4} />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary">취소</Button>
            <Button variant="primary">저장</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🎯 **마이그레이션 가이드**

### **기존 화면 수정 시**
1. 기존 버튼 찾기
2. `<Button>` 컴포넌트로 교체
3. 기존 카드 찾기
4. `<Card>` 컴포넌트로 교체
5. 기존 테이블 찾기
6. `<Table>` 컴포넌트로 교체

### **예시**
```typescript
// Before (❌)
<button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
  저장
</button>

// After (✅)
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="md">저장</Button>
```

---

## 🎨 **일관성 체크**

### **모든 화면에서 동일해야 하는 것**
```
✅ 버튼 스타일 (variant, size)
✅ 카드 스타일 (variant)
✅ 테이블 헤더 (bg-gray-50, uppercase)
✅ 입력 필드 (border, focus ring)
✅ 간격 (gap-4, gap-6, space-y-6)
✅ 아이콘 크기 (h-4 w-4)
✅ 색상 (blue-600, gray-500 등)
```

---

## 📞 **문의**

### **새 컴포넌트 필요 시**
1. DESIGN_SYSTEM.md 확인
2. 기존 컴포넌트 재사용 가능한지 확인
3. 필요하면 `components/ui/`에 추가

### **스타일 변경 필요 시**
1. 전체 시스템에 영향
2. 팀 리드와 상의 필수
3. DESIGN_SYSTEM.md 업데이트

---

**모든 화면은 이 가이드를 따라 일관되게 작성합니다!** 🎨
