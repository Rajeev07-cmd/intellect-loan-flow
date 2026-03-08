# Intelli-Credit Backend

AI-Powered Corporate Credit Decisioning Platform — FastAPI Backend

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Place your ML model
# Copy risk_analysis.pkl to this directory

# 4. Run the server
python main.py
# or
uvicorn main:app --reload --port 5000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET | List all loan applications |
| `/api/risk-analysis` | POST | Run ML model prediction |
| `/api/process-document` | POST | OCR extract financials from PDF |
| `/api/verify-documents` | POST | Document cross-validation |
| `/api/generate-cam` | POST | Generate Credit Appraisal Memo |
| `/api/workflow-status/{id}` | GET | Get application workflow timeline |

## Risk Analysis Input

```json
{
  "revenue_growth": 0.12,
  "profit_margin": 0.18,
  "debt_ratio": 0.62,
  "interest_coverage_ratio": 2.4,
  "litigation_count": 1,
  "sector_risk": 0.5,
  "collateral_score": 0.7
}
```

## Risk Analysis Output

```json
{
  "risk_score": 62,
  "risk_category": "Medium",
  "default_probability": 0.31,
  "explanation": [
    "High debt ratio indicates elevated leverage risk",
    "Low interest coverage ratio signals potential debt servicing issues"
  ]
}
```

## ML Model Requirements

Your `risk_analysis.pkl` should be a scikit-learn model that:
- Accepts 7 features: `[revenue_growth, profit_margin, debt_ratio, interest_coverage_ratio, litigation_count, sector_risk, collateral_score]`
- Returns probability of default (0-1) or has `predict_proba()` method

## Document Processing

For full OCR functionality, install Tesseract:

**macOS:**
```bash
brew install tesseract
```

**Ubuntu:**
```bash
sudo apt install tesseract-ocr
```

**Windows:**
Download from https://github.com/UB-Mannheim/tesseract/wiki

## Deployment

### Railway
```bash
railway init
railway up
```

### Render
Create `render.yaml`:
```yaml
services:
  - type: web
    name: intelli-credit-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
```

## Frontend Configuration

Set the API URL in your frontend's `.env`:

```
VITE_API_BASE_URL=https://your-deployed-backend.com
```

Or update `src/services/api.ts` directly.
