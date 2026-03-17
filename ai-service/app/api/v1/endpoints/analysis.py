from fastapi import APIRouter, HTTPException, Body
from app.schemas.analysis import PoopAnalysisRequest, PoopAnalysisResult
from app.services.vision_service import vision_service
import base64

router = APIRouter()

@router.post("/analyze", response_model=PoopAnalysisResult)
async def analyze_poop(request: PoopAnalysisRequest):
    """
    푸 배변 분석 API: 이미지를 받아 AI 분석 결과를 반환합니다.
    (이미지는 base64 문자열로 전송됨)
    """
    try:
        # base64 유효성 검사 (간단하게)
        img_data = request.image_url
        if "," in img_data:
            img_data = img_data.split(",")[1]
            
        result = await vision_service.analyze_poop_image(img_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
