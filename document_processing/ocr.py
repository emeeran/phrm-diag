"""
OCR Service Integration Module

This module provides OCR functionality for medical documents using both
local (Tesseract) and cloud-based OCR options.
"""

import os
import io
import logging
from enum import Enum
from typing import Dict, List, Optional, Union, BinaryIO
import tempfile

import cv2
import numpy as np
from PIL import Image
import pytesseract
from pdf2image import convert_from_path, convert_from_bytes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCRProvider(Enum):
    """Enum for available OCR providers"""
    TESSERACT = "tesseract"
    CLOUD = "cloud"  # For future cloud providers like Google Vision, AWS Textract

class OCRService:
    """
    OCR service for processing medical documents
    
    This service provides:
    1. Text extraction from images and PDFs
    2. Medical document parsing
    3. Lab result extraction
    4. Prescription reading
    """
    
    def __init__(self, provider: OCRProvider = OCRProvider.TESSERACT):
        """
        Initialize OCR service with specified provider
        
        Args:
            provider: OCR provider to use (default: Tesseract)
        """
        self.provider = provider
        self._configure_provider()
        
    def _configure_provider(self):
        """Configure the selected OCR provider"""
        if self.provider == OCRProvider.TESSERACT:
            # Check if Tesseract is installed
            try:
                pytesseract.get_tesseract_version()
                logger.info("Tesseract version: %s", pytesseract.get_tesseract_version())
            except pytesseract.TesseractNotFoundError:
                logger.error("Tesseract is not installed or not in PATH")
                raise RuntimeError("Tesseract is not installed or not in PATH")
        elif self.provider == OCRProvider.CLOUD:
            # Future implementation for cloud providers
            logger.info("Cloud OCR provider selected")
            raise NotImplementedError("Cloud OCR provider not yet implemented")
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better OCR results
        
        Args:
            image: Image as numpy array
            
        Returns:
            Preprocessed image
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Noise removal
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        return opening
    
    def extract_text_from_image(self, image_data: Union[np.ndarray, bytes, str],
                               preprocess: bool = True) -> str:
        """
        Extract text from an image using OCR
        
        Args:
            image_data: Image data as numpy array, bytes, or file path
            preprocess: Whether to preprocess the image (default: True)
            
        Returns:
            Extracted text
        """
        if self.provider == OCRProvider.TESSERACT:
            # Handle different input types
            if isinstance(image_data, str):
                # Path to image file
                image = cv2.imread(image_data)
            elif isinstance(image_data, bytes):
                # Bytes data
                nparr = np.frombuffer(image_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            elif isinstance(image_data, np.ndarray):
                # Already a numpy array
                image = image_data
            else:
                raise ValueError("Unsupported image data type")
            
            # Preprocess if requested
            if preprocess:
                image = self.preprocess_image(image)
            
            # Extract text using pytesseract
            text = pytesseract.image_to_string(image)
            return text
        
        elif self.provider == OCRProvider.CLOUD:
            # Future implementation for cloud providers
            raise NotImplementedError("Cloud OCR provider not yet implemented")
    
    def extract_text_from_pdf(self, pdf_data: Union[bytes, str],
                             pages: Optional[List[int]] = None) -> Dict[int, str]:
        """
        Extract text from PDF using OCR
        
        Args:
            pdf_data: PDF data as bytes or file path
            pages: List of page numbers to process (None for all pages)
            
        Returns:
            Dictionary mapping page numbers to extracted text
        """
        # Convert PDF to images
        if isinstance(pdf_data, str):
            # It's a file path
            images = convert_from_path(pdf_data)
        else:
            # It's bytes data
            images = convert_from_bytes(pdf_data)
        
        # Filter pages if specified
        if pages is not None:
            images = [img for i, img in enumerate(images) if i+1 in pages]
        
        # Process each page
        results = {}
        for i, image in enumerate(images):
            # Convert PIL Image to numpy array for processing
            open_cv_image = np.array(image)
            open_cv_image = open_cv_image[:, :, ::-1].copy()  # RGB to BGR
            
            # Extract text
            page_text = self.extract_text_from_image(open_cv_image)
            page_num = pages[i] if pages is not None else i+1
            results[page_num] = page_text
        
        return results
    
    def process_document(self, file_data: Union[bytes, str], 
                        file_type: str) -> Dict[str, Union[str, Dict]]:
        """
        Process a document and extract text
        
        Args:
            file_data: File data as bytes or file path
            file_type: File MIME type or extension
            
        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            if file_type.lower() in ['application/pdf', '.pdf', 'pdf']:
                text_by_page = self.extract_text_from_pdf(file_data)
                full_text = '\n'.join(text_by_page.values())
                
                return {
                    "success": True,
                    "text": full_text,
                    "pages": len(text_by_page),
                    "text_by_page": text_by_page,
                    "provider": self.provider.value
                }
                
            elif file_type.lower() in ['image/jpeg', 'image/png', 'image/tiff', 
                                    '.jpg', '.jpeg', '.png', '.tiff',
                                    'jpg', 'jpeg', 'png', 'tiff']:
                text = self.extract_text_from_image(file_data)
                
                return {
                    "success": True,
                    "text": text,
                    "pages": 1,
                    "provider": self.provider.value
                }
                
            else:
                return {
                    "success": False,
                    "error": f"Unsupported file type: {file_type}"
                }
                
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
