import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../src/context/AppContext';
import { CompanyCard } from '../src/components/CompanyCard';
import { StatusBanner } from '../src/components/StatusBanner';
import { colors, fontSize, spacing, borderRadius } from '../src/utils/theme';
import { ScoreCard } from '../src/types';
import { rankScoreCards } from '../src/utils/scoring';

export default function HomeScreen() {
  const router = useRouter();
  const { state, actions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'growth'>('score');
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const rankedCards = useMemo(() => {
    let cards = rankScoreCards([...state.scoreCards]);

    // 검색 필터
    if (searchQuery) {
      cards = cards.filter(
        (c) =>
          c.company.corpName.includes(searchQuery) ||
          c.company.stockCode.includes(searchQuery)
      );
    }

    // 정렬
    switch (sortBy) {
      case 'name':
        cards.sort((a, b) => a.company.corpName.localeCompare(b.company.corpName));
        break;
      case 'growth':
        cards.sort((a, b) => b.scores.revenueGrowth - a.scores.revenueGrowth);
        break;
      default:
        // 기본: 점수 순 (이미 rankScoreCards에서 정렬됨)
        break;
    }

    return cards;
  }, [state.scoreCards, searchQuery, sortBy]);

  const top20 = rankedCards.slice(0, 20);

  function handleCompanyPress(scoreCard: ScoreCard) {
    router.push(`/company/${scoreCard.company.corpCode}`);
  }

  const numColumns = isTablet ? 2 : 1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Status Banner */}
      <StatusBanner
        job={state.currentJob}
        isLoading={state.isLoading}
        error={state.error}
        serverConnected={state.serverConnected}
      />

      {/* Search & Controls */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="기업명 또는 종목코드 검색..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => actions.startScreening()}
            disabled={state.isLoading}
          >
            <Text style={styles.startButtonText}>
              {state.isLoading ? '분석 중...' : '전체 스크리닝 시작'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Tabs */}
        <View style={styles.sortRow}>
          {[
            { key: 'score' as const, label: '점수순' },
            { key: 'name' as const, label: '이름순' },
            { key: 'growth' as const, label: '성장순' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.sortTab, sortBy === tab.key && styles.sortTabActive]}
              onPress={() => setSortBy(tab.key)}
            >
              <Text
                style={[
                  styles.sortTabText,
                  sortBy === tab.key && styles.sortTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.resultCount}>
            <Text style={styles.resultCountText}>
              TOP {Math.min(20, rankedCards.length)}개 / 전체 {state.scoreCards.length}개
            </Text>
          </View>
        </View>
      </View>

      {/* Company List */}
      {top20.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>아직 분석된 기업이 없습니다</Text>
          <Text style={styles.emptySubtitle}>
            '전체 스크리닝 시작' 버튼을 눌러{'\n'}
            AI 기반 종목 분석을 시작하세요
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => actions.startScreening()}
          >
            <Text style={styles.emptyButtonText}>스크리닝 시작</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={top20}
          keyExtractor={(item) => item.company.corpCode}
          key={numColumns}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.gridItem : undefined}>
              <CompanyCard
                scoreCard={item}
                onPress={() => handleCompanyPress(item)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={state.isLoading}
              onRefresh={actions.refreshResults}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  startButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  settingsButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: fontSize.xl,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  sortTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  sortTabActive: {
    backgroundColor: colors.primaryDark,
  },
  sortTabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  sortTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  resultCount: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resultCountText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
