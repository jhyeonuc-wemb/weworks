// 마스터 데이터 상수 정의

export const AFFILIATION_GROUPS = [
  "위엠비_컨설팅",
  "위엠비_개발",
  "외주_컨설팅",
  "외주_개발",
] as const;

export const JOB_GROUPS = [
  "컨설팅",
  "개발",
  "컨_특",
  "컨_고",
  "컨_중",
  "컨_초",
  "개_특",
  "개_고",
  "개_중",
  "개_초",
] as const;

export const JOB_LEVELS = [
  "상무",
  "이사",
  "수석(L)",
  "부장",
  "차부장",
  "수석(S)",
  "차장",
  "책임(M)",
  "과장",
  "책임(A)",
  "대리",
  "사원",
] as const;

export const GRADES = ["특급", "고급", "중급", "초급"] as const;

export const REQUEST_TYPES = ["예정", "계약(정상)", "계약(변경)", "취소"] as const;

export const PROFITABILITY_STATUS = [
  "draft",
  "review",
  "approved",
  "rejected",
  "completed",
] as const;

export const VRB_STATUS = ["draft", "review", "approved", "rejected"] as const;

export const CURRENCIES = ["KRW", "USD", "EUR", "JPY"] as const;

// 타입 추론
export type AffiliationGroup = (typeof AFFILIATION_GROUPS)[number];
export type JobGroup = (typeof JOB_GROUPS)[number];
export type JobLevel = (typeof JOB_LEVELS)[number];
export type Grade = (typeof GRADES)[number];
export type RequestType = (typeof REQUEST_TYPES)[number];
export type ProfitabilityStatus = (typeof PROFITABILITY_STATUS)[number];
export type VrbStatus = (typeof VRB_STATUS)[number];
export type Currency = (typeof CURRENCIES)[number];

// 기본 초기 경비 데이터
export const DEFAULT_STANDARD_EXPENSES = [
  {
    id: 1,
    item: "야근식대",
    category: "내부",
    standardType: "월*인",
    standardDetail: "인당 10,000원/일",
    inputValue: 10,
    calculatedValue: 0,
    finalAmount: 0,
  },
  {
    id: 2,
    item: "프로젝트부서비",
    category: "내부",
    standardType: "월*인",
    standardDetail: "인당 25,000원",
    inputValue: null,
    calculatedValue: 25,
    finalAmount: 25,
  },
  {
    id: 3,
    item: "프로젝트부서비",
    category: "외주",
    standardType: "월*인",
    standardDetail: "인당 25,000원",
    inputValue: null,
    calculatedValue: 25,
    finalAmount: 25,
  },
  {
    id: 4,
    item: "워크샵",
    category: "",
    standardType: "횟수*인",
    standardDetail: "1인당 50,000원, 분기당 1회 이내",
    inputValue: null,
    calculatedValue: null,
    finalAmount: 0,
  },
  {
    id: 5,
    item: "Kick-Off 비용",
    category: "",
    standardType: "횟수*인",
    standardDetail: "1인당 150,000원, 시작월 및 종료월",
    inputValue: null,
    calculatedValue: null,
    finalAmount: 0,
  },
  {
    id: 6,
    item: "지방 임차비",
    category: null,
    standardType: null,
    standardDetail: "인당 50,000원/일",
    inputValue: 50,
    calculatedValue: 0, // Default for ID 6
    finalAmount: 0,
  },
  {
    id: 7,
    item: "지방 출장비(월 22일 기준 일 20,000원 반영)",
    category: null,
    standardType: null,
    standardDetail: "인당 20,000원/일",
    inputValue: 20,
    calculatedValue: 0, // Default for ID 7
    finalAmount: 0,
  },
  {
    id: 8,
    item: "출장교통비 - 항공권,KTX,렌터카,주유비 등",
    category: null,
    standardType: null,
    standardDetail: "인당 100,000원/일",
    inputValue: 100,
    calculatedValue: 0,
    finalAmount: 0,
  },
  {
    id: 9,
    item: "기타",
    category: null,
    standardType: null,
    standardDetail: "사무실 임대 또는 PM의 의사결정에 의한 경비",
    inputValue: null,
    calculatedValue: null,
    finalAmount: 0,
  },
] as const;
