# Modification History

## [2026-03-23 13:15:00] Enum 추출 및 패키지 관리 체계 구축

### 작업 내용
- **Enum 독립 파일 추출**: `User` 엔티티 내부에 정의되어 있던 `Role` Enum을 별도의 클래스로 분리하였습니다.
- **Enum 전용 패키지 분리**: 기존 `entity` 폴더에 혼재되어 있던 모든 Enum들을 `com.daypoo.api.entity.enums` 패키지로 이동하여 관리 체계를 단일화하였습니다.
  - 대상: `Role`, `InquiryType`, `InquiryStatus`, `NotificationType`, `ItemType`, `ReportType`
- **전역 참조 업데이트**: 분리된 Enum을 참조하는 모든 엔티티, DTO, 레포지토리, 서비스, 테스트 코드의 임포트 경로를 새로운 패키지 구조에 맞게 일관되게 수정하였습니다.
- **테스크 케이스 최신화**: 기존의 계정 체계 개편(username -> email) 및 `RankingService` 시그니처 변경 사항이 반영되지 않아 발생하던 테스트 빌드 오류(`PooRecordServiceTest`, `RankingServiceTest`)를 모두 해결하였습니다.

## [2026-03-23 13:14:00] 관리자 페이지 폰트 통일성 일치 작업
- **작업 내용**: `AdminPage.tsx`에 전역 폰트 로직 및 지정 로고 폰트 적용
- **상세 변경 내역**:
  - 관리자 페이지 전체 컨테이너에 서비스 기본 폰트인 `Pretendard`(`font-['Pretendard']`)를 강제 적용하여 다른 페이지와의 일관성을 확보.
  - 상단 사이드바의 `Day.Poo` 텍스트 로고에 서비스 로고 전용 폰트인 `SchoolSafetyNotification`을 인라인 스타일로 적용.
- **결과/영향**: 관리자 페이지에서도 서비스 프론트엔드와 동일한 브랜드 폰트 경험(프리텐다드 + 학교안심알림장)을 제공하게 됨.

## [2026-03-23 13:10:00] 프리미엄 어드민 대시보드 리뉴얼
- **작업 내용**: 관리자 화면(`AdminPage.tsx`) 전역 디자인 개편 및 Glassmorphism 적용
- **상세 변경 내역**:
  - `framer-motion`을 활용한 부드러운 탭 전환 및 사이드바 접기/펼치기(Collapse/Expand) 애니메이션 구현.
  - `recharts`를 활용하여 매출 추이(AreaChart) 및 유저 비율(PieChart) 등의 데이터를 시각화하고 커스텀 그래디언트 및 툴팁을 적용.
  - 거대했던 단일 컴포넌트를 `GlassCard`, `StatWidget` 등의 하위 공통 컴포넌트로 나누어 가독성 및 유지보수성을 향상.
  - 프리미엄(고급) 느낌을 주는 배경 효과 및 투명도 렌더링(Backdrop blur) 적용.
- **결과/영향**: 관리자 페이지가 시각적으로 매우 미려해지고 사용자 편의성이 극적으로 향상되었으며, 향후 기능 확장에 대비한 모던 리액트 컴포넌트 구조를 확립함.

## [2026-03-23 12:45:00] 인증 시스템 프론트엔드 개편 (Email 기반 식별 전환)
- **작업 내용**: 백엔드 인증 방식 변경에 따른 프론트엔드 코드 전면 수정
- **상세 변경 내역**:
  - `AuthModal.tsx`: 로그인/회원가입 요청 시 `username` 필드 제거 및 `email` 필드로 통합.
  - `AuthModal.tsx`: `check-username` 엔드포인트를 `check-email`로 변경.
  - `AuthContext.tsx`: `User` 인터페이스를 `username`에서 `email` 기반으로 수정.
  - `MyPage.tsx`: `UserProfile` 타입 및 이메일 표시 영역을 `email` 프로퍼티를 사용하도록 업데이트.
- **결과/영향**: 백엔드 API 스펙(v1)과 100% 호환됨. 아이디 기반 인증에서 이메일 기반 인증으로 전환 완료.

## [2026-03-23 12:35:00] Upstream 코드 반영 (Git Pull)
- **작업 내용**: `upstream/main`으로부터 최신 코드 병합 및 동기화
- **상세 변경 내역**: 인증 시스템 개편이 반영된 백엔드 최신 코드 및 관련 DTO(SignUpRequest, LoginRequest 등) 병합.
- **결과/영향**: 로컬 환경을 팀 공통 최신 스펙으로 업데이트 완료.

## [2026-03-23 12:25:00] 관리자 계정 로그인 장애 해결 (Username 및 Password Hash 정정)

### 작업 내용
- **로그인 식별자 불일치 해결**: 프론트엔드 로그인 폼에서는 이메일을 `username` 필드로 전송하지만, DB에는 `admin`이라는 별도 유저네임으로 저장되어 로그인이 실패하던 현상을 수정했습니다.
- **계정 정보 동기화**: `admin@admin.com` 계정의 `username` 컬럼 값을 `admin@admin.com`으로 변경하여 프론트엔드 로그인 시도와 일치시켰습니다.
- **비밀번호 해시 재검증**: `bcryptjs`를 이용해 실제 `1234`에 특화된 검증된 해시값(`$2b$10$...`)을 다시 반영하여 패스워드 일치 여부를 보장했습니다.

### 상세 변경 내역
- **데이터베이스 컬럼 수정**:
  - `UPDATE users SET username='admin@admin.com', password='...' WHERE email='admin@admin.com';`
- **검증**: `node` 환경에서 해당 해시값과 `1234`가 BCrypt 상에서 일치(`compareSync`)함을 사전에 확인 완료했습니다.

### 결과/영향
- 이제 사용자가 로그인 창에서 `admin@admin.com`과 `1234`를 입력했을 때 정상적으로 로그인이 완료됩니다.
