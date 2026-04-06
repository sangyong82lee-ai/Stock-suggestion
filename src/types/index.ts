// === Company & Financial Data Types ===

export interface Company {
  corpCode: string;       // DART 고유번호
  corpName: string;       // 회사명
  stockCode: string;      // 종목코드
  sector?: string;        // 업종
  market?: string;        // 시장구분 (KOSPI/KOSDAQ)
}

export interface FinancialMetrics {
  // 매출 (3년)
  revenue: YearlyData[];
  // 영업이익률 (3년)
  operatingMargin: YearlyData[];
  // 영업현금흐름
  operatingCashFlow: YearlyData[];
  // 자본적 지출
  capex: YearlyData[];
  // 순차입금
  netDebt: YearlyData[];
  // 주식수 변화
  shareCountChange: ShareCountData;
  // 자사주
  treasuryStock: TreasuryStockData;
  // 배당
  dividend: DividendData;
}

export interface YearlyData {
  year: string;
  value: number;
  unit: string;
}

export interface ShareCountData {
  currentShares: number;
  previousShares: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TreasuryStockData {
  shares: number;
  percentOfTotal: number;
  recentActivity: string;
}

export interface DividendData {
  dividendPerShare: number;
  dividendYield: number;
  payoutRatio: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// === AI Analysis Types ===

export interface AIAnalysis {
  ownerRisk: RiskAssessment;
  catalysts: string[];
  counterArguments: string[];
  summary: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  description: string;
}

// === Scorecard Types ===

export interface ScoreCard {
  company: Company;
  metrics: FinancialMetrics;
  analysis: AIAnalysis;
  scores: ScoreBreakdown;
  totalScore: number;
  rank?: number;
  analyzedAt: string;
}

export interface ScoreBreakdown {
  revenueGrowth: number;       // 0-15
  profitability: number;       // 0-15
  cashFlowQuality: number;     // 0-15
  debtLevel: number;           // 0-10
  shareholderReturn: number;   // 0-15
  ownerRisk: number;           // 0-10
  catalystStrength: number;    // 0-10
  counterArgumentRisk: number; // 0-10
}

export const MAX_SCORES: ScoreBreakdown = {
  revenueGrowth: 15,
  profitability: 15,
  cashFlowQuality: 15,
  debtLevel: 10,
  shareholderReturn: 15,
  ownerRisk: 10,
  catalystStrength: 10,
  counterArgumentRisk: 10,
};

export const TOTAL_MAX_SCORE = 100;

// === API Types ===

export interface DartReportResponse {
  status: string;
  message: string;
  list: DartReport[];
}

export interface DartReport {
  rcept_no: string;
  rcept_dt: string;
  report_nm: string;
  flr_nm: string;
  corp_code: string;
  corp_name: string;
}

export interface ScreeningJob {
  id: string;
  status: 'pending' | 'collecting' | 'analyzing' | 'scoring' | 'completed' | 'error';
  progress: number;
  totalCompanies: number;
  processedCompanies: number;
  results: ScoreCard[];
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// === Settings Types ===

export interface AppSettings {
  serverUrl: string;
  dartApiKey: string;
  openaiApiKey: string;
  maxCompanies: number;
  autoRefreshInterval: number; // minutes
  market: 'all' | 'kospi' | 'kosdaq';
}

export const DEFAULT_SETTINGS: AppSettings = {
  serverUrl: 'http://localhost:3001',
  dartApiKey: '',
  openaiApiKey: '',
  maxCompanies: 100,
  autoRefreshInterval: 60,
  market: 'all',
};
