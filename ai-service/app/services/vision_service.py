import base64
import json
from openai import OpenAI
from app.core.config import settings
from app.schemas.analysis import PoopAnalysisResult
import loguru

logger = loguru.logger

class VisionService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_poop_image(self, base64_image: str) -> PoopAnalysisResult:
        """
        AI Vision 파이프라인: 이미지를 분석하여 브리스톨 척도 및 건강 지표 추출
        """
        logger.info("Starting AI Vision analysis for poop image...")
        
        prompt = """
        You are a professional medical assistant specialized in digestive health.
        Analyze the provided image of a human stool and extract the following information in JSON format:
        1. bristol_scale: Integer from 1 to 7 based on the Bristol Stool Chart.
        2. color: The dominant color (e.g., Brown, Yellow, Green, Black, Red-ish).
        3. shape_description: A brief clinical description of the shape.
        4. health_score: An overall health score from 0 to 100.
        5. ai_comment: A friendly but professional comment for the user in Korean.
        6. warning_tags: A list of any concerning signs (e.g., 'Blood', 'Mucus', 'Very hard'). If none, return an empty list.

        Output must be valid JSON only.
        """

        try:
            response = self.client.beta.chat.completions.parse(
                model=settings.MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                            },
                        ],
                    }
                ],
                response_format=PoopAnalysisResult,
                max_tokens=1000,
            )

            result = response.choices[0].message.parsed
            logger.info(f"Analysis complete: Bristol Scale {result.bristol_scale}")
            return result

        except Exception as e:
            logger.error(f"Error during AI Vision analysis: {str(e)}")
            raise e

vision_service = VisionService()
