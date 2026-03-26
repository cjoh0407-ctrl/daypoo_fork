import json

import loguru
from fastapi import APIRouter, HTTPException

from app.core.redis_client import redis_client
from app.schemas.analysis import (
    HealthReportMonthlyRequest,
    HealthReportRequest,
    HealthReportResponse,
)
from app.services.report_service import report_service

logger = loguru.logger
router = APIRouter()


@router.post("/generate", response_model=HealthReportResponse)
async def generate_report(request: HealthReportRequest):
    """
    AI 건강 리포트 생성 API: 유저 ID와 데이터 리스트를 받아 분석 후 결과를 요약합니다.
    (Redis 캐시: 유저별 최신 리포트 보관 목적)
    """
    cache_key = f"daypoo:report:user:{request.userId}:recent"

    try:
        # 캐시 여부 확인
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(
                f"Health report for user {request.userId} found in Redis cache."
            )
            return HealthReportResponse(**json.loads(cached_data))

        # AI 호출 및 보고서 생성 (DAILY/WEEKLY)
        report = await report_service.generate_health_report(request)

        # Redis 캐시에 저장 (24시간)
        await redis_client.setex(cache_key, 86400, report.model_dump_json())

        return report

    except Exception as e:
        logger.error(f"Failed to generate health report in endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, detail="건강 리포트 생성 중 오류가 발생했습니다."
        )


@router.post("/generate/monthly", response_model=HealthReportResponse)
async def generate_monthly_report(request: HealthReportMonthlyRequest):
    """
    AI MONTHLY 건강 리포트 생성 API: 주차별 요약 데이터를 받아 분석 후 결과를 요약합니다.
    (Redis 캐시: MONTHLY 전용 최신 리포트 보관 목적)
    """
    cache_key = f"daypoo:report:user:{request.userId}:monthly:recent"

    try:
        # 캐시 여부 확인
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            logger.info(
                f"Monthly health report for user {request.userId} found in Redis cache."
            )
            return HealthReportResponse(**json.loads(cached_data))

        # AI 호출 및 월간 보고서 생성
        report = await report_service.generate_monthly_report(request)

        # Redis 캐시에 저장 (24시간)
        await redis_client.setex(cache_key, 86400, report.model_dump_json())

        return report

    except Exception as e:
        logger.error(f"Failed to generate monthly health report in endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, detail="MONTHLY 건강 리포트 생성 중 오류가 발생했습니다."
        )
