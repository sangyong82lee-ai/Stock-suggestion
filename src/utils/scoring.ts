import { FinancialMetrics, AIAnalysis, ScoreBreakdown, ScoreCard, Company } from '../types';

/**
 * 매출 성장률 점수 (0-15)
 * 3년간 매출 성장 추세 평가
 */
function scoreRevenueGrowth(metrics: FinancialMetrics): number {
  const revenues = metrics.revenue;
  if (revenues.length < 2) return 5;

  const sorted = [...revenues].sort((a, b) => a.year.localeCompare(b.year));
  let totalGrowth = 0;
  let periods = 0;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1].value > 0) {
      totalGrowth += (sorted[i].value - sorted[i - 1].value) / sorted[i - 1].value;
      periods++;
    }
  }

  if (periods === 0) return 5;
  const avgGrowth = totalGrowth / periods;

  if (avgGrowth >= 0.20) return 15;
  if (avgGrowth >= 0.15) return 13;
  if (avgGrowth >= 0.10) return 11;
  if (avgGrowth >= 0.05) return 9;
  if (avgGrowth >= 0.00) return 7;
  if (avgGrowth >= -0.05) return 4;
  return 2;
}

/**
 * 수익성 점수 (0-15)
 * 영업이익률 수준 및 추세
 */
function scoreProfitability(metrics: FinancialMetrics): number {
  const margins = metrics.operatingMargin;
  if (margins.length === 0) return 5;

  const latest = margins[margins.length - 1].value;
  const avg = margins.reduce((sum, m) => sum + m.value, 0) / margins.length;

  let score = 0;
  // 최근 영업이익률 수준
  if (avg >= 20) score = 12;
  else if (avg >= 15) score = 10;
  else if (avg >= 10) score = 8;
  else if (avg >= 5) score = 6;
  else if (avg >= 0) score = 4;
  else score = 2;

  // 개선 추세 보너스
  if (margins.length >= 2 && latest > margins[0].value) {
    score = Math.min(15, score + 2);
  }
  // 악화 추세 감점
  if (margins.length >= 2 && latest < margins[0].value) {
    score = Math.max(0, score - 1);
  }

  return score;
}

/**
 * 현금흐름 품질 점수 (0-15)
 * OCF vs CAPEX, Free Cash Flow 평가
 */
function scoreCashFlowQuality(metrics: FinancialMetrics): number {
  const ocf = metrics.operatingCashFlow;
  const capex = metrics.capex;

  if (ocf.length === 0) return 5;

  let score = 0;
  let positiveFCFYears = 0;

  for (let i = 0; i < ocf.length; i++) {
    const capexVal = capex[i]?.value || 0;
    const fcf = ocf[i].value - Math.abs(capexVal);
    if (fcf > 0) positiveFCFYears++;
  }

  // FCF 양수 연도 비율
  const fcfRatio = positiveFCFYears / ocf.length;
  if (fcfRatio >= 0.8) score = 12;
  else if (fcfRatio >= 0.6) score = 9;
  else if (fcfRatio >= 0.4) score = 6;
  else score = 3;

  // OCF 성장 보너스
  if (ocf.length >= 2) {
    const first = ocf[0].value;
    const last = ocf[ocf.length - 1].value;
    if (last > first && first > 0) score = Math.min(15, score + 2);
  }

  return score;
}

/**
 * 부채 수준 점수 (0-10)
 * 순차입금 수준 평가
 */
function scoreDebtLevel(metrics: FinancialMetrics): number {
  const debts = metrics.netDebt;
  if (debts.length === 0) return 5;

  const latest = debts[debts.length - 1].value;
  const revenue = metrics.revenue[metrics.revenue.length - 1]?.value || 1;

  const debtToRevenue = latest / revenue;

  // 순현금(음수)이면 최고점
  if (latest <= 0) return 10;
  if (debtToRevenue < 0.3) return 8;
  if (debtToRevenue < 0.5) return 6;
  if (debtToRevenue < 1.0) return 4;
  if (debtToRevenue < 2.0) return 2;
  return 1;
}

/**
 * 주주환원 점수 (0-15)
 * 자사주 + 배당 + 주식수 변화
 */
function scoreShareholderReturn(metrics: FinancialMetrics): number {
  let score = 0;

  // 배당 (0-5)
  if (metrics.dividend.dividendYield >= 3) score += 5;
  else if (metrics.dividend.dividendYield >= 2) score += 4;
  else if (metrics.dividend.dividendYield >= 1) score += 3;
  else if (metrics.dividend.dividendYield > 0) score += 1;

  // 자사주 (0-5)
  if (metrics.treasuryStock.percentOfTotal >= 5) score += 5;
  else if (metrics.treasuryStock.percentOfTotal >= 2) score += 3;
  else if (metrics.treasuryStock.percentOfTotal > 0) score += 1;

  // 주식수 변화 (0-5)
  if (metrics.shareCountChange.trend === 'decreasing') score += 5;
  else if (metrics.shareCountChange.trend === 'stable') score += 3;
  else score += 0; // 증가는 감점

  return Math.min(15, score);
}

/**
 * 오너 리스크 점수 (0-10)
 * 높을수록 리스크 낮음
 */
function scoreOwnerRisk(analysis: AIAnalysis): number {
  switch (analysis.ownerRisk.level) {
    case 'low': return 10;
    case 'medium': return 6;
    case 'high': return 2;
    default: return 5;
  }
}

/**
 * 촉매 강도 점수 (0-10)
 */
function scoreCatalystStrength(analysis: AIAnalysis): number {
  const count = analysis.catalysts.length;
  if (count >= 4) return 10;
  if (count >= 3) return 8;
  if (count >= 2) return 6;
  if (count >= 1) return 4;
  return 2;
}

/**
 * 반대논리 리스크 점수 (0-10)
 * 반대논리가 적을수록 높은 점수
 */
function scoreCounterArgumentRisk(analysis: AIAnalysis): number {
  const count = analysis.counterArguments.length;
  if (count === 0) return 10;
  if (count === 1) return 8;
  if (count === 2) return 6;
  if (count === 3) return 4;
  return 2;
}

/**
 * 전체 스코어 계산
 */
export function calculateScores(
  company: Company,
  metrics: FinancialMetrics,
  analysis: AIAnalysis
): ScoreCard {
  const scores: ScoreBreakdown = {
    revenueGrowth: scoreRevenueGrowth(metrics),
    profitability: scoreProfitability(metrics),
    cashFlowQuality: scoreCashFlowQuality(metrics),
    debtLevel: scoreDebtLevel(metrics),
    shareholderReturn: scoreShareholderReturn(metrics),
    ownerRisk: scoreOwnerRisk(analysis),
    catalystStrength: scoreCatalystStrength(analysis),
    counterArgumentRisk: scoreCounterArgumentRisk(analysis),
  };

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);

  return {
    company,
    metrics,
    analysis,
    scores,
    totalScore,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * 스코어카드 배열을 정렬하고 순위 부여
 */
export function rankScoreCards(cards: ScoreCard[]): ScoreCard[] {
  return cards
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((card, index) => ({ ...card, rank: index + 1 }));
}
