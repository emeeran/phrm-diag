"""
Test script for document processing functionality
"""

import sys
import os
import logging
from pathlib import Path
import argparse
import tempfile
import base64
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

def create_test_image(text: str, output_path: Optional[str] = None) -> str:
    """
    Create a test image with the given text
    
    Args:
        text: Text to render in the image
        output_path: Path to save the image (optional)
        
    Returns:
        Path to the created image
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        
        # Create a blank image
        width, height = 800, 600
        image = Image.new('RGB', (width, height), color=(255, 255, 255))
        draw = ImageDraw.Draw(image)
        
        try:
            # Try to use a default font
            font = ImageFont.truetype("Arial", 16)
        except IOError:
            # Fall back to default font
            font = ImageFont.load_default()
        
        # Draw text
        margin = 20
        x, y = margin, margin
        for line in text.split('\n'):
            draw.text((x, y), line, fill=(0, 0, 0), font=font)
            y += 24
        
        # Save the image
        if output_path:
            image_path = output_path
        else:
            # Create a temporary file
            fd, image_path = tempfile.mkstemp(suffix='.png')
            os.close(fd)
        
        image.save(image_path)
        logger.info(f"Test image created at {image_path}")
        return image_path
    
    except ImportError:
        logger.error("PIL or numpy not installed. Cannot create test image.")
        sys.exit(1)

def test_ocr(image_path: str):
    """
    Test OCR functionality
    
    Args:
        image_path: Path to the image to process
    """
    try:
        from document_processing.ocr import OCRService
        
        logger.info("Testing OCR functionality...")
        ocr_service = OCRService()
        
        result = ocr_service.process_document(image_path, "image/png")
        
        if result.get("success", False):
            logger.info("OCR successful!")
            logger.info(f"Extracted text: {result['text'][:200]}...")
        else:
            logger.error(f"OCR failed: {result.get('error', 'Unknown error')}")
    
    except ImportError:
        logger.error("Document processing module not found. Check your installation.")
        sys.exit(1)

def test_categorization(text: str):
    """
    Test categorization functionality
    
    Args:
        text: Text to categorize
    """
    try:
        from document_processing.categorization import DocumentCategorizer
        
        logger.info("Testing document categorization...")
        categorizer = DocumentCategorizer()
        
        result = categorizer.analyze_document(text)
        
        logger.info(f"Document type: {result['document_type']} (confidence: {result['classification_confidence']:.2f})")
        
        if result['medical_terms']:
            logger.info("Medical terms found:")
            for category, terms in result['medical_terms'].items():
                logger.info(f"  {category}: {', '.join(terms[:5])}" + 
                           (f" and {len(terms) - 5} more..." if len(terms) > 5 else ""))
        
        if result['dates']:
            logger.info("Dates found:")
            for date_info in result['dates'][:3]:
                logger.info(f"  {date_info['date']} ({date_info['type']})")
            if len(result['dates']) > 3:
                logger.info(f"  and {len(result['dates']) - 3} more...")
        
        if result['values']:
            logger.info("Numeric values found:")
            for value_info in result['values'][:3]:
                logger.info(f"  {value_info['raw_text']} ({value_info['type']})")
            if len(result['values']) > 3:
                logger.info(f"  and {len(result['values']) - 3} more...")
    
    except ImportError:
        logger.error("Document processing module not found. Check your installation.")
        sys.exit(1)

def test_full_pipeline():
    """Test the full document processing pipeline with a sample document"""
    # Sample text for lab results
    lab_result_text = """
    LABORATORY TEST RESULTS
    Patient: John Doe
    DOB: 01/15/1975
    Date Collected: 03/14/2023
    
    TEST               RESULT      REFERENCE RANGE      FLAG
    ------------------------------------------------------------------------
    Glucose           105 mg/dL    70-99 mg/dL          H
    HbA1c             5.8 %        <5.7 %               H
    Total Cholesterol 195 mg/dL    <200 mg/dL           
    HDL Cholesterol   45 mg/dL     >40 mg/dL            
    LDL Cholesterol   130 mg/dL    <100 mg/dL           H
    Triglycerides     150 mg/dL    <150 mg/dL           
    
    Comments: Patient shows borderline elevated glucose levels and HbA1c.
    Recommend follow-up in 3 months.
    """
    
    # Create test image
    image_path = create_test_image(lab_result_text)
    
    # Test OCR
    test_ocr(image_path)
    
    # Test categorization directly with text
    test_categorization(lab_result_text)
    
    # Clean up
    try:
        os.remove(image_path)
    except Exception as e:
        logger.warning(f"Failed to remove temporary file: {str(e)}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Test document processing functionality")
    parser.add_argument('--full', action='store_true', help="Run the full pipeline test")
    parser.add_argument('--ocr', help="Test OCR with the specified image")
    parser.add_argument('--categorize-file', help="Test categorization with text from the specified file")
    parser.add_argument('--categorize-text', help="Test categorization with the provided text")
    
    args = parser.parse_args()
    
    if args.full:
        test_full_pipeline()
    elif args.ocr:
        if not os.path.exists(args.ocr):
            logger.error(f"Image file not found: {args.ocr}")
            sys.exit(1)
        test_ocr(args.ocr)
    elif args.categorize_file:
        if not os.path.exists(args.categorize_file):
            logger.error(f"Text file not found: {args.categorize_file}")
            sys.exit(1)
        with open(args.categorize_file, 'r') as f:
            text = f.read()
        test_categorization(text)
    elif args.categorize_text:
        test_categorization(args.categorize_text)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
