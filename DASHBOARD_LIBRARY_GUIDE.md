# 📊 모니터링/대시보드 라이브러리 종합 가이드

## 🎯 **시스템 요구사항 재분석**

### **당신의 시스템이 필요한 것:**
1. 📋 **복잡한 표 관리** (정렬, 필터, 편집)
2. 📝 **많은 폼 입력** (유효성 검증, 저장)
3. 📊 **엑셀 익스포트/임포트**
4. 📈 **프로젝트 모니터링** (수익률, 진행 상황)
5. 👥 **인력 현황 모니터링** (배치 현황, 가동률)
6. 📉 **실시간 대시보드** (KPI, 트렌드)
7. 📅 **기간 분석** (월별, 분기별, 연도별)

---

## 🏆 **최종 추천 라이브러리 세트**

### **🔴 Tier 1: 필수 (즉시 설치)** 

#### **1. TanStack Table** (테이블) ⭐⭐⭐⭐⭐
```bash
npm install @tanstack/react-table
```
**용도**: 
- 기준단가표, 수지분석서 목록, 프로젝트 목록
- 인력 배치 현황, VRB 목록
- **현재 모든 테이블 (10개 이상)**

**기능**:
- ✅ 정렬, 필터링, 페이징
- ✅ 행 선택, 인라인 편집
- ✅ 가상 스크롤 (대용량)
- ✅ 엑셀 익스포트 연동

**ROI**: 코드 70% 감소, 개발 5배 빠름

---

#### **2. Recharts** (차트 - 기본) ⭐⭐⭐⭐⭐
```bash
npm install recharts
```
**용도**:
- ✅ 프로젝트 수익률 추이 (Line Chart)
- ✅ 부서별 프로젝트 수 (Bar Chart)
- ✅ 프로젝트 상태 분포 (Pie Chart)
- ✅ 월별 매출 (Area Chart)

**장점**:
- React 네이티브
- 반응형
- 커스터마이징 쉬움
- **일반적인 대시보드에 충분**

---

#### **3. Tremor** (대시보드 전용) ⭐⭐⭐⭐⭐ 🆕 추가!
```bash
npm install @tremor/react
```
**용도**:
- ✅ **엔터프라이즈급 대시보드 컴포넌트**
- ✅ KPI 카드, 메트릭 카드
- ✅ 차트 + 테이블 통합
- ✅ 반응형 그리드 레이아웃

**특징**:
- Tailwind 기반 (기존 스타일과 통합)
- 즉시 사용 가능한 컴포넌트
- **모니터링 대시보드 전용 설계**

**예시:**
```typescript
import { Card, Title, BarChart, DonutChart, AreaChart } from '@tremor/react';

// KPI 카드
<Card>
  <Title>진행 중인 프로젝트</Title>
  <Metric>24</Metric>
  <Text>전월 대비 +12%</Text>
</Card>

// 월별 수익률
<AreaChart
  data={monthlyRevenue}
  categories={["매출", "비용", "이익"]}
  colors={["blue", "red", "green"]}
/>

// 프로젝트 상태 분포
<DonutChart
  data={projectStatus}
  category="count"
  index="status"
/>
```

---

#### **4. Visx (고급 차트, 선택) ⭐⭐⭐⭐ 🆕 추가!
```bash
npm install @visx/visx
```
**용도**:
- ✅ 복잡한 커스텀 차트
- ✅ 히트맵 (인력 가동률)
- ✅ 간트 차트 (프로젝트 일정)
- ✅ 네트워크 그래프 (조직도)

**특징**:
- Airbnb 제작
- D3 기반 (저수준 제어)
- React 완전 통합

---

#### **5. xlsx** (엑셀) ⭐⭐⭐⭐⭐
```bash
npm install xlsx
npm install -D @types/xlsx
```
**용도**:
- ✅ 수지분석서 → 엑셀 다운로드
- ✅ 기준단가표 → 엑셀 다운로드
- ✅ 프로젝트 목록 → 엑셀 다운로드
- ✅ **엑셀 템플릿 업로드 → 데이터 임포트**

**특별 기능**:
```typescript
// 엑셀 템플릿 읽어서 데이터 추출
const importFromExcel = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const workbook = XLSX.read(e.target.result);
    const sheet = workbook.Sheets['수지분석서'];
    const data = XLSX.utils.sheet_to_json(sheet);
    // 데이터베이스에 저장
  };
  reader.readAsArrayBuffer(file);
};
```

---

#### **6. React Hook Form + Zod** (폼) ⭐⭐⭐⭐⭐
```bash
npm install react-hook-form zod @hookform/resolvers
```
**용도**: 모든 입력 폼 (20개 이상)

---

#### **7. Sonner** (알림) ⭐⭐⭐⭐⭐
```bash
npm install sonner
```
**용도**: 저장 완료, 에러 메시지

---

#### **8. date-fns** (날짜) ⭐⭐⭐⭐⭐
```bash
npm install date-fns
```
**용도**: 계약 기간, 프로젝트 일정 계산

---

#### **9. React Big Calendar** (캘린더) ⭐⭐⭐⭐⭐ 🆕 추가!
```bash
npm install react-big-calendar
npm install -D @types/react-big-calendar
```
**용도**:
- ✅ **프로젝트 일정 캘린더**
- ✅ **인력 배치 스케줄**
- ✅ **마일스톤 표시**
- ✅ **휴가/출장 현황**

**특징:**
- 무료, MIT 라이센스
- 월/주/일 뷰 지원
- 드래그 앤 드롭 (일정 변경)
- 이벤트 필터링
- 커스터마이징 완전 자유

**예시:**
```typescript
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 프로젝트 일정 캘린더
const events = projects.map(p => ({
  title: p.name,
  start: new Date(p.startDate),
  end: new Date(p.endDate),
  resource: p,
}));

<Calendar
  localizer={momentLocalizer(moment)}
  events={events}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 700 }}
  views={['month', 'week', 'day']}
  onSelectEvent={(event) => showProjectDetail(event.resource)}
/>
```

---

### **🟡 Tier 2: 고급 기능 (다음 단계)**

#### **9. React Query** (데이터 페칭) ⭐⭐⭐⭐
```bash
npm install @tanstack/react-query
```
**용도**:
- 자동 캐싱 (같은 데이터 여러 곳에서 사용)
- 자동 리프레시
- 낙관적 업데이트

---

#### **10. React Grid Layout** (대시보드 레이아웃) ⭐⭐⭐⭐
```bash
npm install react-grid-layout
```
**용도**:
- 드래그 앤 드롭으로 위젯 배치
- 사용자별 대시보드 커스터마이징
- **관리자 대시보드**

---

#### **11. React DnD** (드래그 앤 드롭) ⭐⭐⭐
```bash
npm install react-dnd react-dnd-html5-backend
```
**용도**:
- 인력 배치 (드래그로 팀원 할당)
- 프로젝트 우선순위 조정

---

### **🟢 Tier 3: 선택 (장기)**

#### **12. Zustand** (전역 상태) ⭐⭐⭐⭐
```bash
npm install zustand
```
**용도**: 사용자 정보, 필터 상태 공유

#### **13. React Virtualized** (가상 스크롤) ⭐⭐⭐
```bash
npm install react-window
```
**용도**: 1000+ 행 테이블 성능 최적화

---

## 📊 **시스템별 라이브러리 매핑**

### **프로젝트 모니터링 대시보드**
```typescript
import { Card, Title, BarChart, AreaChart } from '@tremor/react';
import { useQuery } from '@tanstack/react-query';

// 프로젝트 현황
<Card>
  <Title>프로젝트 현황</Title>
  <BarChart
    data={projectsByPhase}
    categories={["진행중", "완료", "대기"]}
    colors={["blue", "green", "gray"]}
  />
</Card>

// 월별 수익률 추이
<Card>
  <Title>월별 수익률 추이</Title>
  <AreaChart
    data={monthlyProfitability}
    categories={["수익률"]}
    colors={["emerald"]}
  />
</Card>

// 부서별 프로젝트 수
<Card>
  <Title>부서별 프로젝트 수</Title>
  <DonutChart
    data={projectsByDept}
    category="count"
    index="department"
  />
</Card>
```

### **인력 현황 대시보드**
```typescript
import { BarChart, HeatMap } from '@visx/visx';

// 부서별 인력 현황
<BarChart
  data={manpowerByDept}
  xAccessor={d => d.department}
  yAccessor={d => d.headcount}
/>

// 인력 가동률 히트맵 (월별 x 팀원)
<HeatMap
  data={utilizationMatrix}
  // 색상으로 가동률 표시 (0-100%)
/>

// 프로젝트별 인력 배치
<GanttChart
  data={projectTimelines}
  // 프로젝트별 인원 배치 시각화
/>
```

### **수지분석서 엑셀 익스포트**
```typescript
import * as XLSX from 'xlsx';

const exportProfitability = (profitability: ProfitabilityData) => {
  const wb = XLSX.utils.book_new();
  
  // 1. 요약 시트
  const summaryData = [
    ['프로젝트명', profitability.projectName],
    ['고객사', profitability.customerName],
    ['총 매출', profitability.totalRevenue],
    ['영업이익률', `${profitability.profitRate}%`],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '요약');
  
  // 2. 제품계획 시트
  const wsProduct = XLSX.utils.json_to_sheet(profitability.productItems);
  XLSX.utils.book_append_sheet(wb, wsProduct, '제품계획');
  
  // 3. 기준-단가 시트
  const wsPrice = XLSX.utils.json_to_sheet(profitability.unitPrices);
  XLSX.utils.book_append_sheet(wb, wsPrice, '기준-단가');
  
  // 4. 기준-경비 시트
  const wsExpense = XLSX.utils.json_to_sheet(profitability.expenses);
  XLSX.utils.book_append_sheet(wb, wsExpense, '기준-경비');
  
  // 다운로드
  XLSX.writeFile(wb, `수지분석서_${profitability.projectCode}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// 버튼
<button onClick={() => exportProfitability(data)}>
  📥 엑셀 다운로드
</button>
```

### **엑셀 템플릿 임포트**
```typescript
const importExcelTemplate = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const workbook = XLSX.read(e.target.result);
    
    // 수지분석서 시트 읽기
    const sheet = workbook.Sheets['수지분석서'];
    
    // 셀 값 추출
    const totalRevenue = sheet['B5']?.v;  // B5 셀의 값
    const totalCost = sheet['B6']?.v;
    
    // 테이블 데이터 추출
    const productData = XLSX.utils.sheet_to_json(sheet, { 
      range: 'A10:G50' // 제품계획 범위
    });
    
    // API로 저장
    await saveProfitability({ totalRevenue, totalCost, productData });
  };
  reader.readAsArrayBuffer(file);
};

// 드래그 앤 드롭 영역
<div onDrop={handleDrop}>
  📄 엑셀 파일을 여기에 드롭하세요
</div>
```

---

## 🎨 **차트 라이브러리 상세 비교**

### **Option 1: Recharts** (일반 차트) ⭐⭐⭐⭐⭐
```bash
npm install recharts
```

**장점:**
- ✅ 사용 매우 쉬움
- ✅ React 네이티브
- ✅ 반응형
- ✅ 일반적인 차트 완벽 지원

**지원 차트:**
- Line Chart (수익률 추이)
- Bar Chart (부서별 비교)
- Pie/Donut Chart (분포)
- Area Chart (누적 추이)
- Scatter Chart (상관관계)
- Composed Chart (복합 차트)

**단점:**
- 고급 기능 제한적
- 인터랙션 제한

**사용 예:**
```typescript
import { LineChart, Line, BarChart, Bar, PieChart, Pie } from 'recharts';

// 월별 수익률 추이
<LineChart data={monthlyData} width={800} height={400}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="profitRate" stroke="#3b82f6" name="수익률" />
  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="매출" />
</LineChart>

// 프로젝트 상태 분포
<PieChart width={400} height={400}>
  <Pie
    data={projectStatus}
    dataKey="count"
    nameKey="status"
    cx="50%"
    cy="50%"
    outerRadius={100}
    label
  />
  <Tooltip />
</PieChart>
```

---

### **Option 2: Tremor** (대시보드 올인원) ⭐⭐⭐⭐⭐ 🏆 최고 추천!
```bash
npm install @tremor/react
```

**장점:**
- ✅ **대시보드 전용 설계**
- ✅ 차트 + KPI 카드 + 테이블 통합
- ✅ Tailwind 완벽 통합
- ✅ 즉시 사용 가능
- ✅ **엔터프라이즈 룩앤필**

**지원 컴포넌트:**
- 📊 **Chart**: Bar, Line, Area, Donut
- 📈 **Metric**: KPI 카드, 델타 표시
- 📋 **Table**: 정렬, 필터 내장
- 🎯 **Progress**: 진행률 표시
- 🔔 **Badge**: 상태 표시

**사용 예 (완전한 대시보드):**
```typescript
import {
  Card,
  Title,
  Text,
  Metric,
  Flex,
  BadgeDelta,
  AreaChart,
  BarChart,
  DonutChart,
  Grid,
  Col,
} from '@tremor/react';

export function ProjectDashboard() {
  return (
    <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
      {/* KPI 카드들 */}
      <Card>
        <Text>진행 중인 프로젝트</Text>
        <Metric>24</Metric>
        <Flex className="mt-4">
          <Text>전월 대비</Text>
          <BadgeDelta deltaType="increase">+12%</BadgeDelta>
        </Flex>
      </Card>

      <Card>
        <Text>평균 수익률</Text>
        <Metric>18.5%</Metric>
        <Flex className="mt-4">
          <Text>전년 대비</Text>
          <BadgeDelta deltaType="increase">+2.3%</BadgeDelta>
        </Flex>
      </Card>

      <Card>
        <Text>총 매출 (당월)</Text>
        <Metric>₩1.2B</Metric>
        <Flex className="mt-4">
          <Text>목표 달성률</Text>
          <BadgeDelta deltaType="increase">95%</BadgeDelta>
        </Flex>
      </Card>

      {/* 차트 */}
      <Col numColSpan={2}>
        <Card>
          <Title>월별 수익률 추이</Title>
          <AreaChart
            className="mt-4 h-80"
            data={monthlyTrend}
            index="month"
            categories={["수익률", "목표"]}
            colors={["blue", "gray"]}
            valueFormatter={(v) => `${v}%`}
          />
        </Card>
      </Col>

      <Card>
        <Title>프로젝트 단계별 분포</Title>
        <DonutChart
          className="mt-4"
          data={projectsByPhase}
          category="count"
          index="phase"
          colors={["blue", "cyan", "indigo", "violet"]}
        />
      </Card>

      {/* 테이블 */}
      <Col numColSpan={3}>
        <Card>
          <Title>고수익 프로젝트 Top 10</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>프로젝트명</TableHeaderCell>
                <TableHeaderCell>수익률</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topProjects.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.profitRate}%</TableCell>
                  <TableCell>
                    <Badge color={getStatusColor(p.status)}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Col>
    </Grid>
  );
}
```

**효과**: 대시보드 1주 → 1일로 단축

---

### **Option 3: Visx** (고급/커스텀) ⭐⭐⭐⭐
```bash
npm install @visx/visx
```

**용도:**
- 간트 차트 (프로젝트 일정)
- 히트맵 (인력 가동률)
- 네트워크 그래프 (조직 구조)

**예시 - 간트 차트:**
```typescript
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';

// 프로젝트 일정 간트 차트
<svg width={1200} height={600}>
  <Group>
    {projects.map((project, i) => (
      <rect
        key={project.id}
        x={xScale(project.startDate)}
        y={i * 40}
        width={xScale(project.endDate) - xScale(project.startDate)}
        height={30}
        fill={getProjectColor(project.status)}
      />
    ))}
  </Group>
</svg>
```

**예시 - 인력 가동률 히트맵:**
```typescript
import { HeatmapCircle } from '@visx/heatmap';

// 팀원별 x 월별 가동률
<HeatmapCircle
  data={utilizationData}
  xScale={monthScale}
  yScale={memberScale}
  colorScale={colorScale}  // 0% (파랑) → 100% (빨강)
/>
```

---

## 🎯 **최종 권장 조합**

### **Combo A: 빠른 구축** (추천!) 🏆
```bash
npm install @tremor/react recharts @tanstack/react-table react-hook-form zod @hookform/resolvers xlsx sonner date-fns
npm install -D @types/xlsx
```

**특징:**
- ✅ 대시보드: Tremor (즉시 사용 가능)
- ✅ 커스텀 차트: Recharts (필요시)
- ✅ 테이블: TanStack Table
- ✅ 나머지: 필수 라이브러리

**소요 시간**: 설치 2분
**효과**: 즉시 사용 가능한 대시보드

---

### **Combo B: 고급 커스터마이징**
```bash
npm install recharts @visx/visx @tanstack/react-table react-hook-form zod xlsx sonner date-fns react-grid-layout
```

**특징:**
- ✅ 차트: Recharts + Visx (고급 기능)
- ✅ 레이아웃: React Grid Layout (커스터마이징)

---

## 💰 **비용 분석**

### **모두 무료!** ✅
```
TanStack Table:   무료 (MIT)
Recharts:         무료 (MIT)
Tremor:           무료 (Apache-2.0)
Visx:             무료 (MIT)
xlsx:             무료 (Apache-2.0)
React Hook Form:  무료 (MIT)
Sonner:           무료 (MIT)

총 비용: $0
```

### **유료 대안 (비교)**
```
❌ Highcharts:    $570/개발자
❌ FusionCharts:  $497/개발자
❌ AG Grid Ent:   $999/개발자

절감: $2,000+ / 개발자 / 연
```

---

## 📈 **구체적 구현 예시**

### **1. 프로젝트 대시보드 페이지**
```typescript
// app/(main)/dashboard/page.tsx
import { Card, Title, AreaChart, BarChart, DonutChart, Grid } from '@tremor/react';

export default function Dashboard() {
  const { data: stats } = useProjectStats();
  
  return (
    <div className="p-6">
      <h1>프로젝트 모니터링 대시보드</h1>
      
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mt-6">
        {/* KPI 카드 */}
        <Card>
          <Text>진행 중</Text>
          <Metric>{stats.inProgress}</Metric>
          <BadgeDelta deltaType="increase">+{stats.delta}%</BadgeDelta>
        </Card>
        
        <Card>
          <Text>평균 수익률</Text>
          <Metric>{stats.avgProfitRate}%</Metric>
        </Card>
        
        <Card>
          <Text>총 매출 (YTD)</Text>
          <Metric>{formatCurrency(stats.totalRevenue)}</Metric>
        </Card>
        
        <Card>
          <Text>인력 가동률</Text>
          <Metric>{stats.utilization}%</Metric>
        </Card>
      </Grid>
      
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6 mt-6">
        {/* 월별 추이 */}
        <Card>
          <Title>월별 수익률 추이</Title>
          <AreaChart
            data={stats.monthly}
            index="month"
            categories={["수익률", "목표"]}
            colors={["blue", "gray"]}
          />
        </Card>
        
        {/* 프로젝트 단계 */}
        <Card>
          <Title>프로젝트 단계별 분포</Title>
          <DonutChart
            data={stats.byPhase}
            category="count"
            index="phase"
          />
        </Card>
      </Grid>
      
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6 mt-6">
        {/* 부서별 프로젝트 */}
        <Card>
          <Title>부서별 프로젝트 수</Title>
          <BarChart
            data={stats.byDepartment}
            index="department"
            categories={["진행중", "완료"]}
            colors={["blue", "green"]}
          />
        </Card>
        
        {/* 고객사별 매출 */}
        <Card>
          <Title>고객사별 매출 Top 10</Title>
          <BarList
            data={stats.topCustomers}
            valueFormatter={(v) => formatCurrency(v)}
          />
        </Card>
      </Grid>
    </div>
  );
}
```

### **2. 인력 현황 대시보드**
```typescript
// app/(main)/dashboard/manpower/page.tsx
import { HeatMap } from '@visx/heatmap';
import { Card, BarChart } from '@tremor/react';

export default function ManpowerDashboard() {
  const { data: manpower } = useManpowerStats();
  
  return (
    <div className="p-6">
      <h1>인력 현황 모니터링</h1>
      
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mt-6">
        <Card>
          <Text>총 인원</Text>
          <Metric>{manpower.total}명</Metric>
        </Card>
        
        <Card>
          <Text>평균 가동률</Text>
          <Metric>{manpower.avgUtilization}%</Metric>
        </Card>
        
        <Card>
          <Text>배치 대기</Text>
          <Metric>{manpower.unassigned}명</Metric>
        </Card>
        
        <Card>
          <Text>초과 배치</Text>
          <Metric>{manpower.overallocated}명</Metric>
        </Card>
      </Grid>
      
      {/* 부서별 인력 현황 */}
      <Card className="mt-6">
        <Title>부서별 인력 현황</Title>
        <BarChart
          data={manpower.byDepartment}
          index="department"
          categories={["배치인원", "가용인원"]}
          colors={["blue", "gray"]}
        />
      </Card>
      
      {/* 인력 가동률 히트맵 */}
      <Card className="mt-6">
        <Title>월별 팀원 가동률 히트맵</Title>
        <div style={{ width: '100%', height: 400 }}>
          <HeatmapCircle
            data={manpower.utilizationMatrix}
            // 색상: 낮음 (파랑) → 높음 (빨강)
          />
        </div>
      </Card>
      
      {/* 직급별 분포 */}
      <Card className="mt-6">
        <Title>직급별 인력 분포</Title>
        <DonutChart
          data={manpower.byJobLevel}
          category="count"
          index="jobLevel"
        />
      </Card>
    </div>
  );
}
```

### **3. 프로젝트 일정 캘린더**
```typescript
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export function ProjectCalendar() {
  // 프로젝트 일정
  const projectEvents = projects.map(p => ({
    id: p.id,
    title: `${p.name} (${p.customerName})`,
    start: new Date(p.contractStartDate),
    end: new Date(p.contractEndDate),
    resource: {
      type: 'project',
      status: p.status,
      profitRate: p.profitRate,
    },
  }));
  
  // 마일스톤
  const milestoneEvents = milestones.map(m => ({
    id: m.id,
    title: `🎯 ${m.name}`,
    start: new Date(m.date),
    end: new Date(m.date),
    resource: { type: 'milestone' },
  }));
  
  // 인력 배치
  const manpowerEvents = assignments.map(a => ({
    id: a.id,
    title: `${a.userName} → ${a.projectName}`,
    start: new Date(a.startDate),
    end: new Date(a.endDate),
    resource: { 
      type: 'assignment',
      utilization: a.allocationPercentage,
    },
  }));
  
  const allEvents = [...projectEvents, ...milestoneEvents, ...manpowerEvents];
  
  return (
    <div className="h-screen p-6">
      <Calendar
        localizer={localizer}
        events={allEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
        
        // 이벤트 스타일링
        eventPropGetter={(event) => {
          let style = { backgroundColor: '#3b82f6' };
          
          if (event.resource.type === 'project') {
            // 프로젝트 상태별 색상
            style.backgroundColor = {
              'in_progress': '#3b82f6',    // 파랑
              'completed': '#10b981',       // 초록
              'vrb_review': '#f59e0b',     // 주황
            }[event.resource.status] || '#6b7280';
          } else if (event.resource.type === 'milestone') {
            style.backgroundColor = '#ef4444'; // 빨강
          } else if (event.resource.type === 'assignment') {
            // 가동률에 따른 색상
            const util = event.resource.utilization;
            style.backgroundColor = 
              util > 100 ? '#ef4444' :  // 빨강 (초과)
              util > 80 ? '#f59e0b' :   // 주황 (높음)
              util > 50 ? '#3b82f6' :   // 파랑 (정상)
              '#6b7280';                 // 회색 (낮음)
          }
          
          return { style };
        }}
        
        // 클릭 이벤트
        onSelectEvent={(event) => {
          if (event.resource.type === 'project') {
            router.push(`/projects/${event.id}`);
          }
        }}
        
        // 드래그로 일정 변경
        onEventDrop={({ event, start, end }) => {
          updateEventDate(event.id, start, end);
        }}
      />
    </div>
  );
}
```

### **4. 인력 배치 캘린더 (리소스 뷰)**
```typescript
import { Calendar } from 'react-big-calendar';

// 팀원별 배치 현황
export function ManpowerCalendar() {
  const resources = teamMembers.map(m => ({
    id: m.id,
    title: `${m.name} (${m.jobLevel})`,
  }));
  
  const events = assignments.map(a => ({
    id: a.id,
    title: a.projectName,
    start: new Date(a.startDate),
    end: new Date(a.endDate),
    resourceId: a.userId,
    resource: {
      utilization: a.allocationPercentage,
      projectCode: a.projectCode,
    },
  }));
  
  return (
    <Calendar
      localizer={localizer}
      events={events}
      resources={resources}
      resourceIdAccessor="resourceId"
      resourceTitleAccessor="title"
      views={['month', 'week', 'day']}
      defaultView="week"
      
      // 리소스별로 구분해서 표시
      // 각 팀원의 주간 스케줄 한눈에 확인
      
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: 
            event.resource.utilization > 100 ? '#ef4444' :
            event.resource.utilization > 80 ? '#f59e0b' :
            '#3b82f6',
        },
      })}
    />
  );
}
```

### **5. 프로젝트 타임라인 (간트 차트)**
```typescript
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleTime, scaleBand } from '@visx/scale';

export function ProjectTimeline({ projects }) {
  const xScale = scaleTime({
    domain: [minDate, maxDate],
    range: [0, width],
  });
  
  const yScale = scaleBand({
    domain: projects.map(p => p.name),
    range: [0, height],
  });
  
  return (
    <svg width={width} height={height}>
      <Group>
        {projects.map((project) => {
          const barWidth = xScale(project.endDate) - xScale(project.startDate);
          const barHeight = yScale.bandwidth() - 4;
          
          return (
            <Group key={project.id}>
              {/* 프로젝트 바 */}
              <Bar
                x={xScale(project.startDate)}
                y={yScale(project.name)}
                width={barWidth}
                height={barHeight}
                fill={getStatusColor(project.status)}
                rx={4}
              />
              {/* 텍스트 */}
              <text
                x={xScale(project.startDate) + 10}
                y={yScale(project.name) + barHeight / 2}
                fontSize={12}
                fill="white"
              >
                {project.name}
              </text>
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}
```

---

## 🎯 **최종 추천**

### **필수 설치 (Phase 1)** 🔴

```bash
# 복사해서 터미널에 붙여넣기:
npm install @tremor/react recharts @tanstack/react-table react-hook-form zod @hookform/resolvers xlsx sonner date-fns react-big-calendar moment
npm install -D @types/xlsx @types/react-big-calendar
```

**이유:**
- ✅ **@tremor/react**: 대시보드 즉시 구축 가능
- ✅ **recharts**: 커스텀 차트 필요시 사용
- ✅ **@tanstack/react-table**: 모든 테이블 자동화
- ✅ **react-hook-form + zod**: 모든 폼 자동화
- ✅ **xlsx**: 엑셀 기능
- ✅ **sonner**: 알림
- ✅ **date-fns**: 날짜 계산
- ✅ **react-big-calendar**: 프로젝트/인력 일정 캘린더

---

### **선택 설치 (Phase 2)** 🟡

```bash
npm install @visx/visx react-grid-layout react-day-picker @radix-ui/react-dialog @radix-ui/react-select zustand @tanstack/react-query
```

**이유:**
- ✅ 고급 차트 (간트, 히트맵)
- ✅ 커스터마이징 가능한 대시보드
- ✅ 전역 상태 관리
- ✅ 서버 상태 캐싱

---

## 📊 **예상 ROI**

### **Phase 1 설치 후**
```
개발 시간:    
- 테이블: 3일 → 0.5일 (83% ↓)
- 폼: 2일 → 0.5일 (75% ↓)
- 엑셀: 1주 → 1일 (86% ↓)
- 대시보드: 1주 → 1일 (86% ↓)

코드 라인:
- 테이블: 500줄 → 100줄 (80% ↓)
- 폼: 300줄 → 50줄 (83% ↓)
- 대시보드: 신규 (1일 만에 구축)

총 효과: 개발 속도 5배 향상
```

### **Phase 2 설치 후**
```
+ 고급 차트 (간트, 히트맵)
+ 드래그 앤 드롭 인력 배치
+ 실시간 자동 새로고침
+ 사용자별 대시보드 커스터마이징

총 효과: 엔터프라이즈급 시스템
```

---

## 🚀 **즉시 실행**

### **추천 명령어 (복사/붙여넣기)**

```bash
npm install @tremor/react recharts @tanstack/react-table react-hook-form zod @hookform/resolvers xlsx sonner date-fns react-big-calendar moment
npm install -D @types/xlsx @types/react-big-calendar
```

**설치 시간**: 2분  
**효과**: 즉시  
**비용**: $0

---

---

## 📅 **캘린더 활용 시나리오**

### **시나리오 1: 프로젝트 일정 캘린더**
```typescript
// app/(main)/calendar/projects/page.tsx
import { Calendar } from 'react-big-calendar';

export default function ProjectCalendar() {
  const events = [
    {
      title: 'P24-039 KOEN 스마트 도면관리',
      start: new Date(2024, 0, 1),
      end: new Date(2024, 11, 31),
      type: 'project',
      status: 'in_progress',
    },
    {
      title: '🎯 중간 검토',
      start: new Date(2024, 5, 15),
      end: new Date(2024, 5, 15),
      type: 'milestone',
    },
    {
      title: '📝 수지분석서 제출',
      start: new Date(2024, 2, 1),
      end: new Date(2024, 2, 1),
      type: 'deadline',
    },
  ];
  
  return (
    <div className="p-6">
      <h1>프로젝트 일정 캘린더</h1>
      <Calendar
        events={events}
        views={['month', 'week', 'agenda']}
        // 월 뷰: 전체 프로젝트 한눈에
        // 주 뷰: 이번 주 상세 일정
        // Agenda: 목록 형태
      />
    </div>
  );
}
```

**화면 예시:**
```
┌─────────────────────────────────────────────┐
│  📅 프로젝트 일정 캘린더      [월|주|일|목록]│
├─────────────────────────────────────────────┤
│  2024년 3월                                  │
│  일   월   화   수   목   금   토            │
│                   1   2   3   4             │
│  5    6    7    8   9  10  11               │
│ [────P24-039 진행중──────────]               │
│ 12  13   14   15  16  17  18               │
│      🎯            📝                        │
│ 19  20   21   22  23  24  25               │
│ [────────P25-019──────]                     │
└─────────────────────────────────────────────┘

색상:
🟦 파랑: 진행 중
🟩 초록: 완료
🟧 주황: VRB 검토
🔴 빨강: 마일스톤
```

---

### **시나리오 2: 인력 배치 캘린더**
```typescript
// app/(main)/calendar/manpower/page.tsx
export default function ManpowerCalendar() {
  // 리소스 = 팀원 목록
  const resources = [
    { id: 1, title: '홍길동 (과장)' },
    { id: 2, title: '김철수 (대리)' },
    { id: 3, title: '이영희 (사원)' },
  ];
  
  // 이벤트 = 프로젝트 배치
  const events = [
    {
      title: 'P24-039 (80%)',
      start: new Date(2024, 2, 1),
      end: new Date(2024, 2, 31),
      resourceId: 1,
      utilization: 80,
    },
    {
      title: 'P25-019 (50%)',
      start: new Date(2024, 2, 1),
      end: new Date(2024, 2, 31),
      resourceId: 2,
      utilization: 50,
    },
  ];
  
  return (
    <Calendar
      localizer={localizer}
      events={events}
      resources={resources}
      resourceIdAccessor="resourceId"
      resourceTitleAccessor="title"
      view="week"
      
      // 드래그로 인력 재배치 가능
      draggableAccessor={() => true}
      resizable
      onEventDrop={handleEventDrop}
    />
  );
}
```

**화면 예시:**
```
┌─────────────────────────────────────────────┐
│  👥 인력 배치 캘린더          [월|주|일]     │
├──────┬──────────────────────────────────────┤
│      │  월   화   수   목   금   토   일     │
├──────┼──────────────────────────────────────┤
│홍길동│ [───P24-039 (80%)────────────]       │
│(과장)│                                       │
├──────┼──────────────────────────────────────┤
│김철수│ [──P25-019 (50%)──]                  │
│(대리)│        [──P24-040 (30%)──]           │
├──────┼──────────────────────────────────────┤
│이영희│                  [휴가]               │
│(사원)│                                       │
└──────┴──────────────────────────────────────┘

색상:
🟦 파랑: 정상 (50-80%)
🟧 주황: 높음 (80-100%)
🟥 빨강: 초과 (100%+)
```

---

### **시나리오 3: 통합 모니터링 캘린더**
```typescript
// 프로젝트 + 인력 + 마일스톤 모두 표시
export function IntegratedCalendar() {
  const events = [
    // 프로젝트
    ...projects.map(p => ({
      title: `[프로젝트] ${p.name}`,
      start: new Date(p.startDate),
      end: new Date(p.endDate),
      type: 'project',
    })),
    
    // 인력 배치
    ...assignments.map(a => ({
      title: `[배치] ${a.userName} → ${a.projectName} (${a.allocation}%)`,
      start: new Date(a.startDate),
      end: new Date(a.endDate),
      type: 'assignment',
    })),
    
    // 마일스톤
    ...milestones.map(m => ({
      title: `[마일스톤] ${m.name}`,
      start: new Date(m.date),
      end: new Date(m.date),
      type: 'milestone',
    })),
    
    // VRB 마감일
    ...vrbDeadlines.map(v => ({
      title: `[VRB] ${v.projectName} 제출 마감`,
      start: new Date(v.deadline),
      end: new Date(v.deadline),
      type: 'deadline',
    })),
  ];
  
  return (
    <Calendar
      events={events}
      // 타입별 필터링
      components={{
        toolbar: CustomToolbar, // 필터 버튼 추가
      }}
    />
  );
}
```

**화면 예시:**
```
┌─────────────────────────────────────────────┐
│  📅 통합 일정 현황        [월|주|일|목록]    │
│  [프로젝트☑] [인력☑] [마일스톤☑] [마감일☑] │
├─────────────────────────────────────────────┤
│  2024년 3월                                  │
│  일   월   화   수   목   금   토            │
│                   1   2   3   4             │
│  5    6    7    8   9  10  11               │
│ [────P24-039──────────────]    (프로젝트)   │
│  홍길동→P24-039 (80%)          (인력)       │
│ 12  13   14   15  16  17  18               │
│      🎯 중간검토               (마일스톤)    │
│            📝 수지분석서 제출   (마감일)     │
└─────────────────────────────────────────────┘
```

---

### **4. 프로젝트 타임라인 (간트 차트)**
