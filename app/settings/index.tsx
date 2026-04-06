import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { colors, fontSize, spacing, borderRadius } from '../../src/utils/theme';

export default function SettingsScreen() {
  const { state, actions } = useApp();
  const [serverUrl, setServerUrl] = useState(state.settings.serverUrl);
  const [dartApiKey, setDartApiKey] = useState(state.settings.dartApiKey);
  const [openaiApiKey, setOpenaiApiKey] = useState(state.settings.openaiApiKey);
  const [maxCompanies, setMaxCompanies] = useState(String(state.settings.maxCompanies));
  const [market, setMarket] = useState(state.settings.market);

  useEffect(() => {
    setServerUrl(state.settings.serverUrl);
    setDartApiKey(state.settings.dartApiKey);
    setOpenaiApiKey(state.settings.openaiApiKey);
    setMaxCompanies(String(state.settings.maxCompanies));
    setMarket(state.settings.market);
  }, [state.settings]);

  async function handleSave() {
    await actions.updateSettings({
      serverUrl: serverUrl.trim(),
      dartApiKey: dartApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      maxCompanies: parseInt(maxCompanies, 10) || 100,
      market,
    });
    await actions.checkConnection();
    Alert.alert('저장 완료', '설정이 저장되었습니다.');
  }

  async function handleTestConnection() {
    await actions.updateSettings({ serverUrl: serverUrl.trim() });
    await actions.checkConnection();
    if (state.serverConnected) {
      Alert.alert('연결 성공', '서버에 정상적으로 연결되었습니다.');
    } else {
      Alert.alert('연결 실패', '서버에 연결할 수 없습니다. URL을 확인하세요.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Server Settings */}
        <SectionHeader title="서버 설정" />
        <InputField
          label="서버 URL"
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://localhost:3001"
        />
        <View style={styles.connectionRow}>
          <View style={[styles.statusDot, {
            backgroundColor: state.serverConnected ? colors.success : colors.danger,
          }]} />
          <Text style={styles.connectionText}>
            {state.serverConnected ? '서버 연결됨' : '연결 안됨'}
          </Text>
          <TouchableOpacity style={styles.testButton} onPress={handleTestConnection}>
            <Text style={styles.testButtonText}>연결 테스트</Text>
          </TouchableOpacity>
        </View>

        {/* API Keys */}
        <SectionHeader title="API 키" />
        <InputField
          label="OpenDART API Key"
          value={dartApiKey}
          onChangeText={setDartApiKey}
          placeholder="DART API 키를 입력하세요"
          secureTextEntry
        />
        <InputField
          label="OpenAI API Key"
          value={openaiApiKey}
          onChangeText={setOpenaiApiKey}
          placeholder="OpenAI API 키를 입력하세요"
          secureTextEntry
        />

        {/* Screening Settings */}
        <SectionHeader title="스크리닝 설정" />
        <InputField
          label="최대 분석 기업 수"
          value={maxCompanies}
          onChangeText={setMaxCompanies}
          placeholder="100"
          keyboardType="numeric"
        />

        <Text style={styles.label}>시장 선택</Text>
        <View style={styles.marketRow}>
          {[
            { key: 'all' as const, label: '전체' },
            { key: 'kospi' as const, label: 'KOSPI' },
            { key: 'kosdaq' as const, label: 'KOSDAQ' },
          ].map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.marketTab, market === m.key && styles.marketTabActive]}
              onPress={() => setMarket(m.key)}
            >
              <Text
                style={[
                  styles.marketTabText,
                  market === m.key && styles.marketTabTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>설정 저장</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>사용 방법</Text>
          <Text style={styles.infoText}>
            1. 백엔드 서버를 먼저 실행하세요 (server/ 디렉토리){'\n'}
            2. OpenDART API 키를 dart.fss.or.kr에서 발급받으세요{'\n'}
            3. OpenAI API 키를 platform.openai.com에서 발급받으세요{'\n'}
            4. 위 키들을 서버 환경변수 또는 여기에 입력하세요{'\n'}
            5. '전체 스크리닝 시작' 으로 분석을 시작하세요
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  testButton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  marketRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  marketTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketTabActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primary,
  },
  marketTabText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  marketTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  infoBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
});
