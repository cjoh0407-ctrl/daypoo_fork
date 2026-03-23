# 💩 AI 기능 프론트엔드 연동 가이드 (v1.0)

본 문서는 DayPoo 서비스의 핵심인 **AI 간편 촬영 인증** 및 **AI 건강 리포트** 기능을 프론트엔드에서 연동하기 위한 상세 명세서입니다.

---

## 📸 1. AI 간편 촬영 인증 (AI Photo Certification)

사용자가 화장실에서 직접 상태를 입력하는 대신, 카메라 촬영을 통해 AI가 브리스톨 척도와 컬러를 자동으로 분석해주는 기능입니다.

### 🔄 연동 프로세스 (Workflow)

1.  **위치 감지**: 사용자가 화장실 반경 150m 이내에 진입하면 '체크인' 버튼을 활성화합니다.
2.  **도착 확인 (Check-in)**: 
    - `POST /api/v1/records/check-in` 호출
    - 이때부터 백엔드에서 체류 시간 측정이 시작됩니다.
3.  **최소 체류 시간 (1분) 대기**: 
    - 체크인 후 최소 1분이 지나야 최종 배변 기록 저장이 가능합니다.
    - **UI 권장**: 원형 타이머나 "최소 1분간의 체류가 필요합니다"라는 안내 문구를 노출하세요.
4.  **이미지 캡처 및 전송**: 
    - 카메라 화면에서 `Canvas` 프레임을 추출하여 **Base64** 데이터로 변환합니다.
    - `POST /api/v1/records` 호출 시 `imageBase64` 필드에 해당 데이터를 담아 보냅니다.
5.  **결과 자동 반영**: 
    - 서버 응답값에 포함된 `bristolScale`, `color` 값을 폼에 자동으로 채워줍니다.
    - 사용자가 최종 확인 후 '완료' 버튼을 누르면 기록이 저장됩니다.

### 📡 API 상세
- **Endpoint**: `POST /api/v1/records`
- **Request Body (AI 분석용)**:
  ```json
  {
    "toiletId": 38,
    "latitude": 37.4966,
    "longitude": 126.8437,
    "imageBase64": "data:image/jpeg;base64,...",
    "conditionTags": ["쾌적함"],
    "dietTags": ["불닭볶음면"]
  }
  ```

---

## 📊 2. AI 건강 리포트 (AI Health Report)

최근 배변 기록을 AI가 통합 분석하여 개인 맞춤형 리포트를 제공하는 수익화 기능입니다.

### 💰 리포트 타입 및 포인트 (Pricing)
- **DAILY (무료)**: 어제의 기록 분석 및 한 줄 평.
- **WEEKLY (50 Gold)**: 지난 7일간의 정밀 분석 및 솔루션.
- **MONTHLY (150 Gold)**: 한 달간의 추세 분석.

### 🔄 연동 프로세스
1.  **리포트 생성/조회 요청**: `GET /api/v1/reports/{DAILY|WEEKLY|MONTHLY}`
2.  **포인트 확인**: 유료 리포트 호출 시 포인트가 부족하면 400 에러와 함께 `포인트가 부족합니다.` 메시지가 옵니다.
3.  **결과 시각화**: 응답으로 오는 `healthScore`(0~100), `summary`, `insights` 리스트를 리포트 테마에 맞춰 렌더링합니다.

### 📡 API 상세
- **Endpoint**: `GET /api/v1/reports/WEEKLY`
- **Response Structure**:
  ```json
  {
    "reportType": "WEEKLY",
    "healthScore": 85,
    "summary": "전반적으로 양호한 상태입니다.",
    "solution": "식이섬유 섭취를 조금 더 늘려보세요.",
    "insights": [
      "최근 브리스톨 4단계 유지 비중이 높습니다.",
      "변 색상이 아주 건강합니다."
    ],
    "analyzedAt": "2026-03-23T17:00:00"
  }
  ```

---

## 🔔 3. 실시간 알림 구독 (SSE)

리포트 생성 완료 등 서버에서 발생하는 이벤트를 실시간으로 수신하기 위해 SSE 구독이 필요합니다.

- **Endpoint**: `GET /api/v1/notifications/subscribe`
- **Event Name**: `notification`
- **처리 로직**: 앱 구동 시 최초 1회 구독을 유지하며, 알림 이벤트 수신 시 `NotificationDetail` 화면으로 이동하도록 유도합니다.

---

## 🛡️ 개인정보 보호 수칙 (FE 필수 준수)
- **무음 촬영**: 브라우저 API가 허용하는 범위 내에서 셔터음이 들리지 않도록 처리하세요. (WebRTC Canvas 캡처 권장)
- **미사용 시 제거**: 캡처된 Base64 이미지는 백엔드 전송 직후 클라이언트 메모리에서 즉시 해제하십시오.

---
> **백엔드 구현 상태**: 완료 (`AppConfig` Auditing 활성화 및 `AiClient` 연동 검증 완료)
