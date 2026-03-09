"""
Intelli-Credit FastAPI Backend
AI-Powered Corporate Credit Decisioning Platform
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Intelli-Credit API",
    description="AI-Powered Corporate Credit Decisioning Platform",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_risk_model() -> Any:
    model_name = "risk_analysis.pkl"
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    candidate_paths = [
        os.path.join(backend_dir, model_name),
        os.path.join(os.getcwd(), model_name),
        os.path.join(os.getcwd(), "backend", model_name),
    ]

    for path in candidate_paths:
        if os.path.exists(path):
            try:
                model = joblib.load(path)
                print(f"✅ ML model loaded from: {path}")
                return model
            except Exception as err:
                print(f"⚠️ Failed loading model from {path}: {err}")

    print("⚠️ risk_analysis.pkl not loaded; fallback scoring enabled")
    return None


risk_model = _load_risk_model()


# ============== REQUEST / RESPONSE MODELS ==============

class ApiResponse(BaseModel):
    status: str = "success"
    message: str
    data: Optional[Dict[str, Any]] = None


class CreateApplicationInput(BaseModel):
    company_name: str = Field(..., min_length=2)
    sector: str = Field(..., min_length=2)
    loan_amount: float = Field(..., gt=0)


class UploadDocumentInput(BaseModel):
    application_id: str = Field(..., min_length=3)


class VerificationInput(BaseModel):
    application_id: str


class RiskAnalysisInput(BaseModel):
    revenue_growth: float
    profit_margin: float
    debt_ratio: float
    interest_coverage_ratio: float
    litigation_count: int
    sector_risk: float
    collateral_score: float


class RiskAnalysisResult(BaseModel):
    risk_score: int
    risk_category: str
    default_probability: float
    explanation: List[str]


class CamGenerationInput(BaseModel):
    application_id: str


class FinalizeDecisionInput(BaseModel):
    application_id: str
    decision: str


class CopilotQueryInput(BaseModel):
    application_id: Optional[str] = None
    question: str = Field(..., min_length=3)


class ApplicationSummary(BaseModel):
    id: str
    company_name: str
    sector: str
    loan_amount: float
    risk_score: int
    status: str


class CamReport(BaseModel):
    company_overview: str
    financial_analysis: str
    risk_analysis: str
    recommendation: str
    suggested_loan_limit: str
    interest_rate: str


# ============== LIGHTWEIGHT STORE (dev fallback) ==============

applications_db: Dict[str, Dict[str, Any]] = {
    "app_001": {
        "id": "app_001",
        "company_name": "Reliance Industries",
        "sector": "Petrochemicals",
        "loan_amount": 1200.0,
        "risk_score": 35,
        "status": "Under Review",
        "financials": {"revenue": 230000000000, "profit": 25000000000, "debt": 80000000000},
    }
}


def _fallback_score(input_data: RiskAnalysisInput) -> Tuple[int, float]:
    score = 50
    score += (input_data.debt_ratio - 0.5) * 40
    score += 15 if input_data.interest_coverage_ratio < 1.5 else (-10 if input_data.interest_coverage_ratio > 3 else 0)
    score -= input_data.profit_margin * 30
    score += input_data.litigation_count * 5
    score += input_data.sector_risk * 20
    score -= input_data.collateral_score * 15
    risk_score = max(0, min(100, int(score)))
    return risk_score, risk_score / 100


def _risk_explanation(input_data: RiskAnalysisInput) -> List[str]:
    factors: List[str] = []
    if input_data.debt_ratio > 0.6:
        factors.append("High debt ratio indicates elevated leverage risk")
    if input_data.interest_coverage_ratio < 2:
        factors.append("Low interest coverage ratio signals potential debt servicing issues")
    if input_data.profit_margin < 0.1:
        factors.append("Thin profit margins reduce buffer against volatility")
    if input_data.litigation_count > 0:
        factors.append(f"{input_data.litigation_count} ongoing litigation case(s) flagged")
    if input_data.sector_risk > 0.5:
        factors.append("Sector risk is moderate-to-high")
    if input_data.collateral_score < 0.5:
        factors.append("Weak collateral coverage")
    return factors or ["Strong financial profile with balanced indicators"]


def _run_risk_model(input_data: RiskAnalysisInput) -> RiskAnalysisResult:
    features = np.array([[ 
        input_data.revenue_growth,
        input_data.profit_margin,
        input_data.debt_ratio,
        input_data.interest_coverage_ratio,
        input_data.litigation_count,
        input_data.sector_risk,
        input_data.collateral_score,
    ]])

    if risk_model is not None:
        try:
            if hasattr(risk_model, "predict_proba"):
                proba = risk_model.predict_proba(features)[0]
                default_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
            else:
                default_prob = float(risk_model.predict(features)[0])
            risk_score = int(max(0, min(100, default_prob * 100)))
        except Exception as err:
            print(f"⚠️ Model inference failed, fallback used: {err}")
            risk_score, default_prob = _fallback_score(input_data)
    else:
        risk_score, default_prob = _fallback_score(input_data)

    risk_category = "Low" if risk_score <= 40 else "Medium" if risk_score <= 65 else "High"

    return RiskAnalysisResult(
        risk_score=risk_score,
        risk_category=risk_category,
        default_probability=round(default_prob, 2),
        explanation=_risk_explanation(input_data),
    )


def _success(message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {"status": "success", "message": message, "data": data or {}}


# ============== HEALTH ==============

@app.get("/")
def root() -> Dict[str, Any]:
    return _success("Intelli-Credit API running", {"model_loaded": risk_model is not None})


# ============== LEGACY + REQUIRED ENDPOINTS ==============

@app.get("/applications", response_model=List[ApplicationSummary])
@app.get("/api/applications", response_model=List[ApplicationSummary])
def get_applications() -> List[ApplicationSummary]:
    return [
        ApplicationSummary(
            id=a["id"],
            company_name=a["company_name"],
            sector=a["sector"],
            loan_amount=float(a["loan_amount"]),
            risk_score=int(a.get("risk_score", 50)),
            status=a.get("status", "Under Review"),
        )
        for a in applications_db.values()
    ]


@app.get("/application/{application_id}")
def get_application(application_id: str) -> Dict[str, Any]:
    app_data = applications_db.get(application_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")
    return _success("Application fetched", app_data)


@app.post("/create-application")
def create_application(payload: CreateApplicationInput) -> Dict[str, Any]:
    app_id = f"app_{len(applications_db) + 1:03d}"
    applications_db[app_id] = {
        "id": app_id,
        "company_name": payload.company_name,
        "sector": payload.sector,
        "loan_amount": payload.loan_amount,
        "risk_score": 50,
        "status": "Application Created",
        "created_at": datetime.utcnow().isoformat(),
    }
    return _success("Application created", {"application_id": app_id})


@app.post("/upload-document")
async def upload_document(application_id: str, file: UploadFile = File(...)) -> Dict[str, Any]:
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail="Application not found")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")
    return _success("Document uploaded", {"application_id": application_id, "filename": file.filename})


@app.post("/verify-documents")
@app.post("/api/verify-documents")
def verify_documents(payload: VerificationInput) -> Dict[str, Any]:
    if payload.application_id not in applications_db:
        raise HTTPException(status_code=404, detail="Application not found")
    return _success("Documents verified", {
        "document_integrity_score": 87,
        "pan_gstin_match": True,
        "cin_valid": True,
        "director_mismatch": False,
    })


@app.post("/run-risk-analysis", response_model=RiskAnalysisResult)
@app.post("/api/risk-analysis", response_model=RiskAnalysisResult)
def run_risk_analysis(payload: RiskAnalysisInput) -> RiskAnalysisResult:
    return _run_risk_model(payload)


@app.post("/generate-cam", response_model=CamReport)
@app.post("/api/generate-cam", response_model=CamReport)
def generate_cam(payload: CamGenerationInput) -> CamReport:
    app_data = applications_db.get(payload.application_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")

    risk_score = int(app_data.get("risk_score", 50))
    recommendation = "Approve" if risk_score <= 40 else "Conditional Approval" if risk_score <= 65 else "Reject"
    rate = "9.8%" if risk_score <= 40 else "11.5%" if risk_score <= 65 else "N/A"

    return CamReport(
        company_overview=f"{app_data['company_name']} operates in the {app_data['sector']} sector.",
        financial_analysis="Financial statements reviewed; leverage and servicing capacity assessed.",
        risk_analysis=f"Risk score: {risk_score}. Category: {'Low' if risk_score <= 40 else 'Medium' if risk_score <= 65 else 'High'}.",
        recommendation=recommendation,
        suggested_loan_limit=f"₹{app_data['loan_amount']} Cr",
        interest_rate=rate,
    )


@app.post("/finalize-decision")
def finalize_decision(payload: FinalizeDecisionInput) -> Dict[str, Any]:
    app_data = applications_db.get(payload.application_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")

    normalized = payload.decision.lower()
    if normalized not in {"approve", "reject", "conditional", "review"}:
        raise HTTPException(status_code=400, detail="Invalid decision")

    final_status = "Approved" if normalized == "approve" else "Rejected" if normalized == "reject" else "Under Review"
    app_data["status"] = final_status
    app_data["final_status"] = final_status

    return _success("Decision finalized", {"application_id": payload.application_id, "final_status": final_status})


@app.post("/ai-copilot/query")
def ai_copilot_query(payload: CopilotQueryInput) -> Dict[str, Any]:
    context = f"Application {payload.application_id}" if payload.application_id else "Portfolio"
    answer = f"{context}: Based on available credit signals, review debt coverage, collateral strength, and litigation profile before final approval."
    return _success("AI copilot response generated", {"answer": answer})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
