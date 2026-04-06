# AI 종목 스크리너 - 빌드 & 설치 가이드

## 방법 1: GitHub Actions 자동 빌드 (가장 쉬움)

코드가 GitHub에 푸시되면 자동으로 APK가 빌드됩니다.

### APK 다운로드 방법:
1. GitHub 저장소 페이지에서 **Actions** 탭 클릭
2. 최신 "Build Android APK" 워크플로우 클릭
3. 하단 **Artifacts** 섹션에서 `ai-stock-screener-apk` 다운로드
4. ZIP 해제 후 `.apk` 파일을 갤럭시에 전송
5. 갤럭시에서 APK 파일 탭하여 설치
   - "출처를 알 수 없는 앱" 설치 허용 필요

---

## 방법 2: EAS Build (Expo 클라우드 빌드)

### 사전 준비:
```bash
npm install -g eas-cli
eas login  # Expo 계정 필요 (무료)
```

### APK 빌드:
```bash
# 개발용 APK (디버그)
eas build --platform android --profile development

# 배포용 APK
eas build --platform android --profile preview
```

빌드 완료 후 다운로드 링크가 터미널에 표시됩니다.

---

## 방법 3: 로컬 빌드 (PC에서 직접)

### 사전 준비:
1. **Node.js 18+** 설치: https://nodejs.org
2. **Android Studio** 설치: https://developer.android.com/studio
   - Android SDK 34 설치
   - Android Build Tools 34.0.0 설치
   - 환경변수 설정:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk  # Mac
     export ANDROID_HOME=$HOME/Android/Sdk           # Linux
     # Windows: 시스템 환경변수에 ANDROID_HOME 추가
     ```

### 빌드 순서:
```bash
# 1. 프로젝트 클론
git clone https://github.com/sangyong82lee-ai/Stock-suggestion.git
cd Stock-suggestion
git checkout claude/ai-stock-screening-app-RvkdU

# 2. 의존성 설치
npm install

# 3. Android 네이티브 프로젝트 생성
npx expo prebuild --platform android

# 4. APK 빌드
cd android
./gradlew assembleRelease    # Mac/Linux
gradlew.bat assembleRelease  # Windows

# 5. APK 위치
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 갤럭시에 설치하기

### APK 전송 방법:
- **이메일**: APK 파일을 자신의 이메일로 보내고 갤럭시에서 열기
- **Google Drive**: APK 업로드 후 갤럭시에서 다운로드
- **USB 케이블**: PC와 연결하여 파일 전송
- **카카오톡**: 나에게 보내기로 APK 전송

### 설치:
1. APK 파일 탭
2. "출처를 알 수 없는 앱 설치" 허용
3. 설치 완료!

---

## 아이폰/아이패드 설치

iOS는 APK가 아닌 별도 방법이 필요합니다:

### 방법 A: Expo Go 앱 (개발/테스트용)
1. App Store에서 "Expo Go" 설치
2. PC에서 `npm start` 실행
3. QR코드 스캔하여 앱 실행

### 방법 B: EAS Build (TestFlight)
```bash
eas build --platform ios --profile preview
```
- Apple Developer 계정 필요 ($99/년)
- TestFlight으로 배포

---

## 백엔드 서버 실행 (필수)

앱이 작동하려면 백엔드 서버가 실행 중이어야 합니다:

```bash
cd server
cp .env.example .env
# .env 파일에 API 키 입력:
#   DART_API_KEY=your_key
#   OPENAI_API_KEY=your_key

npm install
npm start
```

서버가 http://localhost:3001 에서 실행됩니다.
갤럭시에서 접속하려면 같은 Wi-Fi 네트워크에서 PC의 IP 주소를 사용하세요.
(예: http://192.168.0.10:3001)
