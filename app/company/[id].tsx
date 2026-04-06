import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { ScoreBar } from '../../src/components/ScoreBar';
import { MAX_SCORES } from '../../src/types';
import {
  getGrade,
  getRiskColor,
  formatKRW,
  formatPercent,
  getTrendIcon,
} from '../../src/utils/format';
import { colors, fontSize, spacing, borderRadius, shadow } from '../../src/utils/theme';

const SCORE_LABELS: Record<string, string> = {
  revenueGrowth: '매출 성장',
  profitability: '수익성',
  cashFlowQuality: '현금흐름 품질',
  debtLevel: '부채 수준',
  shareholderReturn: '주주 환원',
  ownerRisk: '오너 리스크',
  catalystStrength: '촉매 강도',
  counterArgumentRisk: '반대논리 리스크',
};

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const scoreCard = state.scoreCards.find((sc) => sc.company.corpCode === id);

  if (!scoreCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>기업 데이터를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { company, metrics, analysis, scores, totalScore } = scoreCard;
  const { grade, color: gradeColor } = getGrade(totalScore);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={isTablet ? styles.tabletLayout : undefined}>
          {/* Left Column */}
          <View style={isTablet ? styles.tabletColumn : undefined}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.companyName}>{company.corpName}</Text>
                <Text style={styles.stockCode}>
                  {company.stockCode} · {company.market || 'KRX'}
                </Text>
              </View>
              <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
                <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
                <Text style={[styles.totalScore, { color: gradeColor }]}>{totalScore}/100</Text>
              </View>
            </View>

            {/* Score Breakdown */}
            <Section title="점수 상세">
              {Object.entries(scores).map(([key, value]) => (
                <ScoreBar
                  key={key}
                  label={SCORE_LABELS[key] || key}
                  score={value as number}
                  maxScore={MAX_SCORES[key as keyof typeof MAX_SCORES]}
                />
              ))}
            </Section>

            {/* Revenue Trend */}
            <Section title="매출 추이">
              {metrics.revenue.map((r) => (
                <View key={r.year} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{r.year}</Text>
                  <Text style={styles.dataValue}>{formatKRW(r.value)}</Text>
                </View>
              ))}
            </Section>

            {/* Operating Margin Trend */}
            <Section title="영업이익률 추이">
              {metrics.operatingMargin.map((m) => (
                <View key={m.year} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{m.year}</Text>
                  <Text style={styles.dataValue}>{formatPercent(m.value)}</Text>
                </View>
              ))}
            </Section>
          </View>

          {/* Right Column */}
          <View style={isTablet ? styles.tabletColumn : undefined}>
            {/* Cash Flow */}
            <Section title="영업현금흐름 vs CAPEX">
              {metrics.operatingCashFlow.map((ocf, i) => {
                const capex = metrics.capex[i];
                return (
                  <View key={ocf.year} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{ocf.year}</Text>
                    <Text style={styles.dataValue}>
                      OCF {formatKRW(ocf.value)} / CAPEX {capex ? formatKRW(capex.value) : '-'}
                    </Text>
                  </View>
                );
              })}
            </Section>

            {/* Shareholder Return */}
            <Section title="주주환원">
              <DataItem label="배당수익률" value={formatPercent(metrics.dividend.dividendYield)} />
              <DataItem label="배당성향" value={formatPercent(metrics.dividend.payoutRatio)} />
              <DataItem
                label="주식수 변화"
                value={`${formatPercent(metrics.shareCountChange.changePercent)} ${getTrendIcon(metrics.shareCountChange.trend)}`}
              />
              <DataItem
                label="자사주 비율"
                value={formatPercent(metrics.treasuryStock.percentOfTotal)}
              />
            </Section>

            {/* Debt */}
            <Section title="순차입금">
              {metrics.netDebt.map((d) => (
                <View key={d.year} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{d.year}</Text>
                  <Text
                    style={[
                      styles.dataValue,
                      { color: d.value <= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {formatKRW(d.value)} {d.value <= 0 ? '(순현금)' : ''}
                  </Text>
                </View>
              ))}
            </Section>

            {/* Owner Risk */}
            <Section title="오너 리스크">
              <View style={styles.riskBadgeRow}>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: getRiskColor(analysis.ownerRisk.level) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.riskBadgeText,
                      { color: getRiskColor(analysis.ownerRisk.level) },
                    ]}
                  >
                    {analysis.ownerRisk.level === 'low'
                      ? '낮음'
                      : analysis.ownerRisk.level === 'medium'
                      ? '중간'
                      : '높음'}
                  </Text>
                </View>
              </View>
              <Text style={styles.description}>{analysis.ownerRisk.description}</Text>
              {analysis.ownerRisk.factors.map((f, i) => (
                <Text key={i} style={styles.bulletItem}>• {f}</Text>
              ))}
            </Section>

            {/* Catalysts */}
            <Section title="촉매 (Catalysts)">
              {analysis.catalysts.map((c, i) => (
                <Text key={i} style={styles.catalystItem}>✦ {c}</Text>
              ))}
            </Section>

            {/* Counter Arguments */}
            <Section title="반대논리 (Counter Arguments)">
              {analysis.counterArguments.map((c, i) => (
                <Text key={i} style={styles.counterItem}>⚠ {c}</Text>
              ))}
            </Section>

            {/* AI Summary */}
            <Section title="AI 종합 평가">
              <Text style={styles.summary}>{analysis.summary}</Text>
            </Section>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  tabletLayout: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  tabletColumn: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadow,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  stockCode: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  gradeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  gradeText: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
  },
  totalScore: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionContent: {},
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  dataValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  riskBadgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  riskBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  riskBadgeText: {
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bulletItem: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    paddingLeft: spacing.xs,
  },
  catalystItem: {
    color: colors.success,
    fontSize: fontSize.md,
    lineHeight: 24,
    paddingVertical: 2,
  },
  counterItem: {
    color: colors.warning,
    fontSize: fontSize.md,
    lineHeight: 24,
    paddingVertical: 2,
  },
  summary: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
});
