from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List
import uvicorn
import random

app = FastAPI(title="Mock DayPoo AI Service")

class PoopAnalysisResult(BaseModel):
    bristol_scale: int
    color: str
    shape_description: str
    health_score: int
    ai_comment: str
    warning_tags: List[str]

@app.post("/api/v1/analysis/analyze", response_model=PoopAnalysisResult)
async def analyze_poop(image_file: UploadFile = File(...)):
    # Mock analysis result
    colors = ["Brown", "Golden", "Dark Brown", "Yellowish"]
    comments = [
        "아주 건강한 배변 상태입니다! 지금처럼 유지하세요.",
        "수분이 조금 부족해 보입니다. 물을 더 많이 마시는 것이 좋겠어요.",
        "식이섬유 섭취가 더 필요해 보이네요. 채소를 챙겨 드세요.",
        "완벽한 브리스톨 4단계입니다! 축하드려요."
    ]
    
    return PoopAnalysisResult(
        bristol_scale=random.randint(1, 7),
        color=random.choice(colors),
        shape_description="Mocked shape description for testing.",
        health_score=random.randint(70, 100),
        ai_comment=random.choice(comments),
        warning_tags=[]
    )

class HealthReportResponse(BaseModel):
    reportType: str
    healthScore: int
    summary: str
    solution: str
    insights: List[str]
    analyzedAt: str

@app.post("/api/v1/report/generate", response_model=HealthReportResponse)
async def generate_report(request: dict):
    print(f"Received health report request: {request}")
    # Mock report generation
    return HealthReportResponse(
        reportType=request.get("reportType", "WEEKLY"),
        healthScore=85,
        summary="전반적으로 양호한 상태입니다.",
        solution="식이섬유 섭취를 조금 더 늘려보세요.",
        insights=["브리스톨 4단계가 유지되고 있습니다.", "색상이 아주 좋습니다."],
        analyzedAt="2026-03-23T17:00:00"
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "mock"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
