from pydantic import BaseModel, Field
from typing import List, Optional

class PoopAnalysisRequest(BaseModel):
    image_url: str = Field(..., description="Base64 encoded image or public URL")

class PoopAnalysisResult(BaseModel):
    bristol_scale: int = Field(..., ge=1, le=7, description="Bristol stool scale (1-7)")
    color: str = Field(..., description="Dominant color of the stool")
    shape_description: str = Field(..., description="Detailed description of the shape")
    health_score: int = Field(..., ge=0, le=100, description="Overall health score for this sample")
    ai_comment: str = Field(..., description="Brief AI feedback for the user")
    warning_tags: List[str] = Field(default_factory=list, description="Health warning tags if any (e.g., 'Blood detected', 'Dehydration')")

class HealthReportRequest(BaseModel):
    user_id: int
    nickname: str
    days_back: int = Field(default=7, ge=1, le=30)
    samples: List[PoopAnalysisResult] = Field(..., description="List of previous analysis results to summarize")

class HealthReportResponse(BaseModel):
    summary: str
    recommendations: List[str]
    trend_analysis: str
    risk_level: str # 'Low', 'Medium', 'High'
