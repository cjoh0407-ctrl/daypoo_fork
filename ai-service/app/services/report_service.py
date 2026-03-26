import json
from datetime import datetime

import loguru
from openai import OpenAI

from app.core.config import settings
from app.schemas.analysis import (
    HealthReportMonthlyRequest,
    HealthReportRequest,
    HealthReportResponse,
)

logger = loguru.logger


class ReportService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_health_report(
        self, request: HealthReportRequest
    ) -> HealthReportResponse:
        """
        누적된 배변 데이터를 바탕으로 AI 건강 리포트 생성 (DAILY/WEEKLY)
        """
        logger.info(
            f"Generating health report for user {request.userId} ({request.reportType})..."
        )

        # 기록 데이터를 텍스트로 변환하여 프롬프트 구성
        records_summary = "\n".join(
            [
                f"- Data: {r.createdAt}, Bristol Scale: {r.bristolScale}, Color: {r.color}, Tags: {r.conditionTags or ''}/{r.dietTags or ''}"
                for r in request.records
            ]
        )

        focus_instruction = """
        분석 초점 (7일 스냅샷):
        - 지난 7일간 지배적인 배변 패턴과 이상 징후 명확히 파악
        - 오늘 당장 실천 가능한 1~2가지 구체적 개선 행동 제안
        - summary: "이번 주 장 상태는..." 으로 시작하여 현재 시제로 서술하세요.
        - insights: "이번 주에 ~했습니다" 형식으로 3~4개를 리스트로 작성하세요.
        """

        prompt = f"""
        당신은 소화기 건강 전문 AI 분석가입니다. 사용자의 최근 배변 기록을 분석하여 전문적인 건강 리포트를 작성해주세요.

        [분석 데이터 - 리포트 타입: {request.reportType}]
        {records_summary}

        {focus_instruction}

        분석 시 다음 사항을 고려하세요:
        1. 배변 형태(Bristol Scale)의 변화 추이
        2. 식단 태그와 배변 결과 사이의 상관관계
        3. 전반적인 건강 점수 (0-100점)

        응답은 반드시 유효한 JSON 형태여야 하며, 다음 필드를 포함해야 합니다:
        - reportType: "{request.reportType}"
        - healthScore: 분석된 건강 점수 (정수)
        - summary: 현재 상태에 대한 2~3문장의 요약 (한국어)
        - solution: 건강 개선을 위한 구체적인 솔루션 (한국어)
        - insights: 데이터에서 발견된 주요 통계 및 인사이트 리스트 (한국어)
        - analyzedAt: "{datetime.now().isoformat()}"
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional medical health analyst who provides data-driven gastrointestinal health reports.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=HealthReportResponse,
            )

            result = response.choices[0].message.parsed
            logger.info("Health report generation complete.")
            return result

        except Exception as e:
            logger.error(f"Error during health report generation: {str(e)}")
            raise e

    async def generate_monthly_report(
        self, request: HealthReportMonthlyRequest
    ) -> HealthReportResponse:
        """
        4주 요약 데이터를 바탕으로 MONTHLY 건강 리포트 생성
        """
        logger.info(f"Generating MONTHLY health report for user {request.userId}...")

        # 4주 요약 데이터를 텍스트로 변환 (압축된 전송)
        summaries_text = "\n".join(
            [
                f"- {s.weekNumber}주차: {s.recordCount}건, Bristol 평균 {s.avgBristolScale}, "
                f"건강배변 {s.healthyRatio}%, 주요 식단: {s.topDietTags}, 주요 컨디션: {s.topConditionTags}"
                for s in request.weeklySummaries
            ]
        )

        prompt = f"""
        당신은 소화기 건강 전문 AI 분석가입니다. 사용자의 지난 한 달간의 주차별 요약 데이터를 분석하여 전문적인 트렌드 리포트를 작성해주세요.

        [분석 데이터 - 4주차 요약]
        {summaries_text}

        분석 초점 (30일 트렌드):
        - 주차별 변화를 비교하여 개선/악화 방향성 제시
        - 식단 태그와 배변 결과의 반복 상관관계 발견
        - 다음 달을 위한 지속 가능한 장기 목표 2~3가지
        - summary: "지난 한 달간 트렌드를 보면..." 으로 시작하여 거시적인 관점에서 서술하세요.
        - insights: "~하는 경향이 있습니다" 패턴 서술 형식으로 4~5개를 리스트로 작성하세요.

        응답은 반드시 유효한 JSON 형태여야 하며, 다음 필드를 포함해야 합니다:
        - reportType: "MONTHLY"
        - healthScore: 한 달간의 평균적인 건강 상태를 반영한 점수 (정수)
        - summary: 한 달 트렌드에 대한 요약 (한국어)
        - solution: 장기적인 건강 개선을 위한 솔루션 (한국어)
        - insights: 데이터에서 발견된 주요 트렌드 및 상관관계 리스트 (한국어)
        - analyzedAt: "{datetime.now().isoformat()}"
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional medical health analyst who provides data-driven long-term gastrointestinal health reports.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format=HealthReportResponse,
            )

            result = response.choices[0].message.parsed
            logger.info("Monthly health report generation complete.")
            return result

        except Exception as e:
            logger.error(f"Error during monthly health report generation: {str(e)}")
            raise e


report_service = ReportService()
