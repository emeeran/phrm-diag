#!/usr/bin/env python
"""
Test script for AI-enhanced document processing features

This script demonstrates and validates the AI-enhanced document processing capabilities
including:
- Medical report summarization
- Key findings extraction
- Trend identification from documents
- Cross-reference with existing records
- Document management features
"""

import os
import sys
import json
from pathlib import Path

# Add parent directory to path for importing
sys.path.append(str(Path(__file__).parent.parent))

from document_processing.enhancement import (
    summarize_report, 
    extract_key_findings, 
    identify_trends, 
    cross_reference_with_records
)
from document_processing.document_management import DocumentManager

def test_summarization():
    """Test the medical report summarization"""
    print("\n=== Testing Medical Report Summarization ===")
    
    sample_report = """
    Patient: John Doe
    Date: July 2, 2025
    
    CHIEF COMPLAINT:
    Patient presents with persistent cough, fatigue, and mild fever for the past two weeks.
    
    HISTORY OF PRESENT ILLNESS:
    Mr. Doe reports a gradual onset of symptoms beginning approximately 14 days ago. 
    The cough is described as productive with clear sputum. Patient reports fatigue 
    interfering with daily activities and intermittent fever up to 100.4°F. 
    Patient denies shortness of breath, chest pain, or night sweats. No recent travel 
    or known COVID-19 exposure. Fully vaccinated against COVID-19.
    
    PAST MEDICAL HISTORY:
    Hypertension (diagnosed 2023)
    Type 2 diabetes (diagnosed 2022)
    Hyperlipidemia
    
    MEDICATIONS:
    Lisinopril 10mg daily
    Metformin 500mg twice daily
    Atorvastatin 20mg nightly
    
    PHYSICAL EXAMINATION:
    Vital Signs: Temperature 99.8°F, BP 138/85 mmHg, HR 82 bpm, RR 16, SpO2 97% on room air
    General: Alert, oriented, mild distress due to cough
    HEENT: Oropharynx mildly erythematous without exudate
    Neck: No lymphadenopathy
    Lungs: Scattered rhonchi bilaterally, no wheezes or crackles
    Heart: Regular rate and rhythm, no murmurs
    Abdomen: Soft, non-tender, non-distended
    
    ASSESSMENT:
    1. Acute bronchitis, likely viral
    2. Hypertension, controlled
    3. Type 2 diabetes mellitus, controlled
    
    PLAN:
    1. Symptomatic treatment for bronchitis
    2. Increase fluid intake
    3. OTC cough suppressants as needed
    4. Rest and monitor temperature
    5. Return if symptoms worsen or do not improve within 7 days
    6. Continue current medications for hypertension and diabetes
    """
    
    summary = summarize_report(sample_report)
    
    print("Original report length:", len(sample_report))
    print("Summary length:", len(summary))
    print("\nSummary:")
    print(summary)

def test_key_findings_extraction():
    """Test the key findings extraction"""
    print("\n=== Testing Key Findings Extraction ===")
    
    sample_report = """
    Patient Name: Jane Smith
    DOB: 01/15/1975
    Date: July 1, 2025
    
    LABORATORY RESULTS
    
    Complete Blood Count:
    - WBC: 7.2 K/uL (Reference: 4.5-11.0)
    - RBC: 4.6 M/uL (Reference: 4.0-5.2)
    - Hemoglobin: 13.8 g/dL (Reference: 12.0-16.0)
    - Hematocrit: 41.2% (Reference: 36.0-46.0)
    - Platelets: 256 K/uL (Reference: 150-400)
    
    Comprehensive Metabolic Panel:
    - Glucose: 142 mg/dL (Reference: 70-99) HIGH
    - BUN: 15 mg/dL (Reference: 7-20)
    - Creatinine: 0.8 mg/dL (Reference: 0.6-1.1)
    - eGFR: >60 mL/min/1.73m² (Reference: >60)
    - Sodium: 139 mEq/L (Reference: 136-145)
    - Potassium: 4.1 mEq/L (Reference: 3.5-5.1)
    - Chloride: 101 mEq/L (Reference: 98-107)
    - CO2: 24 mEq/L (Reference: 21-32)
    - Calcium: 9.3 mg/dL (Reference: 8.5-10.2)
    - Protein, Total: 7.0 g/dL (Reference: 6.4-8.2)
    - Albumin: 4.2 g/dL (Reference: 3.4-5.0)
    - Bilirubin, Total: 0.5 mg/dL (Reference: 0.1-1.2)
    - Alkaline Phosphatase: 78 U/L (Reference: 40-129)
    - AST: 22 U/L (Reference: 0-40)
    - ALT: 25 U/L (Reference: 0-32)
    
    Lipid Panel:
    - Total Cholesterol: 215 mg/dL (Reference: <200) HIGH
    - Triglycerides: 165 mg/dL (Reference: <150) HIGH
    - HDL Cholesterol: 42 mg/dL (Reference: >40)
    - LDL Cholesterol (calculated): 140 mg/dL (Reference: <100) HIGH
    - Non-HDL Cholesterol: 173 mg/dL (Reference: <130) HIGH
    
    Hemoglobin A1c: 7.1% (Reference: <5.7%) HIGH
    
    IMPRESSION:
    1. Elevated glucose and HbA1c consistent with diabetes
    2. Dyslipidemia with elevated LDL and triglycerides
    3. Complete blood count within normal limits
    4. Renal and liver function tests within normal limits
    
    RECOMMENDATIONS:
    1. Continue current metformin therapy for diabetes
    2. Consider increasing atorvastatin dose for better lipid control
    3. Follow-up in 3 months for repeat HbA1c and lipid panel
    4. Dietary counseling for diabetes and dyslipidemia management
    """
    
    findings = extract_key_findings(sample_report)
    
    print("Extracted findings:")
    for category, items in findings.items():
        print(f"\n{category.upper()}:")
        if isinstance(items, dict):
            for k, v in items.items():
                print(f"  - {k}: {v}")
        else:
            for item in items:
                print(f"  - {item}")

def test_trend_identification():
    """Test trend identification from multiple documents"""
    print("\n=== Testing Trend Identification ===")
    
    # Series of blood pressure readings over time
    documents = [
        {
            "date": "2025-01-15",
            "findings": {
                "measurements": {
                    "blood_pressure": [
                        {"value": "150/95 mmHg", "context": "Blood Pressure: 150/95 mmHg (elevated)"}
                    ]
                },
                "conditions": ["hypertension", "type 2 diabetes"],
                "medications": ["lisinopril 10mg", "metformin 500mg"]
            }
        },
        {
            "date": "2025-03-20",
            "findings": {
                "measurements": {
                    "blood_pressure": [
                        {"value": "145/90 mmHg", "context": "BP 145/90 mmHg"}
                    ]
                },
                "conditions": ["hypertension", "type 2 diabetes"],
                "medications": ["lisinopril 20mg", "metformin 500mg"]
            }
        },
        {
            "date": "2025-05-10",
            "findings": {
                "measurements": {
                    "blood_pressure": [
                        {"value": "138/85 mmHg", "context": "Blood pressure improved at 138/85 mmHg"}
                    ]
                },
                "conditions": ["hypertension", "type 2 diabetes"],
                "medications": ["lisinopril 20mg", "metformin 1000mg"]
            }
        },
        {
            "date": "2025-07-01",
            "findings": {
                "measurements": {
                    "blood_pressure": [
                        {"value": "132/82 mmHg", "context": "BP: 132/82 mmHg (well-controlled)"}
                    ]
                },
                "conditions": ["hypertension", "type 2 diabetes"],
                "medications": ["lisinopril 20mg", "metformin 1000mg"]
            }
        }
    ]
    
    trends = identify_trends(documents)
    
    print("Identified trends:")
    print(json.dumps(trends, indent=2))

def test_cross_referencing():
    """Test cross-referencing with existing records"""
    print("\n=== Testing Cross-Referencing ===")
    
    new_document = """
    Patient: John Doe
    Date: July 2, 2025
    
    VISIT SUMMARY:
    Patient returns for follow-up of hypertension and diabetes. Reports improved blood 
    sugar readings after increasing metformin dosage. Blood pressure improved with 
    current lisinopril dosage. Patient reports minor cough, possibly related to medication.
    
    MEDICATIONS:
    Lisinopril 20mg daily
    Metformin 1000mg twice daily
    Atorvastatin 20mg nightly
    
    VITALS:
    Blood Pressure: 132/82 mmHg
    Heart Rate: 74 bpm
    Weight: 182 lbs
    
    PLAN:
    Continue current medications
    Consider ACE inhibitor alternative if cough persists
    Follow up in 3 months
    """
    
    existing_records = [
        """
        Patient: John Doe
        Date: January 15, 2025
        
        VISIT SUMMARY:
        Initial visit for hypertension management. Patient recently diagnosed with 
        hypertension and Type 2 diabetes. Started on lisinopril and metformin.
        
        VITALS:
        Blood Pressure: 150/95 mmHg
        Heart Rate: 82 bpm
        Weight: 195 lbs
        
        PLAN:
        Start lisinopril 10mg daily
        Start metformin 500mg twice daily
        Diet and exercise counseling
        Follow up in 2 months
        """,
        
        """
        Patient: John Doe
        Date: March 20, 2025
        
        VISIT SUMMARY:
        Follow-up visit for hypertension and diabetes. Blood pressure still elevated.
        Blood sugar control improving but not at target.
        
        VITALS:
        Blood Pressure: 145/90 mmHg
        Heart Rate: 78 bpm
        Weight: 190 lbs
        
        PLAN:
        Increase lisinopril to 20mg daily
        Continue metformin 500mg twice daily
        Reinforce diet and exercise
        Follow up in 2 months
        """,
        
        """
        Patient: John Doe
        Date: May 10, 2025
        
        VISIT SUMMARY:
        Blood pressure improved with increased lisinopril dosage. Blood sugar 
        control needs improvement. Patient reports good medication adherence.
        
        VITALS:
        Blood Pressure: 138/85 mmHg
        Heart Rate: 76 bpm
        Weight: 185 lbs
        
        PLAN:
        Continue lisinopril 20mg daily
        Increase metformin to 1000mg twice daily
        Continue diet and exercise program
        Follow up in 2 months
        """
    ]
    
    cross_ref = cross_reference_with_records(new_document, existing_records)
    
    print("Cross-reference results:")
    print(json.dumps(cross_ref, indent=2))

def test_document_management():
    """Test document management features"""
    print("\n=== Testing Document Management ===")
    
    # Create temporary directory for testing
    test_dir = Path("./test_doc_management")
    if test_dir.exists():
        import shutil
        shutil.rmtree(test_dir)
    
    # Initialize document manager
    manager = DocumentManager(base_storage_path=str(test_dir))
    
    # Test document storage
    doc_id = "test_doc_001"
    content = "Patient: John Doe\nDate: July 2, 2025\nDiagnosis: Hypertension, Type 2 Diabetes\nMedications: Lisinopril 20mg, Metformin 1000mg"
    metadata = {
        "document_type": "visit_summary",
        "creation_date": "2025-07-02",
        "owner_id": "user1",
        "patient_id": "patient123"
    }
    
    print("1. Storing document...")
    success = manager.store_document(doc_id, content, metadata)
    print(f"   Success: {success}")
    
    # Test annotation
    print("\n2. Adding annotation...")
    annotation = {
        "text": "Important: Follow up on blood pressure medication",
        "position": {"page": 1, "x": 100, "y": 150},
        "type": "note",
        "color": "yellow"
    }
    manager.add_annotation(doc_id, annotation, "user1")
    
    # Test document sharing
    print("\n3. Sharing document...")
    manager.share_document(doc_id, ["user2", "user3"], "view")
    sharing_info = manager.get_sharing_info(doc_id)
    print(f"   Shared with {len(sharing_info.get('shared_with', {}))} users")
    
    # Test document retrieval
    print("\n4. Retrieving document...")
    document = manager.get_document(doc_id)
    print(f"   Document type: {document.get('metadata', {}).get('document_type')}")
    print(f"   Content length: {len(document.get('content', ''))}")
    
    # Test version history
    print("\n5. Getting version history...")
    versions = manager.get_version_history(doc_id)
    print(f"   Number of versions: {len(versions)}")
    for version in versions:
        print(f"   - v{version['version']}: {version['changes']}")
    
    # Test annotations retrieval
    print("\n6. Retrieving annotations...")
    annotations = manager.get_annotations(doc_id)
    print(f"   Number of annotations: {len(annotations)}")
    for ann in annotations:
        print(f"   - {ann.get('text')}")
    
    # Test document search
    print("\n7. Searching documents...")
    results = manager.search_documents("Hypertension")
    print(f"   Found {len(results)} documents")
    
    # Clean up test directory
    print("\n8. Cleaning up...")
    import shutil
    shutil.rmtree(test_dir)
    print("   Test directory removed")

def main():
    """Run all tests"""
    print("TESTING AI-ENHANCED DOCUMENT PROCESSING FEATURES")
    
    test_summarization()
    test_key_findings_extraction()
    test_trend_identification()
    test_cross_referencing()
    test_document_management()
    
    print("\n=== All tests completed successfully ===")

if __name__ == "__main__":
    main()
