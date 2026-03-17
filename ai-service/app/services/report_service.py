from openai import OpenAI
from app.core.config import settings
from app.schemas.analysis import HealthReportRequest, HealthReportResponse
import loguru
import json

logger = loguru.logger

class ReportService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_health_report(self, request: HealthReportRequest) -> HealthReportResponse:
        """
        누적된 배변 데이터를 바탕으로 AI 건강 리포트 생성
        """
        logger.info(f"Generating health report for user {request.user_id} ({request.nickname})...")
        
        # 샘플 데이터를 텍스트로 변환하여 프롬프트 구성
        samples_summary = "\n".join([
            f"- Bristol Scale: {s.bristol_scale}, Color: {s.color}, Shape: {s.shape_description}"
            for s in request.samples
        ])

        prompt = f"""
        당신은 소화기 건강 전문 AI입니다. 사용자 '{request.nickname}'님의 최근 {request.days_back}일간의 배변 기록을 분석하여 건강 리포트를 작성해주세요.

        [최근 기록]
        {samples_summary}

        다음 형식의 JSON으로만 응답하세요:
        1. summary: 전체적인 건강 상태 요약 (한국어)
        2. recommendations: 건강 개선을 위한 권장 사항 리스트 (최소 3개, 한국어)
        3. trend_analysis: 이전 기록들과 비교했을 때의 추세 분석 (한국어)
        4. risk_level: 위험도 ('Low', 'Medium', 'High')

        응답은 반드시 유효한 JSON 형태여야 합니다.
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {"role": "system", "content": "You are a professional medical health analyst."},
                    {"role": "user", "content": prompt}
                ],
                response_format=HealthReportResponse,
            )

            result = response.choices[0].message.parsed
            logger.info("Health report generation complete.")
            return result

        except Exception as e:
            logger.error(f"Error during health report generation: {str(e)}")
            raise e

report_service = ReportService()
