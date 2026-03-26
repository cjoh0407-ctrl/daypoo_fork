from typing import List, Optional

from pydantic import BaseModel, Field


class PoopAnalysisRequest(BaseModel):
    image_url: str = Field(..., description="Base64 encoded image or public URL")


class PoopAnalysisResult(BaseModel):
    bristol_scale: int = Field(..., ge=1, le=7, description="Bristol stool scale (1-7)")
    color: str = Field(..., description="Dominant color of the stool")
    shape_description: str = Field(..., description="Detailed description of the shape")
    health_score: int = Field(
        ..., ge=0, le=100, description="Overall health score for this sample"
    )
    ai_comment: str = Field(..., description="Brief AI feedback for the user")
    warning_tags: List[str] = Field(
        default_factory=list,
        description="Health warning tags if any (e.g., 'Blood detected', 'Dehydration')",
    )


class PooRecordData(BaseModel):
    bristolScale: int
    color: str
    conditionTags: Optional[str] = None
    dietTags: Optional[str] = None
    createdAt: str


class HealthReportRequest(BaseModel):
    userId: str
    reportType: str
    records: List[PooRecordData]


class HealthReportResponse(BaseModel):
    reportType: str
    healthScore: int
    summary: str
    solution: str
    insights: List[str]
    analyzedAt: str


class WeeklySummaryData(BaseModel):
    weekNumber: int  # 1~4
    recordCount: int
    avgBristolScale: float
    healthyRatio: int  # %
    topDietTags: str  # 예: "현미밥,닭가슴살,야채"
    topConditionTags: str  # 예: "정상,피로"


class HealthReportMonthlyRequest(BaseModel):
    userId: str
    reportType: str  # "MONTHLY"
    weeklySummaries: List[WeeklySummaryData]
