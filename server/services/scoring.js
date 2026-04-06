/**
 * Server-side scoring engine
 * Mirrors the client-side scoring logic for consistency
 */
class ScoringService {
  calculateScoreCard(company, metrics, analysis) {
    const scores = {
      revenueGrowth: this.scoreRevenueGrowth(metrics),
      profitability: this.scoreProfitability(metrics),
      cashFlowQuality: this.scoreCashFlowQuality(metrics),
      debtLevel: this.scoreDebtLevel(metrics),
      shareholderReturn: this.scoreShareholderReturn(metrics),
      ownerRisk: this.scoreOwnerRisk(analysis),
      catalystStrength: this.scoreCatalystStrength(analysis),
      counterArgumentRisk: this.scoreCounterArgumentRisk(analysis),
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

  rankResults(results) {
    return results
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((card, index) => ({ ...card, rank: index + 1 }));
  }

  scoreRevenueGrowth(metrics) {
    const revenues = metrics.revenue;
    if (!revenues || revenues.length < 2) return 5;

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

  scoreProfitability(metrics) {
    const margins = metrics.operatingMargin;
    if (!margins || margins.length === 0) return 5;

    const latest = margins[margins.length - 1].value;
    const avg = margins.reduce((sum, m) => sum + m.value, 0) / margins.length;

    let score = 0;
    if (avg >= 20) score = 12;
    else if (avg >= 15) score = 10;
    else if (avg >= 10) score = 8;
    else if (avg >= 5) score = 6;
    else if (avg >= 0) score = 4;
    else score = 2;

    if (margins.length >= 2 && latest > margins[0].value) {
      score = Math.min(15, score + 2);
    }
    if (margins.length >= 2 && latest < margins[0].value) {
      score = Math.max(0, score - 1);
    }

    return score;
  }

  scoreCashFlowQuality(metrics) {
    const ocf = metrics.operatingCashFlow;
    const capex = metrics.capex;
    if (!ocf || ocf.length === 0) return 5;

    let positiveFCFYears = 0;
    for (let i = 0; i < ocf.length; i++) {
      const capexVal = capex?.[i]?.value || 0;
      const fcf = ocf[i].value - Math.abs(capexVal);
      if (fcf > 0) positiveFCFYears++;
    }

    const fcfRatio = positiveFCFYears / ocf.length;
    let score;
    if (fcfRatio >= 0.8) score = 12;
    else if (fcfRatio >= 0.6) score = 9;
    else if (fcfRatio >= 0.4) score = 6;
    else score = 3;

    if (ocf.length >= 2) {
      const first = ocf[0].value;
      const last = ocf[ocf.length - 1].value;
      if (last > first && first > 0) score = Math.min(15, score + 2);
    }

    return score;
  }

  scoreDebtLevel(metrics) {
    const debts = metrics.netDebt;
    if (!debts || debts.length === 0) return 5;

    const latest = debts[debts.length - 1].value;
    const revenue = metrics.revenue?.[metrics.revenue.length - 1]?.value || 1;
    const debtToRevenue = latest / revenue;

    if (latest <= 0) return 10;
    if (debtToRevenue < 0.3) return 8;
    if (debtToRevenue < 0.5) return 6;
    if (debtToRevenue < 1.0) return 4;
    if (debtToRevenue < 2.0) return 2;
    return 1;
  }

  scoreShareholderReturn(metrics) {
    let score = 0;

    if (metrics.dividend) {
      if (metrics.dividend.dividendYield >= 3) score += 5;
      else if (metrics.dividend.dividendYield >= 2) score += 4;
      else if (metrics.dividend.dividendYield >= 1) score += 3;
      else if (metrics.dividend.dividendYield > 0) score += 1;
    }

    if (metrics.treasuryStock) {
      if (metrics.treasuryStock.percentOfTotal >= 5) score += 5;
      else if (metrics.treasuryStock.percentOfTotal >= 2) score += 3;
      else if (metrics.treasuryStock.percentOfTotal > 0) score += 1;
    }

    if (metrics.shareCountChange) {
      if (metrics.shareCountChange.trend === 'decreasing') score += 5;
      else if (metrics.shareCountChange.trend === 'stable') score += 3;
    }

    return Math.min(15, score);
  }

  scoreOwnerRisk(analysis) {
    if (!analysis?.ownerRisk) return 5;
    switch (analysis.ownerRisk.level) {
      case 'low': return 10;
      case 'medium': return 6;
      case 'high': return 2;
      default: return 5;
    }
  }

  scoreCatalystStrength(analysis) {
    const count = analysis?.catalysts?.length || 0;
    if (count >= 4) return 10;
    if (count >= 3) return 8;
    if (count >= 2) return 6;
    if (count >= 1) return 4;
    return 2;
  }

  scoreCounterArgumentRisk(analysis) {
    const count = analysis?.counterArguments?.length || 0;
    if (count === 0) return 10;
    if (count === 1) return 8;
    if (count === 2) return 6;
    if (count === 3) return 4;
    return 2;
  }
}

module.exports = new ScoringService();
