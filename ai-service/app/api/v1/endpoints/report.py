from fastapi import APIRouter, HTTPException, Depends
from app.schemas.analysis import HealthReportRequest, HealthReportResponse
from app.services.report_service import report_service
from app.core.redis_client import redis_client
import json
import loguru

logger = loguru.logger
router = APIRouter()

@router.post("/generate", response_model=HealthReportResponse)
async def generate_report(request: HealthReportRequest):
    """
    AI 건강 리포트 생성 API: 유저 ID와 데이터 리스트를 받아 분석 후 결과를 요약합니다.
    (Redis 캐시: 유저별 최신 리포트 보관 목적)
    """
    cache_key = f"daypoo:report:user:{request.user_id}:recent"
    
    try:
        # 캐시 여부 확인 (샘플 데이터가 동일하다는 가정 하에 단순화)
        # 실제 운영 시에는 샘플 데이터의 hash 값을 key에 포함하는 것이 권장됨.
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(f"Health report for user {request.user_id} found in Redis cache.")
            return HealthReportResponse(**json.loads(cached_data))

        # AI 호출 및 보고서 생성
        report = await report_service.generate_health_report(request)
        
        # Redis 캐시에 저장 (예: 24시간 동안 유효)
        await redis_client.setex(
            cache_key,
            86400, # 24 hours
            report.model_dump_json()
        )
        
        return report

    except Exception as e:
        logger.error(f"Failed to generate health report in endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="건강 리포트 생성 중 오류가 발생했습니다.")
