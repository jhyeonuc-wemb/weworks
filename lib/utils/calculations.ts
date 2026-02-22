// 자동 계산 유틸리티 함수들

/**
 * 총 매출 계산
 */
export function calculateTotalRevenue(
  softwareRevenue: number,
  hardwareRevenue: number
): number {
  return softwareRevenue + hardwareRevenue;
}

/**
 * 총 비용 계산
 */
export function calculateTotalCost(
  laborCost: number,
  otherCost: number
): number {
  return laborCost + otherCost;
}

/**
 * 순이익 계산
 */
export function calculateNetProfit(
  totalRevenue: number,
  totalCost: number
): number {
  return totalRevenue - totalCost;
}

/**
 * 수익률 계산 (%)
 */
export function calculateProfitRate(
  totalRevenue: number,
  netProfit: number
): number {
  if (totalRevenue === 0) return 0;
  return (netProfit / totalRevenue) * 100;
}

/**
 * MD 총합 계산
 */
export function calculateTotalMd(
  personnelCount: number,
  mdPerPerson: number
): number {
  return personnelCount * mdPerPerson;
}

/**
 * 인건비 계산 (시간 × 단가)
 */
export function calculateLaborCost(
  hours: number,
  hourlyRate: number
): number {
  return hours * hourlyRate;
}

/**
 * 월별 인건비 합계
 */
export function calculateMonthlyLaborCost(
  allocations: Array<{ hours: number; hourlyRate: number }>
): number {
  return allocations.reduce(
    (sum, alloc) => sum + calculateLaborCost(alloc.hours, alloc.hourlyRate),
    0
  );
}

/**
 * 수지분석 전체 요약 계산
 */
export function calculateProfitabilitySummary(
  manpowerItems: any[],
  productItems: any[],
  expenseItems: any[],
  extraRevenue: number = 0,
  extraExpense: number = 0
) {
  // 1. 용역 (Service) 데이터 분류 및 합산
  const srvInternalItems = manpowerItems.filter(i => !i.affiliationGroup?.startsWith("외주"));
  const srvExternalItems = manpowerItems.filter(i => i.affiliationGroup?.startsWith("외주"));

  const srvInternalMM = srvInternalItems.reduce((sum: number, i) => sum + Object.values(i.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0), 0);
  const srvExternalMM = srvExternalItems.reduce((sum: number, i) => sum + Object.values(i.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0), 0);

  const srvInternalProposal = srvInternalItems.reduce((sum: number, i) => {
    if (i.proposedAmount !== null && i.proposedAmount !== undefined) return sum + i.proposedAmount;
    const totalMM = Object.values(i.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
    return sum + Math.round(totalMM * (i.proposedUnitPrice || 0));
  }, 0);

  const srvExternalProposal = srvExternalItems.reduce((sum: number, i) => {
    if (i.proposedAmount !== null && i.proposedAmount !== undefined) return sum + i.proposedAmount;
    const totalMM = Object.values(i.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
    return sum + Math.round(totalMM * (i.proposedUnitPrice || 0));
  }, 0);

  const srvInternalCost = srvInternalItems.reduce((sum: number, i) => {
    // 당사 인력은 무조건 자동 계산 (M/M * 단가) - 저장된 internalAmount 무시 (찌꺼기 데이터 방지)
    const totalMM = Object.values(i.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
    return sum + Math.round(totalMM * (i.internalUnitPrice || 0));
  }, 0);

  const srvExternalCost = srvExternalItems.reduce((sum: number, i) => {
    // 외주 인력은 저장된 금액 우선 사용
    if (i.internalAmount !== null && i.internalAmount !== undefined) return sum + i.internalAmount;
    const totalMM = Object.values(i.monthlyAllocation || {}).reduce((s: number, v) => s + (Number(v) || 0), 0);
    return sum + Math.round(totalMM * (i.internalUnitPrice || 0));
  }, 0);

  // 지연 비용 (0%)
  const delayRate = 0.00;
  const srvInternalDelay = Math.round(srvInternalCost * delayRate);
  const srvExternalDelay = Math.round(srvExternalCost * delayRate);

  // 경비
  const expGeneral = expenseItems
    .filter(i => i.category === "일반경비")
    .reduce((sum: number, i) => sum + Object.values(i.monthlyValues || {}).reduce((s: number, v) => s + (Number(v) || 0), 0), 0);

  const expSpecial = expenseItems
    .filter(i => i.category === "특별경비")
    .reduce((sum: number, i) => sum + Object.values(i.monthlyValues || {}).reduce((s: number, v) => s + (Number(v) || 0), 0), 0);

  const srvTotalProposal = srvInternalProposal + srvExternalProposal;
  const srvTotalCost = srvInternalCost + srvExternalCost + srvInternalDelay + srvExternalDelay + expGeneral + expSpecial;
  const srvTotalProfit = srvTotalProposal - srvTotalCost;

  // 2. 제품 (Product) 데이터 분류 및 합산
  const prdInternalProposal = productItems
    .filter(i => i.type === "자사")
    .reduce((sum, i) => sum + (i.proposalPrice || 0), 0);

  const prdInternalCost = productItems
    .filter(i => i.type === "자사")
    .reduce((sum, i) => sum + (i.costPrice || 0), 0);

  const prdExternalProposal = productItems
    .filter(i => i.type === "타사")
    .reduce((sum, i) => sum + (i.proposalPrice || 0), 0);

  const prdExternalCost = productItems
    .filter(i => i.type === "타사")
    .reduce((sum, i) => sum + (i.costPrice || 0), 0);

  const prdTotalProposal = prdInternalProposal + prdExternalProposal;
  const prdTotalCost = prdInternalCost + prdExternalCost;
  const prdTotalProfit = prdTotalProposal - prdTotalCost;

  // 3. 전체 합계
  const totalRevenue = srvTotalProposal + prdTotalProposal;
  const totalCostBeforeExtra = srvTotalCost + prdTotalCost;
  const coreProfit = totalRevenue - totalCostBeforeExtra;

  // 부가 수익/비용 반영
  const netProfit = coreProfit + extraRevenue - extraExpense;
  const profitRate = totalRevenue === 0 ? 0 : (netProfit / totalRevenue) * 100;

  return {
    srv: {
      internal: { mm: srvInternalMM, proposal: srvInternalProposal, cost: srvInternalCost, delay: srvInternalDelay, special: expSpecial, general: expGeneral },
      external: { mm: srvExternalMM, proposal: srvExternalProposal, cost: srvExternalCost, delay: srvExternalDelay },
      total: { proposal: srvTotalProposal, cost: srvTotalCost, profit: srvTotalProfit }
    },
    prd: {
      internal: { proposal: prdInternalProposal, cost: prdInternalCost },
      external: { proposal: prdExternalProposal, cost: prdExternalCost },
      total: { proposal: prdTotalProposal, cost: prdTotalCost, profit: prdTotalProfit }
    },
    totalRevenue,
    totalCost: totalRevenue - netProfit,
    netProfit,
    profitRate,
    coreProfit,
    extraRevenue,
    extraExpense,
    ourMm: srvInternalMM,
    othersMm: srvExternalMM
  };
}
