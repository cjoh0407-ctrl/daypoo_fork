# 통합 서버 가동 계획 (Full Stack Startup Plan)

## 🎯 목표
- 인프라(PostgreSQL, Redis)와 프론트엔드, 백엔드, AI 서버를 모두 성공적으로 가동합니다.

## 🛠 작업 단계

### Phase 1: 인프라 서버 가동 (Docker)
- [ ] `docker-compose up -d` 명령으로 PostgreSQL(PostGIS)과 Redis 컨테이너를 가동합니다.
- [ ] 각 컨테이너가 정상적으로 실행되는지 `docker ps`로 확인합니다.

### Phase 2: 백엔드 서버 가동 (Spring Boot)
- [ ] `backend` 디렉토리로 이동하여 `./gradlew bootRun` 명령을 실행합니다.
- [ ] 서버가 8080 포트에서 정상적으로 가동되었는지 확인합니다.

### Phase 3: AI 서비스 가동 (Python FastAPI)
- [ ] `ai-service` 디렉토리로 이동하여 `python main.py` 명령을 실행합니다.
- [ ] 서버가 8000 포트에서 정상적으로 가동되었는지 확인합니다.

### Phase 4: 프론트엔드 가동 (React/Vite)
- [ ] `frontend` 디렉토리로 이동하여 `npm run dev` 명령을 실행합니다.
- [ ] 프론트엔드가 5173 포트에서 가동되어 외부 접속이 가능한지 확인합니다.

### Phase 5: 최종 상태 점검 및 로깅
- [ ] 모든 서버의 포트 상태를 점검합니다.
- [ ] `docs/frontend-modification-history.md`에 서버 가동 이력을 기록합니다.

---
[✅ 규칙을 잘 수행했습니다.]
