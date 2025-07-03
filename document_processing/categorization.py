"""
Smart Document Categorization Module

This module provides intelligent document classification, medical terminology extraction,
date and value parsing, and duplicate detection for medical documents.
"""

import re
import logging
import datetime
from typing import Dict, List, Any, Optional, Union, Tuple
from enum import Enum
import json

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentType(Enum):
    """Enum for medical document types"""
    UNKNOWN = "unknown"
    LAB_RESULT = "lab_result"
    PRESCRIPTION = "prescription"
    MEDICAL_REPORT = "medical_report"
    DISCHARGE_SUMMARY = "discharge_summary"
    REFERRAL = "referral"
    IMAGING_REPORT = "imaging_report"
    VACCINATION_RECORD = "vaccination_record"
    INSURANCE = "insurance"
    BILLING = "billing"
    CONSENT_FORM = "consent_form"

class DocumentCategorizer:
    """
    Smart document categorization service
    
    This service provides:
    1. Automatic document classification
    2. Medical terminology extraction
    3. Date and value parsing
    4. Duplicate detection
    """
    
    def __init__(self):
        """Initialize document categorizer with medical terminology and classification rules"""
        # Load medical terminology and classification rules
        self.medical_terms = self._load_medical_terminology()
        self.classification_rules = self._load_classification_rules()
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2)
        
        # Initialize document storage for duplicate detection
        # In production, this should be replaced with a proper database
        self.document_vectors = []
        self.document_ids = []
    
    def _load_medical_terminology(self) -> Dict[str, List[str]]:
        """
        Load medical terminology
        
        Returns:
            Dictionary mapping term categories to lists of terms
        """
        # This would typically load from a database or file
        # Using a simple example dictionary for now
        return {
            "lab_tests": [
                "CBC", "Complete Blood Count", "Lipid Panel", "Metabolic Panel", 
                "A1C", "Hemoglobin", "Glucose", "Cholesterol", "Triglycerides", "HDL", "LDL",
                "Creatinine", "BUN", "ALT", "AST", "TSH", "T3", "T4", "Vitamin D", "PSA"
            ],
            "medications": [
                "mg", "tablet", "capsule", "injection", "daily", "twice daily", "take with food",
                "amoxicillin", "lisinopril", "metformin", "atorvastatin", "levothyroxine",
                "amlodipine", "omeprazole", "albuterol", "gabapentin", "hydrochlorothiazide"
            ],
            "imaging": [
                "X-ray", "MRI", "CT", "Ultrasound", "Scan", "Radiology", "Imaging",
                "Contrast", "PET", "Mammogram", "DEXA", "Bone Density"
            ],
            "vital_signs": [
                "Blood Pressure", "Pulse", "Temperature", "Respiratory Rate", 
                "Oxygen Saturation", "Height", "Weight", "BMI"
            ],
            "common_diagnoses": [
                "Hypertension", "Diabetes", "Hyperlipidemia", "Hypothyroidism",
                "COPD", "Asthma", "Depression", "Anxiety", "Arthritis", "Obesity"
            ]
        }
    
    def _load_classification_rules(self) -> Dict[DocumentType, Dict[str, Any]]:
        """
        Load document classification rules
        
        Returns:
            Dictionary mapping document types to classification rules
        """
        # Simple rule-based classification with keyword patterns
        return {
            DocumentType.LAB_RESULT: {
                "keywords": ["laboratory", "lab result", "test result", "panel", "reference range", 
                             "specimen", "collected", "methodology"],
                "required_pattern": r"\b(?:normal range|reference range|abnormal|WBC|RBC|HGB|HCT)\b",
                "score_threshold": 0.6
            },
            DocumentType.PRESCRIPTION: {
                "keywords": ["prescription", "Rx", "refill", "dispense", "pharmacy", 
                             "sig:", "take", "tablet", "capsule", "daily", "dose", "route"],
                "required_pattern": r"\b(?:mg|mL|mcg|tablet|capsule|take|daily)\b",
                "score_threshold": 0.6
            },
            DocumentType.MEDICAL_REPORT: {
                "keywords": ["assessment", "plan", "history", "examination", "chief complaint",
                             "diagnosis", "treatment", "recommendation", "follow-up"],
                "score_threshold": 0.55
            },
            DocumentType.DISCHARGE_SUMMARY: {
                "keywords": ["discharge", "summary", "admission", "hospital", "follow-up", 
                             "discharged", "hospitalization", "inpatient"],
                "required_pattern": r"\b(?:discharge|admitted|admission date|discharge date)\b",
                "score_threshold": 0.7
            },
            DocumentType.REFERRAL: {
                "keywords": ["referral", "referred", "consult", "consultation", "specialist", 
                             "opinion", "second opinion"],
                "score_threshold": 0.6
            },
            DocumentType.IMAGING_REPORT: {
                "keywords": ["radiology", "imaging", "x-ray", "MRI", "CT", "ultrasound", 
                             "scan", "impression", "technique", "contrast"],
                "required_pattern": r"\b(?:impression|technique|findings|radiologist|CT|MRI|X-ray)\b",
                "score_threshold": 0.65
            },
            DocumentType.VACCINATION_RECORD: {
                "keywords": ["vaccine", "vaccination", "immunization", "booster", 
                             "dose", "administered", "injection site"],
                "score_threshold": 0.7
            },
            DocumentType.INSURANCE: {
                "keywords": ["insurance", "policy", "coverage", "premium", "deductible", 
                             "copay", "claim", "benefits", "insured", "group number"],
                "score_threshold": 0.65
            },
            DocumentType.BILLING: {
                "keywords": ["bill", "invoice", "payment", "amount", "due", "charge", 
                             "procedure code", "CPT", "service date", "balance"],
                "score_threshold": 0.65
            },
            DocumentType.CONSENT_FORM: {
                "keywords": ["consent", "agreement", "authorization", "permission", 
                             "procedure", "risks", "benefits", "alternatives", "signature"],
                "required_pattern": r"\b(?:consent|signature|authorize|agree)\b",
                "score_threshold": 0.7
            }
        }
    
    def classify_document(self, text: str) -> Tuple[DocumentType, float]:
        """
        Classify a document based on its text content
        
        Args:
            text: Document text
            
        Returns:
            Tuple of (document_type, confidence_score)
        """
        # Prepare text
        text_lower = text.lower()
        
        best_match = DocumentType.UNKNOWN
        highest_score = 0.0
        
        # Check each document type
        for doc_type, rules in self.classification_rules.items():
            score = 0
            max_score = len(rules["keywords"])
            
            # Check for keywords
            for keyword in rules["keywords"]:
                if keyword.lower() in text_lower:
                    score += 1
            
            # Normalize score
            normalized_score = score / max_score if max_score > 0 else 0
            
            # Check required pattern if specified
            if "required_pattern" in rules and normalized_score > 0:
                pattern_match = re.search(rules["required_pattern"], text, re.IGNORECASE)
                if not pattern_match:
                    normalized_score *= 0.5  # Reduce score if required pattern not found
            
            # Update best match if score exceeds threshold
            if normalized_score >= rules["score_threshold"] and normalized_score > highest_score:
                highest_score = normalized_score
                best_match = doc_type
        
        return best_match, highest_score
    
    def extract_medical_terms(self, text: str) -> Dict[str, List[str]]:
        """
        Extract medical terminology from document text
        
        Args:
            text: Document text
            
        Returns:
            Dictionary mapping term categories to found terms
        """
        result = {}
        text_lower = text.lower()
        
        # Check each category
        for category, terms in self.medical_terms.items():
            found_terms = []
            
            for term in terms:
                # Look for whole words only
                pattern = r'\b' + re.escape(term.lower()) + r'\b'
                matches = re.findall(pattern, text_lower)
                if matches:
                    # Use the original case from the text where possible
                    term_index = text_lower.find(term.lower())
                    if term_index >= 0:
                        original_case = text[term_index:term_index + len(term)]
                        found_terms.append(original_case)
                    else:
                        found_terms.append(term)
            
            if found_terms:
                result[category] = found_terms
        
        return result
    
    def extract_dates(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract dates from document text
        
        Args:
            text: Document text
            
        Returns:
            List of dictionaries with date information
        """
        results = []
        
        # Common date patterns
        date_patterns = [
            # MM/DD/YYYY or MM-DD-YYYY
            (r'\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](19|20)?\d{2}\b', 
             lambda m: datetime.datetime.strptime(
                 f"{m.group(1)}/{m.group(2)}/{m.group(3)}" if len(m.group(3)) == 4 
                 else f"{m.group(1)}/{m.group(2)}/20{m.group(3)}",
                 "%m/%d/%Y"
             ).date()),
            
            # YYYY/MM/DD or YYYY-MM-DD
            (r'\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b',
             lambda m: datetime.datetime.strptime(f"{m.group(1)}/{m.group(2)}/{m.group(3)}", "%Y/%m/%d").date()),
            
            # Month DD, YYYY
            (r'\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(0?[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?,?\s+(19|20)\d{2}\b',
             lambda m: datetime.datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", 
                                                 "%B %d %Y" if len(m.group(1)) > 3 else "%b %d %Y").date())
        ]
        
        # Find all dates
        for pattern, date_parser in date_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                try:
                    date_obj = date_parser(match)
                    
                    # Extract context (words before and after the date)
                    start = max(0, match.start() - 30)
                    end = min(len(text), match.end() + 30)
                    context = text[start:end].strip()
                    
                    # Determine if this might be a specific type of date
                    context_lower = context.lower()
                    date_type = "unknown"
                    if any(term in context_lower for term in ["collect", "drawn", "specimen", "sample"]):
                        date_type = "collection_date"
                    elif any(term in context_lower for term in ["report", "resulted", "result"]):
                        date_type = "report_date"
                    elif any(term in context_lower for term in ["birth", "dob", "born"]):
                        date_type = "birth_date"
                    elif any(term in context_lower for term in ["admit", "admission"]):
                        date_type = "admission_date"
                    elif any(term in context_lower for term in ["discharge"]):
                        date_type = "discharge_date"
                    elif any(term in context_lower for term in ["service", "visit"]):
                        date_type = "service_date"
                    
                    results.append({
                        "date": date_obj.strftime("%Y-%m-%d"),
                        "raw_text": match.group(0),
                        "position": match.span(),
                        "context": context,
                        "type": date_type
                    })
                    
                except Exception as e:
                    logger.warning(f"Failed to parse date '{match.group(0)}': {str(e)}")
        
        return results
    
    def extract_numeric_values(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract numeric values with units from document text
        
        Args:
            text: Document text
            
        Returns:
            List of dictionaries with value information
        """
        results = []
        
        # Pattern for numeric values with optional units
        # Matches patterns like "123", "123.45", "< 0.01", "> 100", "123 mg/dL"
        value_pattern = r'\b(?:(?:<|>|≤|≥|=)?\s*(\d+\.?\d*)\s*(-|to|–)?\s*(?:(?:<|>|≤|≥|=)?\s*(\d+\.?\d*))?\s*(mg|g|kg|mcg|ng|mL|L|dL|mmol|μmol|IU|mIU|pmol|U|mEq|mmHg|cm|mm|m|%|pg|fL|μL|μg|mOsm|units|mU|μU|nmol|mU\/mL|μg\/dL|mg\/dL|g\/dL|mmol\/L|μmol\/L|ng\/mL|ng\/dL|pg\/mL|mEq\/L|IU\/L|U\/L|mm\/h)?(?:\/(?:L|dL|mL|h))?)\b'
        
        # Common lab test patterns with units and reference ranges
        for match in re.finditer(value_pattern, text):
            try:
                value = match.group(1)
                high_value = match.group(3)
                unit = match.group(4) or ""
                
                # Extract context (words before and after the value)
                start = max(0, match.start() - 30)
                end = min(len(text), match.end() + 30)
                context = text[start:end].strip()
                
                # Try to determine what this measurement represents
                context_lower = context.lower()
                measurement_type = "unknown"
                
                # Check for common lab values and vitals
                if any(term in context_lower for term in ["glucose", "blood sugar"]):
                    measurement_type = "glucose"
                elif any(term in context_lower for term in ["hba1c", "a1c", "hemoglobin a1c"]):
                    measurement_type = "hba1c"
                elif any(term in context_lower for term in ["cholesterol", "ldl", "hdl", "triglycerides"]):
                    measurement_type = "lipid_panel"
                elif any(term in context_lower for term in ["blood pressure", "bp", "systolic", "diastolic"]):
                    measurement_type = "blood_pressure"
                elif any(term in context_lower for term in ["heart rate", "pulse"]):
                    measurement_type = "heart_rate"
                elif any(term in context_lower for term in ["temperature", "temp"]):
                    measurement_type = "temperature"
                elif any(term in context_lower for term in ["weight", "wt"]):
                    measurement_type = "weight"
                elif any(term in context_lower for term in ["height", "ht"]):
                    measurement_type = "height"
                
                # Try to extract reference range if present
                ref_range_pattern = r'(?:reference|normal|ref|range)(?:\s+range)?[:\s]+([<>]?\s*\d+\.?\d*\s*(?:-|to|–)\s*[<>]?\s*\d+\.?\d*)'
                ref_range_match = re.search(ref_range_pattern, context, re.IGNORECASE)
                ref_range = ref_range_match.group(1) if ref_range_match else None
                
                result = {
                    "value": float(value) if value else None,
                    "high_value": float(high_value) if high_value else None,
                    "unit": unit,
                    "raw_text": match.group(0),
                    "position": match.span(),
                    "context": context,
                    "type": measurement_type
                }
                
                if ref_range:
                    result["reference_range"] = ref_range
                
                results.append(result)
                
            except Exception as e:
                logger.warning(f"Failed to parse numeric value '{match.group(0)}': {str(e)}")
        
        return results
    
    def detect_duplicate(self, text: str, threshold: float = 0.85) -> Dict[str, Any]:
        """
        Detect if a document is a potential duplicate of existing documents
        
        Args:
            text: Document text
            threshold: Similarity threshold for duplicate detection (default: 0.85)
            
        Returns:
            Dictionary with duplicate detection results
        """
        if not self.document_vectors:
            # No documents to compare against
            return {
                "is_duplicate": False,
                "similarity_score": 0.0,
                "similar_document_id": None
            }
        
        # Create vector for the current document
        if not hasattr(self.vectorizer, 'vocabulary_'):
            # First-time fit
            all_docs = [text] + [doc[0] for doc in self.document_vectors]
            self.vectorizer.fit(all_docs)
            # Recompute all document vectors
            for i, (doc_text, _) in enumerate(self.document_vectors):
                self.document_vectors[i] = (doc_text, self.vectorizer.transform([doc_text])[0])
        
        current_vector = self.vectorizer.transform([text])[0]
        
        # Compare with existing documents
        max_similarity = 0.0
        most_similar_id = None
        
        for doc_id, (_, doc_vector) in zip(self.document_ids, self.document_vectors):
            similarity = cosine_similarity(current_vector, doc_vector)[0][0]
            if similarity > max_similarity:
                max_similarity = similarity
                most_similar_id = doc_id
        
        return {
            "is_duplicate": max_similarity >= threshold,
            "similarity_score": float(max_similarity),
            "similar_document_id": most_similar_id if max_similarity >= threshold else None
        }
    
    def add_document_to_index(self, doc_id: str, text: str) -> None:
        """
        Add a document to the duplicate detection index
        
        Args:
            doc_id: Document identifier
            text: Document text
        """
        # Create vector if vectorizer is already fit
        if hasattr(self.vectorizer, 'vocabulary_'):
            doc_vector = self.vectorizer.transform([text])[0]
        else:
            # Store text for later vectorization
            doc_vector = None
        
        self.document_vectors.append((text, doc_vector))
        self.document_ids.append(doc_id)
    
    def analyze_document(self, text: str, doc_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a document
        
        Args:
            text: Document text
            doc_id: Optional document ID for duplicate detection
            
        Returns:
            Dictionary with analysis results
        """
        # Document classification
        doc_type, confidence = self.classify_document(text)
        
        # Medical terminology extraction
        medical_terms = self.extract_medical_terms(text)
        
        # Date extraction
        dates = self.extract_dates(text)
        
        # Numeric value extraction
        values = self.extract_numeric_values(text)
        
        # Duplicate detection
        duplicate_info = self.detect_duplicate(text)
        
        # If a document ID was provided, add to index
        if doc_id:
            self.add_document_to_index(doc_id, text)
        
        return {
            "document_type": doc_type.value,
            "classification_confidence": float(confidence),
            "medical_terms": medical_terms,
            "dates": dates,
            "values": values,
            "duplicate_detection": duplicate_info
        }
