import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreeningJob } from '../types';
import { colors, fontSize, spacing, borderRadius } from '../utils/theme';

interface StatusBannerProps {
  job: ScreeningJob | null;
  isLoading: boolean;
  error: string | null;
  serverConnected: boolean;
}

export function StatusBanner({ job, isLoading, error, serverConnected }: StatusBannerProps) {
  if (error) {
    return (
      <View style={[styles.banner, styles.errorBanner]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!serverConnected) {
    return (
      <View style={[styles.banner, styles.warningBanner]}>
        <Text style={styles.warningText}>
          서버에 연결할 수 없습니다. 설정에서 서버 URL을 확인하세요.
        </Text>
      </View>
    );
  }

  if (job && isLoading) {
    const statusText = {
      pending: '대기 중...',
      collecting: '공시 데이터 수집 중...',
      analyzing: 'AI 분석 중...',
      scoring: '점수 계산 중...',
      completed: '완료!',
      error: '오류 발생',
    }[job.status];

    return (
      <View style={[styles.banner, styles.progressBanner]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{statusText}</Text>
          <Text style={styles.progressDetail}>
            {job.processedCompanies}/{job.totalCompanies} 기업 처리됨
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${job.progress}%` }]}
            />
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorBanner: {
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  progressBanner: {
    backgroundColor: colors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  progressDetail: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
