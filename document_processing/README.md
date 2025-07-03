# PHRM-Diag Document Processing Module

This module provides advanced document processing capabilities for the PHRM-Diag application, including:

1. OCR integration for text extraction from images and PDFs
2. Medical document parsing
3. Lab result extraction
4. Prescription reading
5. Smart document categorization
6. Medical terminology extraction
7. Date and value parsing
8. Duplicate detection

## Features

### OCR Integration
- Local processing with Tesseract OCR
- Support for various document formats (PDF, JPG, PNG, TIFF)
- Preprocessing for improved OCR accuracy
- Future cloud OCR support (Google Vision, AWS Textract)

### Smart Categorization
- Automatic document classification (lab results, prescriptions, reports, etc.)
- Medical terminology extraction
- Date detection with context analysis
- Numeric value extraction with units and reference ranges
- Duplicate document detection

## Installation

### Prerequisites

- Python 3.8 or higher
- Tesseract OCR (v4.0+)

### Setup

1. Install Tesseract OCR:

   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install tesseract-ocr
   ```

   **macOS:**
   ```bash
   brew install tesseract
   ```

   **Windows:**
   Download and install from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Starting the Document Processing API Server

```bash
python main.py --mode api --port 8000
```

### Processing Documents via API

**Endpoint:** `POST /process-document`

**Request:**
- `file`: The document file to process (multipart/form-data)
- `document_type`: (Optional) Hint for document type

**Response:**
```json
{
  "document_id": "uuid-string",
  "success": true
}
```

**Check Processing Status:**
`GET /document-status/{document_id}`

**Response:**
```json
{
  "document_id": "uuid-string",
  "status": "completed",
  "progress": 1.0,
  "result": {
    "ocr_result": { ... },
    "categorization": { ... }
  }
}
```

### Command Line Usage

Process a single document:
```bash
python main.py --mode cli --file path/to/document.pdf --output results.json
```

Run tests:
```bash
python document_processing/test_processing.py --full
```

## Integration with PHRM-Diag

This module integrates with the PHRM-Diag application to provide:

1. Automatic extraction of health data from uploaded documents
2. Smart categorization and filing of medical records
3. Extraction of key medical values for analytics
4. Detection of duplicate documents
5. Enhanced search through extracted text and metadata

## Architecture

```
document_processing/
├── __init__.py
├── ocr.py            # OCR service integration
├── categorization.py # Document categorization
├── api.py            # FastAPI service
└── test_processing.py # Test utilities
```

## Future Enhancements

1. Integration with cloud OCR services
2. Machine learning-based document classification
3. Enhanced medical entity extraction with medical NLP models
4. Improved duplicate detection algorithms
5. Support for more document types and formats
