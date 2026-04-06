import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, borderRadius, spacing } from '../utils/theme';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
}

export function ScoreBar({ label, score, maxScore }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;
  const barColor = percentage >= 70 ? colors.scoreHigh
    : percentage >= 40 ? colors.scoreMid
    : colors.scoreLow;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.score, { color: barColor }]}>
          {score}/{maxScore}
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  score: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  barBackground: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
