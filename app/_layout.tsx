import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/context/AppContext';
import { colors } from '../src/utils/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'AI 종목 스크리너' }}
        />
        <Stack.Screen
          name="company/[id]"
          options={{ title: '기업 분석' }}
        />
        <Stack.Screen
          name="settings/index"
          options={{ title: '설정' }}
        />
      </Stack>
    </AppProvider>
  );
}
