# 📊 수지분석서 화면 설계 (엑셀 기반)

## 🎯 **목표**
- ✅ 엑셀 템플릿과 **동일한 구조**로 화면 구현
- ✅ 화면에서 입력한 데이터를 **엑셀로 익스포트**
- ✅ 엑셀에서 데이터를 **임포트**

---

## 📋 **수지분석서 구조 (8개 탭)**

### **엑셀 시트 → 화면 탭 매핑**

| 엑셀 시트 | 화면 탭 | 우선순위 | 상태 |
|-----------|---------|----------|------|
| 개요정보 | 수주품의 | Medium | 🔄 구현 중 |
| 프로젝트전경 | 요약 | High | ✅ 완료 |
| 수익전망 | 인력계획 | Medium | ⏳ 대기 |
| 수익성 | 수지차 | High | ✅ 완료 |
| 인건비용 | (별도 화면) | Low | ⏳ 대기 |
| 프로젝트일정 | (캘린더) | Low | ⏳ 대기 |
| 단가-인건 | 기준-단가 | High | ✅ 완료 |
| 단가-기타 | 기준-경비 | High | ✅ 완료 |

### **추가 탭 (엑셀에 없음, 화면에만 필요)**
| 화면 탭 | 용도 | 상태 |
|---------|------|------|
| 제품계획 | 제품/상품 매출 관리 | 🔄 구현 중 |

---

## 🎨 **탭별 상세 설계**

### **1. 요약 탭** (프로젝트전경 시트) ✅

#### **엑셀 구조**
```
A열: 항목명
B열: 값
C열: 계산/참조

주요 항목:
- 프로젝트명
- 고객사
- 총 매출 (=수익성!E12)
- 총 비용 (=수익성!E18)
- 순이익 (계산)
- 수익률 (계산)
```

#### **화면 구현**
```typescript
<SummaryTab>
  {/* KPI 카드 4개 */}
  <Grid cols={4}>
    <Card>총 매출: {totalRevenue}</Card>
    <Card>총 비용: {totalCost}</Card>
    <Card>순이익: {netProfit}</Card>
    <Card>수익률: {profitRate}%</Card>
  </Grid>
  
  {/* 상세 정보 */}
  <Card>
    <프로젝트 기본 정보>
  </Card>
</SummaryTab>
```

---

### **2. 수주품의 탭** (개요정보 시트) ⏳

#### **엑셀 구조**
```
항목:
- 프로젝트명
- 클라이언트
- 프로젝트 설명
- 계약 기간
- 프로젝트 담당자
- 영업 담당자
```

#### **화면 구현**
```typescript
<OrderProposalTab>
  <Card>
    <CardTitle>프로젝트 개요</CardTitle>
    <CardContent>
      <Input label="프로젝트명" />
      <Select label="고객사" />
      <Textarea label="설명" />
      <Input type="date" label="계약 시작일" />
      <Input type="date" label="계약 종료일" />
      <Select label="프로젝트 담당자" />
      <Select label="영업 담당자" />
    </CardContent>
  </Card>
</OrderProposalTab>
```

---

### **3. 수지차 탭** (수익성 시트) ✅

#### **엑셀 구조**
```
매출:
- 소프트웨어 매출 (입력)
- 하드웨어 매출 (입력)
- 총 매출 (=E4+E5)

비용:
- 인건비 (=인건비용!AK33)
- 기타 비용 (입력)
- 총 비용 (=E9+E10)

수익:
- 순이익 (=E7-E11)
- 수익률 (=E13/E7)
```

#### **화면 구현** ✅ 완료
```typescript
<ProfitabilityDiffTab>
  {/* 매출 섹션 */}
  <Card>
    <Input label="소프트웨어 매출" type="number" />
    <Input label="하드웨어 매출" type="number" />
    <AutoCalculated label="총 매출" value={totalRevenue} />
  </Card>
  
  {/* 비용 섹션 */}
  <Card>
    <Input label="인건비" type="number" />
    <Input label="기타 비용" type="number" />
    <AutoCalculated label="총 비용" value={totalCost} />
  </Card>
  
  {/* 수익 섹션 */}
  <Card variant="blue">
    <AutoCalculated label="순이익" value={netProfit} />
    <AutoCalculated label="수익률" value={profitRate} />
  </Card>
</ProfitabilityDiffTab>
```

---

### **4. 제품계획 탭** (엑셀에 없음, 신규) 🔄

#### **화면 구조** (이미지 기반)
```
표 구조:
┌─────┬────────┬────────┬──────────────────────┬──────────────────────┐
│구분 │업체명  │제품명  │     매출(5열)       │  매입(3)  │구매계약(5)│
│     │        │        │수량│단가│기준가│제안가│할인율│원가│마진│마진율│요청일│요청구분│원가│마진│마진율│
├─────┼────────┼────────┼────┼────┼──────┼──────┼──────┼────┼────┼──────┼──────┼────────┼────┼────┼──────┤
│제품 │        │        │    │    │      │      │      │    │    │      │      │        │    │    │      │
│(자사)│        │        │    │    │      │      │      │    │    │      │      │        │    │    │      │
├─────┼────────┼────────┼────┼────┼──────┼──────┼──────┼────┼────┼──────┼──────┼────────┼────┼────┼──────┤
│소계 │        │        │    │    │ 합계 │ 합계 │      │    │    │      │      │        │    │    │      │
├─────┼────────┼────────┼────┼────┼──────┼──────┼──────┼────┼────┼──────┼──────┼────────┼────┼────┼──────┤
│상품 │        │        │    │    │      │      │      │    │    │      │      │        │    │    │      │
│(타사)│        │        │    │    │      │      │      │    │    │      │      │        │    │    │      │
├─────┼────────┼────────┼────┼────┼──────┼──────┼──────┼────┼────┼──────┼──────┼────────┼────┼────┼──────┤
│소계 │        │        │    │    │ 합계 │ 합계 │      │    │    │      │      │        │    │    │      │
├─────┼────────┼────────┼────┼────┼──────┼──────┼──────┼────┼────┼──────┼──────┼────────┼────┼────┼──────┤
│합계 │        │        │    │    │ 총계 │ 총계 │      │    │    │      │      │        │    │    │      │
└─────┴────────┴────────┴────┴────┴──────┴──────┴──────┴────┴────┴──────┴──────┴────────┴────┴────┴──────┘

계산식:
- 기준가 = 수량 × 단가
- 할인율 = (기준가 - 제안가) / 기준가 × 100
```

#### **화면 구현** 🔄 진행 중
```typescript
<ProductPlanTab>
  <SectionHeader
    title="제품/상품 계획"
    description="제품(자사) / 상품(타사)의 매출 및 구매 계획"
    actions={
      <>
        <Button size="sm">제품(자사) 행 추가</Button>
        <Button size="sm">상품(타사) 행 추가</Button>
      </>
    }
  />
  
  <TableContainer>
    <Table>
      {/* 2행 헤더 구조 */}
      <TableHeader>
        <TableRow>
          <TableHead rowSpan={2}>구분</TableHead>
          <TableHead rowSpan={2}>업체명</TableHead>
          <TableHead rowSpan={2}>제품명</TableHead>
          <TableHead colSpan={5}>매출</TableHead>
          <TableHead colSpan={3}>매입</TableHead>
          <TableHead colSpan={5} variant="green">구매 계약</TableHead>
        </TableRow>
        <TableRow>
          {/* 매출 */}
          <TableHead>수량</TableHead>
          <TableHead>단가</TableHead>
          <TableHead>기준가</TableHead>
          <TableHead>제안가</TableHead>
          <TableHead>할인율</TableHead>
          {/* 매입 */}
          <TableHead>원가</TableHead>
          <TableHead>당사마진</TableHead>
          <TableHead>마진율</TableHead>
          {/* 구매 계약 */}
          <TableHead variant="green">요청일</TableHead>
          <TableHead variant="green">요청구분</TableHead>
          <TableHead variant="green">원가</TableHead>
          <TableHead variant="green">당사마진</TableHead>
          <TableHead variant="green">마진율</TableHead>
        </TableRow>
      </TableHeader>
      
      <TableBody>
        {/* 제품(자사) 행들 */}
        {/* 소계 */}
        {/* 상품(타사) 행들 */}
        {/* 소계 */}
        {/* 합계 */}
      </TableBody>
    </Table>
  </TableContainer>
</ProductPlanTab>
```

---

### **5. 인력계획 탭** (수익전망 시트) ⏳

#### **엑셀 구조**
```
구조: 28행 × 20열

월별 데이터:
┌──────┬─────┬─────┬─────┬─────┐
│월    │매출 │비용 │이익 │수익률│
├──────┼─────┼─────┼─────┼─────┤
│1월   │     │     │     │     │
│2월   │     │     │     │     │
│...   │     │     │     │     │
├──────┼─────┼─────┼─────┼─────┤
│합계  │     │     │     │     │
└──────┴─────┴─────┴─────┴─────┘

계산식:
- 이익 = 매출 - 비용
- 수익률 = 이익 / 매출 × 100
```

#### **화면 구현**
```typescript
<ManpowerPlanTab>
  <SectionHeader title="인력계획" />
  
  {/* 차트 */}
  <Card>
    <CardTitle>월별 수익 전망</CardTitle>
    <AreaChart
      data={monthlyForecast}
      categories={["매출", "비용", "이익"]}
      colors={["blue", "red", "green"]}
    />
  </Card>
  
  {/* 테이블 */}
  <TableContainer>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>월</TableHead>
          <TableHead>매출</TableHead>
          <TableHead>비용</TableHead>
          <TableHead>이익</TableHead>
          <TableHead>수익률</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {months.map(month => (
          <TableRow>
            <TableCell>{month.name}</TableCell>
            <TableCell>
              <Input type="number" value={month.revenue} />
            </TableCell>
            <TableCell>
              <Input type="number" value={month.cost} />
            </TableCell>
            <TableCell>{formatNumber(month.profit)}</TableCell>
            <TableCell>{formatPercent(month.profitRate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</ManpowerPlanTab>
```

---

### **6. 기준-단가 탭** (단가-인건 시트) ✅

#### **엑셀 구조**
```
구조: 36행 × 30열

┌──────┬──────┬──────┬──────┬──────────┬──────────┬──────────┐
│소속  │직군  │직급  │등급  │제안단가  │내부단가  │전년대비  │
│      │      │      │      │기준│적용│기준│적용│변동률    │
├──────┼──────┼──────┼──────┼──────────┼──────────┼──────────┤
│위엠비│컨설팅│과장  │특급  │30,000    │28,500    │+5%       │
│...   │      │      │      │          │          │          │
└──────┴──────┴──────┴──────┴──────────┴──────────┴──────────┘

계산식:
- 할인율 = (기준 - 적용) / 기준 × 100
- 변동률 = (올해 - 작년) / 작년 × 100
```

#### **화면 구현** ✅ 완료
- 프로젝트 시작년도 기준단가표 연동
- 읽기 전용 (Settings에서 수정)

---

### **7. 기준-경비 탭** (단가-기타 시트) ✅

#### **엑셀 구조**
```
구조: 12행 × 8열

┌──────┬──────┬──────┬────┬────┬──────┐
│구분  │구분  │구분  │기준│기준│기준액│
│  1   │  2   │  3   │ 1  │ 2  │      │
├──────┼──────┼──────┼────┼────┼──────┤
│야근  │내부  │월*인 │인당│10  │      │
│식대  │      │      │10K │    │      │
├──────┼──────┼──────┼────┼────┼──────┤
│...   │      │      │    │    │      │
└──────┴──────┴──────┴────┴────┴──────┘

계산식:
- 기준액 = 기준1 × 기준2
```

#### **화면 구현** ✅ 완료
- 9개 고정 행
- 일부 수정 가능 (1,6,7,8행의 기준2, 4,5,9행의 기준액)

---

### **8. 제품계획 탭** (신규, 엑셀에 없음) 🔄

#### **화면 구조** (이미지 기반)
```
[제품/상품 계획] 탭

표 헤더 구조:
Row 1: 구분(3) | 매출(5)      | 매입(3)    | 구매계약(5)
Row 2:          수량|단가|기준가|제안가|할인율|원가|마진|마진율|요청일|요청구분|원가|마진|마진율

데이터 행:
- 제품(자사) 구역
- 소계
- 상품(타사) 구역
- 소계
- 합계

기능:
- 제품명 선택 → 업체명/단가 자동 입력
- 기준가 자동 계산 (수량 × 단가)
- 할인율 자동 계산
- 행 추가/삭제
```

#### **화면 구현** 🔄 진행 중
- TanStack Table 사용 권장
- 제품 마스터 연동
- 자동 계산

---

## 🎯 **우선순위별 작업 계획**

### **Phase 1: 핵심 탭 완성** (이번 주)
```
✅ 1. 기준-단가 (완료)
✅ 2. 기준-경비 (완료)
✅ 3. 요약 (완료)
✅ 4. 수지차 (완료)
🔄 5. 제품계획 (진행 중)
   → 테이블 헤더 구조 완성
   → 데이터 입력/계산 로직
   → 소계/합계 로직
   → 저장 기능
```

### **Phase 2: 보조 탭** (다음 주)
```
⏳ 6. 수주품의
   → 프로젝트 기본 정보 폼
   → React Hook Form 사용
   
⏳ 7. 인력계획
   → 월별 전망 테이블
   → 차트 추가 (Recharts)
```

### **Phase 3: 엑셀 연동** (다음 주)
```
⏳ 8. 엑셀 다운로드
   → xlsx 라이브러리 사용
   → 모든 탭 데이터를 엑셀 시트로 변환
   → 다운로드 버튼 추가
   
⏳ 9. 엑셀 업로드 (선택)
   → 엑셀 파일 업로드
   → 데이터 파싱
   → DB 저장
```

---

## 📊 **엑셀 익스포트 구조**

### **수지분석서 → 엑셀 매핑**

```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (profitability: ProfitabilityData) => {
  const wb = XLSX.utils.book_new();
  
  // 1. 요약 시트
  const summaryData = [
    ['항목', '값'],
    ['프로젝트명', profitability.projectName],
    ['고객사', profitability.customerName],
    ['총 매출', profitability.totalRevenue],
    ['총 비용', profitability.totalCost],
    ['순이익', profitability.netProfit],
    ['수익률', `${profitability.profitRate}%`],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '요약');
  
  // 2. 수주품의 시트
  const proposalData = [
    ['프로젝트명', profitability.projectName],
    ['고객사', profitability.customerName],
    ['계약 시작일', profitability.contractStartDate],
    ['계약 종료일', profitability.contractEndDate],
  ];
  const wsProposal = XLSX.utils.aoa_to_sheet(proposalData);
  XLSX.utils.book_append_sheet(wb, wsProposal, '수주품의');
  
  // 3. 수지차 시트
  const diffData = [
    ['구분', '항목', '금액'],
    ['매출', '소프트웨어', profitability.softwareRevenue],
    ['매출', '하드웨어', profitability.hardwareRevenue],
    ['매출', '합계', profitability.totalRevenue],
    ['비용', '인건비', profitability.laborCost],
    ['비용', '기타', profitability.otherCost],
    ['비용', '합계', profitability.totalCost],
    ['수익', '순이익', profitability.netProfit],
    ['수익', '수익률', `${profitability.profitRate}%`],
  ];
  const wsDiff = XLSX.utils.aoa_to_sheet(diffData);
  XLSX.utils.book_append_sheet(wb, wsDiff, '수지차');
  
  // 4. 제품계획 시트
  const productData = profitability.productItems.map(item => ({
    '구분': item.type,
    '업체명': item.companyName,
    '제품명': item.productName,
    '수량': item.quantity,
    '단가': item.unitPrice,
    '기준가': item.basePrice,
    '제안가': item.proposalPrice,
    '할인율': `${item.discountRate.toFixed(2)}%`,
    '요청일': item.requestDate,
    '요청구분': item.requestType,
  }));
  const wsProduct = XLSX.utils.json_to_sheet(productData);
  XLSX.utils.book_append_sheet(wb, wsProduct, '제품계획');
  
  // 5. 기준-단가 시트
  const unitPriceData = profitability.unitPrices.map(up => ({
    '소속': up.affiliationGroup,
    '직군': up.jobGroup,
    '직급': up.jobLevel,
    '등급': up.grade,
    '제안단가(기준)': up.proposedStandard,
    '제안단가(적용)': up.proposedApplied,
    '내부단가(적용)': up.internalApplied,
  }));
  const wsUnitPrice = XLSX.utils.json_to_sheet(unitPriceData);
  XLSX.utils.book_append_sheet(wb, wsUnitPrice, '기준-단가');
  
  // 6. 기준-경비 시트
  const expenseData = profitability.expenses.map(exp => ({
    '항목': exp.item,
    '구분': exp.category,
    '기준': exp.standardDetail,
    '기준액': exp.finalAmount,
  }));
  const wsExpense = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(wb, wsExpense, '기준-경비');
  
  // 7. 인력계획 시트
  const forecastData = profitability.monthlyForecast.map(m => ({
    '월': m.month,
    '매출': m.revenue,
    '비용': m.cost,
    '이익': m.profit,
    '수익률': `${m.profitRate}%`,
  }));
  const wsForecast = XLSX.utils.json_to_sheet(forecastData);
  XLSX.utils.book_append_sheet(wb, wsForecast, '인력계획');
  
  // 다운로드
  const filename = `수지분석서_${profitability.projectCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// 다운로드 버튼
<Button variant="secondary">
  <Download className="h-4 w-4" />
  엑셀 다운로드
</Button>
```

---

## 📈 **정산서 화면 설계**

### **정산서 구조** (6개 탭)

| 엑셀 시트 | 화면 탭 | 설명 |
|-----------|---------|------|
| P24-039 | 정산 메인 | 프로젝트 정산 상세 |
| 2014년 표준단가 | 단가 참조 | 표준단가 참조 (읽기) |

### **정산서 화면 탭**
```
1. 정산 요약
2. 매출 내역
3. 비용 내역
4. 인건비 상세
5. 기타 비용
6. 비교 (수지분석서 vs 실적)
```

---

## 🎯 **현재 진행 상황**

### **완료** ✅
```
✅ 요약 탭 (프로젝트전경)
✅ 수지차 탭 (수익성)
✅ 기준-단가 탭 (단가-인건)
✅ 기준-경비 탭 (단가-기타)
✅ 공통 UI 컴포넌트 (7개)
✅ 라이브러리 설치 (9개)
```

### **진행 중** 🔄
```
🔄 제품계획 탭
   - 테이블 구조 완성
   - 제품 마스터 연동
   - 자동 계산 로직
   - 저장 기능 필요
```

### **대기** ⏳
```
⏳ 수주품의 탭
⏳ 인력계획 탭
⏳ 엑셀 다운로드
⏳ 정산서 화면
```

---

## 🚀 **다음 작업**

### **1. 제품계획 탭 완성** (우선)
```typescript
// TODO:
1. [ ] 테이블 스타일 최종 조정
2. [ ] 소계/합계 행 스타일
3. [ ] 저장 API 연동
4. [ ] 데이터 로딩
5. [ ] 엑셀 다운로드 버튼
```

### **2. 나머지 탭 구현**
```typescript
// 수주품의
- 폼 구조
- React Hook Form 사용
- 저장 기능

// 인력계획
- 월별 테이블
- 차트 (Recharts)
- 자동 계산
```

### **3. 엑셀 연동**
```typescript
// 다운로드
- xlsx 라이브러리 사용
- 모든 탭 데이터 포함
- 엑셀 형식 맞춤

// 업로드 (선택)
- 파일 선택/드롭
- 데이터 파싱
- DB 저장
```

---

## 📋 **데이터 구조 (DB 테이블 필요)**

### **현재 있는 테이블**
```
✅ we_projects
✅ we_project_profitability (헤더)
✅ we_project_profitability_standard_expenses (기준-경비)
✅ we_unit_prices (기준-단가)
✅ we_products (제품 마스터)
```

### **추가 필요 테이블**
```
⏳ we_project_product_plan (제품계획)
   - project_id
   - type (자사/타사)
   - product_id
   - company_name
   - product_name
   - quantity
   - unit_price
   - base_price
   - proposal_price
   - request_date
   - request_type
   
⏳ we_project_monthly_forecast (인력계획 - 월별 전망)
   - project_id
   - month (YYYY-MM)
   - revenue
   - cost
   - profit
   - profit_rate
```

---

## 🎯 **최종 목표**

```
화면 입력 → DB 저장 → 엑셀 다운로드
          ↑
엑셀 업로드 → DB 저장 → 화면 표시
```

---

**다음**: 제품계획 탭 완성 후 엑셀 다운로드 기능 추가! 🚀
