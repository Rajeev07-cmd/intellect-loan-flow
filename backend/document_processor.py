"""
Document Processing Module
Uses OCR to extract financial data from uploaded documents
"""

import re
from typing import Dict, List, Optional
from dataclasses import dataclass

# Uncomment when deploying with OCR dependencies
# import pytesseract
# import pdfplumber
# from PIL import Image


@dataclass
class ExtractedFinancials:
    revenue: float = 0
    net_profit: float = 0
    total_assets: float = 0
    total_liabilities: float = 0
    interest_expense: float = 0
    directors: List[str] = None
    litigation_mentions: int = 0
    pan: Optional[str] = None
    gstin: Optional[str] = None
    cin: Optional[str] = None


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using pdfplumber"""
    text = ""
    # Uncomment when deploying:
    # with pdfplumber.open(pdf_path) as pdf:
    #     for page in pdf.pages:
    #         text += page.extract_text() or ""
    return text


def extract_text_from_image(image_path: str) -> str:
    """Extract text from image using Tesseract OCR"""
    # Uncomment when deploying:
    # image = Image.open(image_path)
    # text = pytesseract.image_to_string(image)
    # return text
    return ""


def parse_financial_data(text: str) -> ExtractedFinancials:
    """Parse extracted text to find financial figures"""
    
    financials = ExtractedFinancials()
    
    # Revenue patterns
    revenue_patterns = [
        r'(?:total\s+)?revenue[:\s]+₹?\s*([\d,]+(?:\.\d+)?)\s*(?:cr|crore|lakh)?',
        r'turnover[:\s]+₹?\s*([\d,]+(?:\.\d+)?)',
        r'sales[:\s]+₹?\s*([\d,]+(?:\.\d+)?)',
    ]
    
    for pattern in revenue_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            financials.revenue = parse_amount(match.group(1))
            break
    
    # Profit patterns
    profit_patterns = [
        r'net\s+profit[:\s]+₹?\s*([\d,]+(?:\.\d+)?)',
        r'profit\s+after\s+tax[:\s]+₹?\s*([\d,]+(?:\.\d+)?)',
        r'PAT[:\s]+₹?\s*([\d,]+(?:\.\d+)?)',
    ]
    
    for pattern in profit_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            financials.net_profit = parse_amount(match.group(1))
            break
    
    # Assets
    assets_match = re.search(r'total\s+assets[:\s]+₹?\s*([\d,]+(?:\.\d+)?)', text, re.IGNORECASE)
    if assets_match:
        financials.total_assets = parse_amount(assets_match.group(1))
    
    # Liabilities
    liab_match = re.search(r'total\s+liabilities[:\s]+₹?\s*([\d,]+(?:\.\d+)?)', text, re.IGNORECASE)
    if liab_match:
        financials.total_liabilities = parse_amount(liab_match.group(1))
    
    # Interest expense
    interest_match = re.search(r'interest\s+(?:expense|cost)[:\s]+₹?\s*([\d,]+(?:\.\d+)?)', text, re.IGNORECASE)
    if interest_match:
        financials.interest_expense = parse_amount(interest_match.group(1))
    
    # PAN number
    pan_match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text)
    if pan_match:
        financials.pan = pan_match.group()
    
    # GSTIN
    gstin_match = re.search(r'\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]', text)
    if gstin_match:
        financials.gstin = gstin_match.group()
    
    # CIN
    cin_match = re.search(r'[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}', text)
    if cin_match:
        financials.cin = cin_match.group()
    
    # Litigation mentions
    litigation_keywords = ['litigation', 'lawsuit', 'legal proceedings', 'court case', 'arbitration']
    financials.litigation_mentions = sum(text.lower().count(kw) for kw in litigation_keywords)
    
    return financials


def parse_amount(amount_str: str) -> float:
    """Parse amount string to float, handling Indian number format"""
    # Remove commas and convert
    cleaned = amount_str.replace(',', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def calculate_model_features(financials: ExtractedFinancials) -> Dict[str, float]:
    """
    Convert extracted financials into ML model input features
    This is the Auto Financial Feature Extractor
    """
    
    # Calculate derived ratios
    profit_margin = 0.0
    if financials.revenue > 0:
        profit_margin = financials.net_profit / financials.revenue
    
    debt_ratio = 0.0
    if financials.total_assets > 0:
        debt_ratio = financials.total_liabilities / financials.total_assets
    
    interest_coverage = 0.0
    if financials.interest_expense > 0:
        interest_coverage = financials.net_profit / financials.interest_expense
    
    # Return feature vector matching risk_analysis.pkl input
    return {
        "revenue_growth": 0.12,  # Would need YoY data to calculate
        "profit_margin": round(profit_margin, 4),
        "debt_ratio": round(debt_ratio, 4),
        "interest_coverage_ratio": round(interest_coverage, 2),
        "litigation_count": financials.litigation_mentions,
        "sector_risk": 0.5,  # Would come from sector classification
        "collateral_score": 0.7  # Would need collateral data
    }


def verify_documents(financials: ExtractedFinancials) -> Dict[str, any]:
    """
    Run document verification checks
    """
    
    verification = {
        "pan_gstin_match": False,
        "cin_valid": False,
        "director_mismatch": False,
        "document_integrity_score": 0
    }
    
    score = 50  # Base score
    
    # PAN-GSTIN cross-check
    if financials.pan and financials.gstin:
        # GSTIN contains PAN in positions 2-11
        pan_in_gstin = financials.gstin[2:12]
        verification["pan_gstin_match"] = financials.pan == pan_in_gstin
        if verification["pan_gstin_match"]:
            score += 20
    
    # CIN validation
    if financials.cin:
        # Basic CIN format check
        cin_pattern = r'^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$'
        verification["cin_valid"] = bool(re.match(cin_pattern, financials.cin))
        if verification["cin_valid"]:
            score += 15
    
    # Document completeness
    if financials.revenue > 0:
        score += 5
    if financials.net_profit != 0:
        score += 5
    if financials.total_assets > 0:
        score += 5
    
    verification["document_integrity_score"] = min(100, score)
    
    return verification
