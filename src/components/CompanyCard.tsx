import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScoreCard } from '../types';
import { getGrade, getRiskColor, formatKRW } from '../utils/format';
import { colors, fontSize, spacing, borderRadius, shadow } from '../utils/theme';

interface CompanyCardProps {
  scoreCard: ScoreCard;
  onPress: () => void;
}

export function CompanyCard({ scoreCard, onPress }: CompanyCardProps) {
  const { company, totalScore, scores, analysis, metrics, rank } = scoreCard;
  const { grade, color: gradeColor } = getGrade(totalScore);
  const latestRevenue = metrics.revenue[metrics.revenue.length - 1];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{company.corpName}</Text>
          <Text style={styles.stockCode}>
            {company.stockCode} · {company.market}
          </Text>
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '20', borderColor: gradeColor }]}>
          <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
          <Text style={[styles.scoreText, { color: gradeColor }]}>{totalScore}점</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricPill label="매출" value={latestRevenue ? formatKRW(latestRevenue.value) : '-'} />
        <MetricPill
          label="영업이익률"
          value={`${metrics.operatingMargin[metrics.operatingMargin.length - 1]?.value.toFixed(1) ?? '-'}%`}
        />
        <MetricPill
          label="오너리스크"
          value={analysis.ownerRisk.level === 'low' ? '낮음' : analysis.ownerRisk.level === 'medium' ? '중간' : '높음'}
          valueColor={getRiskColor(analysis.ownerRisk.level)}
        />
      </View>

      <View style={styles.scoreBarContainer}>
        <MiniBar label="성장" score={scores.revenueGrowth} max={15} />
        <MiniBar label="수익" score={scores.profitability} max={15} />
        <MiniBar label="현금" score={scores.cashFlowQuality} max={15} />
        <MiniBar label="부채" score={scores.debtLevel} max={10} />
        <MiniBar label="환원" score={scores.shareholderReturn} max={15} />
        <MiniBar label="촉매" score={scores.catalystStrength} max={10} />
      </View>
    </TouchableOpacity>
  );
}

function MetricPill({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function MiniBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? colors.scoreHigh : pct >= 40 ? colors.scoreMid : colors.scoreLow;

  return (
    <View style={styles.miniBarContainer}>
      <Text style={styles.miniBarLabel}>{label}</Text>
      <View style={styles.miniBarBg}>
        <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  stockCode: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  gradeBadge: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  scoreText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricPill: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  miniBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  miniBarLabel: {
    color: colors.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  miniBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
