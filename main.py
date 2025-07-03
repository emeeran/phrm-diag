#!/usr/bin/env python
"""
PHRM-Diag Document Processing Service

Main entry point for the document processing service that handles:
1. OCR service integration (Tesseract or cloud)
2. Medical document parsing
3. Lab result extraction
4. Prescription reading
5. Smart document categorization
6. AI-Enhanced document processing (summarization, key findings, trend analysis)
7. Document management features

Usage:
  python main.py [--mode {api|cli}] [--port PORT] [--host HOST]

Options:
  --mode MODE    Run mode: 'api' for REST API server, 'cli' for command line (default: api)
  --port PORT    Port for API server (default: 8000)
  --host HOST    Host for API server (default: 0.0.0.0)
"""

import sys
import os
import argparse
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="PHRM-Diag Document Processing Service")
    parser.add_argument('--mode', choices=['api', 'cli'], default='api',
                        help="Run mode: 'api' for REST API server, 'cli' for command line")
    parser.add_argument('--port', type=int, default=8000, help="Port for API server")
    parser.add_argument('--host', default='0.0.0.0', help="Host for API server")
    
    # CLI-specific arguments
    parser.add_argument('--file', help="Path to file for CLI processing")
    parser.add_argument('--output', help="Path for output in CLI mode")
    parser.add_argument('--enhance', action='store_true', help="Enable AI enhancement features")
    parser.add_argument('--summarize', action='store_true', help="Generate summary of document")
    parser.add_argument('--extract-findings', action='store_true', help="Extract key findings")
    parser.add_argument('--history', help="Path to file with historical documents for trend analysis")
    parser.add_argument('--cross-reference', help="Path to directory with records to cross-reference")
    
    return parser.parse_args()

def run_api_server(host, port):
    """Run the REST API server"""
    import uvicorn
    from document_processing.api import app
    
    logger.info(f"Starting document processing API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)

def run_cli(args):
    """Run in command line mode to process a single file"""
    from document_processing.ocr import OCRService
    from document_processing.categorization import DocumentCategorizer
    from document_processing.enhancement import summarize_report, extract_key_findings, identify_trends, cross_reference_with_records
    import json
    
    file_path = args.file
    output_path = args.output
    
    if not file_path:
        logger.error("File path must be provided in CLI mode")
        sys.exit(1)
    
    file_path = Path(file_path)
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        sys.exit(1)
        
    logger.info(f"Processing file: {file_path}")
    
    try:
        # Process with OCR
        ocr_service = OCRService()
        ocr_result = ocr_service.process_document(
            str(file_path),
            file_path.suffix.lower()
        )
        
        if not ocr_result.get("success", False):
            logger.error(f"OCR processing failed: {ocr_result.get('error', 'Unknown error')}")
            sys.exit(1)
        
        document_text = ocr_result["text"]
            
        # Analyze with categorizer
        categorizer = DocumentCategorizer()
        categorization = categorizer.analyze_document(document_text)
        
        # Combine results
        result = {
            "ocr_result": ocr_result,
            "categorization": categorization
        }
        
        # Apply AI enhancement if requested
        if args.enhance or args.summarize or args.extract_findings:
            enhancements = {}
            
            if args.summarize or args.enhance:
                logger.info("Generating document summary...")
                enhancements["summary"] = summarize_report(document_text)
                
            if args.extract_findings or args.enhance:
                logger.info("Extracting key findings...")
                enhancements["key_findings"] = extract_key_findings(document_text)
                
            # Add the enhancements to the result
            result["enhancements"] = enhancements
        
        # Process historical documents for trend analysis if provided
        if args.history:
            try:
                with open(args.history, 'r') as f:
                    history_data = json.load(f)
                    
                # Current document findings
                current_findings = extract_key_findings(document_text)
                current_doc = {
                    "date": categorization.get("dates", [None])[0],
                    "findings": current_findings
                }
                
                # Combine with historical data
                all_docs = history_data + [current_doc]
                
                logger.info("Analyzing trends in historical documents...")
                trends = identify_trends(all_docs)
                result["trends"] = trends
                
            except Exception as e:
                logger.error(f"Trend analysis failed: {str(e)}")
                result["trends_error"] = str(e)
        
        # Cross-reference with existing records if requested
        if args.cross_reference:
            ref_dir = Path(args.cross_reference)
            if ref_dir.is_dir():
                existing_records = []
                
                # Load all text files in the directory
                for text_file in ref_dir.glob("*.txt"):
                    try:
                        with open(text_file, 'r') as f:
                            existing_records.append(f.read())
                    except Exception as e:
                        logger.warning(f"Could not read {text_file}: {e}")
                
                if existing_records:
                    logger.info(f"Cross-referencing with {len(existing_records)} existing records...")
                    cross_ref = cross_reference_with_records(document_text, existing_records)
                    result["cross_references"] = cross_ref
                else:
                    logger.warning("No text records found for cross-referencing")
        
        # Output results
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)
            logger.info(f"Results saved to {output_path}")
        else:
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}", exc_info=True)
        sys.exit(1)

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        # Check for Tesseract
        from document_processing.ocr import OCRService
        ocr = OCRService()
        
        # Check for other Python dependencies
        import pytesseract
        import cv2
        from PIL import Image
        import numpy as np
        
        # Check for enhancement dependencies
        import spacy
        import networkx  # For our custom TextRank implementation
        import dateparser
        from sklearn.feature_extraction.text import TfidfVectorizer
        
        # Ensure spaCy model is available
        try:
            nlp = spacy.load("en_core_web_sm")
        except:
            logger.warning("spaCy model not found, attempting to download...")
            spacy.cli.download("en_core_web_sm")
        
        logger.info("All dependencies are available")
        return True
    except Exception as e:
        logger.error(f"Dependency check failed: {str(e)}")
        return False

def main():
    """Main entry point"""
    args = parse_args()
    
    logger.info(f"PHRM-Diag Document Processing Service - Mode: {args.mode}")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("Missing dependencies. Please install all required packages.")
        sys.exit(1)
    
    if args.mode == 'api':
        run_api_server(args.host, args.port)
    else:  # CLI mode
        run_cli(args)

if __name__ == "__main__":
    main()
