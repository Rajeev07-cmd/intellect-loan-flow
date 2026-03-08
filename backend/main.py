"""
Intelli-Credit FastAPI Backend
AI-Powered Corporate Credit Decisioning Platform

Deploy this separately (Railway, Render, AWS, etc.)
Frontend calls: http://localhost:5000 (or your deployed URL)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="Intelli-Credit API",
    description="AI-Powered Corporate Credit Decisioning Platform",
    version="1.0.0"
)

# CORS - Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML model at startup
try:
    risk_model = joblib.load("risk_analysis.pkl")
    print("✅ ML Model loaded successfully")
except FileNotFoundError:
    risk_model = None
    print("⚠️ ML Model not found - using fallback scoring")


# ============== PYDANTIC MODELS ==============

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

class ProcessedDocument(BaseModel):
    revenue: float
    profit: float
    outstanding_debt: float
    litigation_mentions: int
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    directors: Optional[List[str]] = None

class VerificationInput(BaseModel):
    application_id: str

class VerificationResult(BaseModel):
    document_integrity_score: int
    pan_gstin_match: bool
    cin_valid: bool
    director_mismatch: bool

class CamGenerationInput(BaseModel):
    application_id: str

class CamReport(BaseModel):
    company_overview: str
    financial_analysis: str
    risk_analysis: str
    recommendation: str
    suggested_loan_limit: str
    interest_rate: str

class WorkflowStep(BaseModel):
    stage: str
    status: str  # "completed" | "active" | "pending"
    date: str

class ApplicationSummary(BaseModel):
    id: str
    company_name: str
    sector: str
    loan_amount: float
    risk_score: int
    status: str


# ============== IN-MEMORY DATABASE ==============

applications_db = {
    "app_001": {
        "id": "app_001",
        "company_name": "Reliance Industries",
        "sector": "Petrochemicals",
        "loan_amount": 1200,
        "risk_score": 35,
        "status": "Under Review",
        "financials": {
            "revenue": 230000000000,
            "profit": 25000000000,
            "debt": 80000000000,
        },
        "workflow": [
            {"stage": "Application Created", "status": "completed", "date": "Mar 1"},
            {"stage": "Documents Uploaded", "status": "completed", "date": "Mar 2"},
            {"stage": "Verification", "status": "completed", "date": "Mar 3"},
            {"stage": "Risk Analysis", "status": "active", "date": "Mar 4"},
            {"stage": "CAM Generated", "status": "pending", "date": "—"},
            {"stage": "Manager Review", "status": "pending", "date": "—"},
        ]
    },
    "app_002": {
        "id": "app_002",
        "company_name": "Tata Steel Ltd",
        "sector": "Steel & Metals",
        "loan_amount": 500,
        "risk_score": 28,
        "status": "Approved",
        "financials": {
            "revenue": 180000000000,
            "profit": 18000000000,
            "debt": 45000000000,
        },
        "workflow": [
            {"stage": "Application Created", "status": "completed", "date": "Feb 15"},
            {"stage": "Documents Uploaded", "status": "completed", "date": "Feb 16"},
            {"stage": "Verification", "status": "completed", "date": "Feb 17"},
            {"stage": "Risk Analysis", "status": "completed", "date": "Feb 18"},
            {"stage": "CAM Generated", "status": "completed", "date": "Feb 19"},
            {"stage": "Manager Review", "status": "completed", "date": "Feb 20"},
        ]
    }
}


# ============== API ENDPOINTS ==============

@app.get("/")
def root():
    return {"message": "Intelli-Credit API", "status": "running", "model_loaded": risk_model is not None}


@app.get("/api/applications", response_model=List[ApplicationSummary])
def get_applications():
    """Get all loan applications"""
    return [
        ApplicationSummary(
            id=app["id"],
            company_name=app["company_name"],
            sector=app["sector"],
            loan_amount=app["loan_amount"],
            risk_score=app["risk_score"],
            status=app["status"]
        )
        for app in applications_db.values()
    ]


@app.post("/api/risk-analysis", response_model=RiskAnalysisResult)
def run_risk_analysis(input_data: RiskAnalysisInput):
    """
    Run ML model prediction for credit risk
    Returns risk score, category, default probability, and explanation
    """
    # Prepare feature vector
    features = np.array([[
        input_data.revenue_growth,
        input_data.profit_margin,
        input_data.debt_ratio,
        input_data.interest_coverage_ratio,
        input_data.litigation_count,
        input_data.sector_risk,
        input_data.collateral_score
    ]])
    
    # Run ML model or fallback
    if risk_model is not None:
        try:
            # If model returns probability
            if hasattr(risk_model, 'predict_proba'):
                proba = risk_model.predict_proba(features)[0]
                default_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
            else:
                prediction = risk_model.predict(features)[0]
                default_prob = float(prediction)
            
            risk_score = int(default_prob * 100)
        except Exception as e:
            print(f"Model prediction error: {e}")
            risk_score, default_prob = calculate_fallback_score(input_data)
    else:
        risk_score, default_prob = calculate_fallback_score(input_data)
    
    # Determine risk category
    if risk_score <= 40:
        risk_category = "Low"
    elif risk_score <= 65:
        risk_category = "Medium"
    else:
        risk_category = "High"
    
    # Generate explanations
    explanation = generate_risk_explanation(input_data, risk_score)
    
    return RiskAnalysisResult(
        risk_score=risk_score,
        risk_category=risk_category,
        default_probability=round(default_prob, 2),
        explanation=explanation
    )


def calculate_fallback_score(input_data: RiskAnalysisInput) -> tuple:
    """Fallback scoring when ML model is unavailable"""
    # Weighted scoring based on financial ratios
    score = 50  # Base score
    
    # Debt ratio impact (higher = riskier)
    score += (input_data.debt_ratio - 0.5) * 40
    
    # Interest coverage (lower = riskier)
    if input_data.interest_coverage_ratio < 1.5:
        score += 15
    elif input_data.interest_coverage_ratio > 3:
        score -= 10
    
    # Profit margin (higher = safer)
    score -= input_data.profit_margin * 30
    
    # Litigation impact
    score += input_data.litigation_count * 5
    
    # Sector risk
    score += input_data.sector_risk * 20
    
    # Collateral benefit
    score -= input_data.collateral_score * 15
    
    risk_score = max(0, min(100, int(score)))
    default_prob = risk_score / 100
    
    return risk_score, default_prob


def generate_risk_explanation(input_data: RiskAnalysisInput, risk_score: int) -> List[str]:
    """Generate explainable AI factors"""
    explanations = []
    
    if input_data.debt_ratio > 0.6:
        explanations.append("High debt ratio indicates elevated leverage risk")
    
    if input_data.interest_coverage_ratio < 2:
        explanations.append("Low interest coverage ratio signals potential debt servicing issues")
    
    if input_data.profit_margin < 0.1:
        explanations.append("Thin profit margins reduce buffer against market volatility")
    
    if input_data.litigation_count > 0:
        explanations.append(f"{input_data.litigation_count} ongoing litigation case(s) flagged")
    
    if input_data.sector_risk > 0.5:
        explanations.append("Sector classified as moderate-to-high risk")
    
    if input_data.collateral_score < 0.5:
        explanations.append("Weak collateral coverage")
    
    if not explanations:
        explanations.append("Strong financial profile with balanced risk indicators")
    
    return explanations[:5]  # Top 5 factors


@app.post("/api/process-document", response_model=ProcessedDocument)
async def process_document(file: UploadFile = File(...)):
    """
    Process uploaded PDF document using OCR
    Extract financial data for risk analysis
    """
    # In production, use pytesseract + pdfplumber
    # For demo, return simulated extraction
    
    filename = file.filename.lower()
    
    # Simulate OCR extraction based on document type
    if "financial" in filename or "annual" in filename:
        return ProcessedDocument(
            revenue=230000000000,
            profit=25000000000,
            outstanding_debt=80000000000,
            litigation_mentions=1,
            total_assets=450000000000,
            total_liabilities=280000000000,
            directors=["Mukesh Ambani", "Nikhil Meswani", "Hital Meswani"]
        )
    elif "gst" in filename:
        return ProcessedDocument(
            revenue=230000000000,
            profit=0,
            outstanding_debt=0,
            litigation_mentions=0
        )
    else:
        return ProcessedDocument(
            revenue=150000000000,
            profit=15000000000,
            outstanding_debt=60000000000,
            litigation_mentions=0
        )


@app.post("/api/verify-documents", response_model=VerificationResult)
def verify_documents(input_data: VerificationInput):
    """
    Run document cross-validation checks
    PAN-GST match, CIN validation, director verification
    """
    app_id = input_data.application_id
    
    # Simulate verification based on application
    if app_id in applications_db:
        return VerificationResult(
            document_integrity_score=87,
            pan_gstin_match=True,
            cin_valid=True,
            director_mismatch=False
        )
    else:
        return VerificationResult(
            document_integrity_score=65,
            pan_gstin_match=True,
            cin_valid=True,
            director_mismatch=True
        )


@app.post("/api/generate-cam", response_model=CamReport)
def generate_cam(input_data: CamGenerationInput):
    """
    Generate Credit Appraisal Memo
    Combines company profile, financials, risk analysis, and recommendation
    """
    app_id = input_data.application_id
    
    if app_id not in applications_db:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app = applications_db[app_id]
    
    # Generate CAM sections
    company_overview = f"{app['company_name']} is a leading company in the {app['sector']} sector with established market presence and operational history."
    
    fin = app.get("financials", {})
    financial_analysis = f"The company reported revenue of ₹{fin.get('revenue', 0) / 10000000:.0f} Cr with profit of ₹{fin.get('profit', 0) / 10000000:.0f} Cr. Outstanding debt stands at ₹{fin.get('debt', 0) / 10000000:.0f} Cr."
    
    risk_score = app.get("risk_score", 50)
    if risk_score <= 40:
        risk_analysis = "Low risk profile with strong financial fundamentals and adequate collateral coverage."
        recommendation = "Approve"
        interest_rate = "10.5%"
    elif risk_score <= 65:
        risk_analysis = "Medium risk profile. Recommend conditional approval with enhanced monitoring."
        recommendation = "Conditional Approval"
        interest_rate = "12.0%"
    else:
        risk_analysis = "High risk profile. Significant concerns regarding debt servicing capacity."
        recommendation = "Reject"
        interest_rate = "N/A"
    
    return CamReport(
        company_overview=company_overview,
        financial_analysis=financial_analysis,
        risk_analysis=risk_analysis,
        recommendation=recommendation,
        suggested_loan_limit=f"₹{app['loan_amount']} Cr",
        interest_rate=interest_rate
    )


@app.get("/api/workflow-status/{application_id}", response_model=List[WorkflowStep])
def get_workflow_status(application_id: str):
    """Get workflow timeline for an application"""
    
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail="Application not found")
    
    workflow = applications_db[application_id].get("workflow", [])
    
    return [
        WorkflowStep(
            stage=step["stage"],
            status=step["status"],
            date=step["date"]
        )
        for step in workflow
    ]


# ============== STARTUP ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
