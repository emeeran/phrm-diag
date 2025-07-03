"""
Document Processing API

This module provides a FastAPI-based API service for document processing,
including OCR, document categorization, and AI-enhanced processing features:
- Medical report summarization
- Key findings extraction
- Trend identification from documents
- Cross-reference with existing records
"""

import os
import uuid
import logging
import tempfile
import json
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel

from document_processing.ocr import OCRService, OCRProvider
from document_processing.categorization import DocumentCategorizer
from document_processing.enhancement import (
    summarize_report, 
    extract_key_findings, 
    identify_trends, 
    cross_reference_with_records
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PHRM-Diag Document Processing API",
    description="API for processing medical documents with OCR and intelligent categorization",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
document_categorizer = DocumentCategorizer()

# Request/response models
class DocumentProcessingResponse(BaseModel):
    document_id: str
    success: bool
    ocr_result: Optional[Dict[str, Any]] = None
    categorization: Optional[Dict[str, Any]] = None
    enhancements: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ProcessingStatus(BaseModel):
    document_id: str
    status: str
    progress: float
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class DocumentEnhancementRequest(BaseModel):
    document_id: str
    text: Optional[str] = None
    enhancement_types: List[str] = ["summary", "key_findings"]
    historical_document_ids: Optional[List[str]] = None
    cross_reference_document_ids: Optional[List[str]] = None

class AnnotationRequest(BaseModel):
    document_id: str
    annotations: Dict[str, Any]
    user_id: Optional[str] = None

class DocumentSharingRequest(BaseModel):
    document_id: str
    share_with_user_ids: List[str]
    permission_level: str = "view"  # view, edit, admin

# In-memory storage for processing status and documents (replace with a database in production)
processing_status = {}
document_storage = {}  # For storing processed documents
document_annotations = {}  # For storing document annotations
document_versions = {}  # For document version control
document_permissions = {}  # For document sharing permissions

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "services": {
            "ocr": "available", 
            "categorization": "available",
            "ai_enhancement": "available"
        }
    }

@app.post("/process-document", response_model=DocumentProcessingResponse)
async def process_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    enhance: bool = Form(False),
    summarize: bool = Form(False),
    extract_findings: bool = Form(False)
):
    """
    Process a document with OCR, categorization, and optional AI enhancements
    
    Args:
        file: The document file to process
        document_type: Optional hint for document type
        enhance: Whether to apply all AI enhancements
        summarize: Whether to generate a summary
        extract_findings: Whether to extract key findings
    
    Returns:
        Processing result with document ID for status checking
    """
    document_id = str(uuid.uuid4())
    
    try:
        # Save file to temporary location
        suffix = Path(file.filename).suffix if file.filename else ""
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_file_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        # Start processing in background
        background_tasks.add_task(
            process_document_task,
            document_id,
            temp_file_path,
            file.content_type,
            document_type,
            enhance,
            summarize,
            extract_findings
        )
        
        # Update status
        processing_status[document_id] = {
            "status": "processing",
            "progress": 0.0,
            "result": None,
            "error": None
        }
        
        return {
            "document_id": document_id,
            "success": True,
            "ocr_result": None,  # Will be available via status endpoint
            "categorization": None  # Will be available via status endpoint
        }
        
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}", exc_info=True)
        processing_status[document_id] = {
            "status": "failed",
            "progress": 0.0,
            "result": None,
            "error": str(e)
        }
        return {
            "document_id": document_id,
            "success": False,
            "error": str(e)
        }

def process_document_task(
    document_id: str,
    file_path: str,
    content_type: str,
    document_type: Optional[str] = None,
    enhance: bool = False,
    summarize: bool = False,
    extract_findings: bool = False
):
    """
    Background task for document processing
    
    Args:
        document_id: Unique identifier for the document
        file_path: Path to the temporary file
        content_type: MIME type of the file
        document_type: Optional hint for document type
        enhance: Whether to apply all AI enhancements
        summarize: Whether to generate a summary
        extract_findings: Whether to extract key findings
    """
    try:
        # Update status
        processing_status[document_id]["status"] = "processing_ocr"
        processing_status[document_id]["progress"] = 0.2
        
        # Process with OCR
        ocr_result = ocr_service.process_document(file_path, content_type)
        
        if not ocr_result.get("success", False):
            processing_status[document_id].update({
                "status": "failed",
                "progress": 0.0,
                "error": ocr_result.get("error", "OCR processing failed")
            })
            return
        
        # Extract text content
        document_text = ocr_result["text"]
        
        # Update status
        processing_status[document_id]["status"] = "processing_categorization"
        processing_status[document_id]["progress"] = 0.5
        
        # Analyze document with categorizer
        categorization = document_categorizer.analyze_document(
            document_text,
            doc_id=document_id
        )
        
        # Combine initial results
        result = {
            "ocr_result": ocr_result,
            "categorization": categorization,
            "enhancements": {}
        }
        
        # Store document in memory/database
        document_storage[document_id] = {
            "text": document_text,
            "metadata": {
                "content_type": content_type,
                "document_type": document_type or categorization.get("doc_type", "unknown"),
                "creation_date": categorization.get("dates", [None])[0],
                "processed_date": ocr_result.get("timestamp")
            }
        }
        
        # Initialize version control
        document_versions[document_id] = [{
            "version": 1,
            "timestamp": ocr_result.get("timestamp"),
            "changes": "Initial document processing"
        }]
        
        # Apply AI enhancements if requested
        if enhance or summarize or extract_findings:
            processing_status[document_id]["status"] = "enhancing_document"
            processing_status[document_id]["progress"] = 0.7
            
            enhancements = {}
            
            if summarize or enhance:
                logger.info(f"Generating summary for document {document_id}")
                enhancements["summary"] = summarize_report(document_text)
                
            if extract_findings or enhance:
                logger.info(f"Extracting key findings for document {document_id}")
                enhancements["key_findings"] = extract_key_findings(document_text)
            
            result["enhancements"] = enhancements
            
        # Update status
        processing_status[document_id].update({
            "status": "completed",
            "progress": 1.0,
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error in background processing: {str(e)}", exc_info=True)
        processing_status[document_id].update({
            "status": "failed",
            "progress": 0.0,
            "error": str(e)
        })
    finally:
        # Clean up temporary file
        try:
            os.unlink(file_path)
        except Exception as e:
            logger.warning(f"Failed to delete temporary file: {str(e)}")

@app.get("/document-status/{document_id}", response_model=ProcessingStatus)
async def get_document_status(document_id: str):
    """
    Check the status of document processing
    
    Args:
        document_id: The ID of the document being processed
    
    Returns:
        Current processing status and results if available
    """
    if document_id not in processing_status:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document_id": document_id,
        **processing_status[document_id]
    }

@app.post("/enhance-document")
async def enhance_document(request: DocumentEnhancementRequest):
    """
    Apply AI enhancements to a document
    
    Args:
        request: Enhancement request with document ID and enhancement types
    
    Returns:
        Enhanced document data
    """
    document_id = request.document_id
    
    # Check if document exists
    if document_id not in document_storage and not request.text:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document text
        document_text = request.text or document_storage[document_id]["text"]
        
        enhancements = {}
        
        # Apply requested enhancements
        if "summary" in request.enhancement_types:
            enhancements["summary"] = summarize_report(document_text)
            
        if "key_findings" in request.enhancement_types:
            enhancements["key_findings"] = extract_key_findings(document_text)
            
        # Process historical documents for trend analysis if provided
        if "trends" in request.enhancement_types and request.historical_document_ids:
            historical_docs = []
            
            # Get historical documents
            for hist_id in request.historical_document_ids:
                if hist_id in document_storage:
                    hist_doc = document_storage[hist_id]
                    
                    # Extract findings if not already done
                    if "key_findings" not in hist_doc.get("enhancements", {}):
                        findings = extract_key_findings(hist_doc["text"])
                    else:
                        findings = hist_doc["enhancements"]["key_findings"]
                    
                    historical_docs.append({
                        "document_id": hist_id,
                        "date": hist_doc["metadata"].get("creation_date"),
                        "findings": findings
                    })
            
            # Current document findings
            if "key_findings" in enhancements:
                current_findings = enhancements["key_findings"]
            else:
                current_findings = extract_key_findings(document_text)
                
            current_doc = {
                "document_id": document_id,
                "date": document_storage.get(document_id, {}).get("metadata", {}).get("creation_date"),
                "findings": current_findings
            }
            
            # Combine with historical data
            all_docs = historical_docs + [current_doc]
            
            # Only analyze if we have more than one document
            if len(all_docs) > 1:
                enhancements["trends"] = identify_trends(all_docs)
                
        # Cross-reference with existing records if requested
        if "cross_reference" in request.enhancement_types and request.cross_reference_document_ids:
            existing_records = []
            
            # Get text from referenced documents
            for ref_id in request.cross_reference_document_ids:
                if ref_id in document_storage:
                    existing_records.append(document_storage[ref_id]["text"])
            
            if existing_records:
                enhancements["cross_references"] = cross_reference_with_records(
                    document_text, existing_records
                )
                
                # Map document IDs to the results for better reference
                for i, ref in enumerate(enhancements["cross_references"].get("related_documents", [])):
                    if i < len(request.cross_reference_document_ids):
                        ref["document_id"] = request.cross_reference_document_ids[i]
        
        # Store enhancements with the document
        if document_id in document_storage:
            document_storage[document_id]["enhancements"] = enhancements
        
        return {
            "document_id": document_id,
            "enhancements": enhancements
        }
        
    except Exception as e:
        logger.error(f"Error enhancing document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/document/{document_id}/annotate")
async def annotate_document(document_id: str, request: AnnotationRequest):
    """
    Add annotations to a document
    
    Args:
        document_id: ID of the document to annotate
        request: Annotation data
        
    Returns:
        Updated annotation information
    """
    if document_id not in document_storage:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document_id not in document_annotations:
        document_annotations[document_id] = []
        
    # Add timestamp to annotation
    annotation = {
        **request.annotations,
        "timestamp": "auto-timestamp",  # Would use a real timestamp in production
        "user_id": request.user_id or "anonymous"
    }
    
    document_annotations[document_id].append(annotation)
    
    # Create a new version entry
    if document_id in document_versions:
        new_version = {
            "version": len(document_versions[document_id]) + 1,
            "timestamp": "auto-timestamp",  # Would use a real timestamp in production
            "changes": "Added annotation"
        }
        document_versions[document_id].append(new_version)
    
    return {
        "document_id": document_id,
        "annotations": document_annotations[document_id],
        "version": len(document_versions[document_id])
    }

@app.post("/document/{document_id}/share")
async def share_document(document_id: str, request: DocumentSharingRequest):
    """
    Share a document with other users
    
    Args:
        document_id: ID of the document to share
        request: Sharing details including user IDs and permission level
        
    Returns:
        Updated sharing information
    """
    if document_id not in document_storage:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document_id not in document_permissions:
        document_permissions[document_id] = {}
        
    # Set permissions for each user
    for user_id in request.share_with_user_ids:
        document_permissions[document_id][user_id] = request.permission_level
    
    return {
        "document_id": document_id,
        "shared_with": document_permissions[document_id]
    }

@app.get("/document/{document_id}/versions")
async def get_document_versions(document_id: str):
    """
    Get version history of a document
    
    Args:
        document_id: ID of the document
        
    Returns:
        List of document versions
    """
    if document_id not in document_versions:
        raise HTTPException(status_code=404, detail="Document version history not found")
    
    return {
        "document_id": document_id,
        "versions": document_versions[document_id]
    }

@app.get("/search")
async def search_documents(
    query: str,
    document_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 10
):
    """
    Search for documents based on keywords and filters
    
    Args:
        query: Search keywords
        document_type: Filter by document type
        date_from: Filter by date (from)
        date_to: Filter by date (to)
        limit: Maximum number of results
        
    Returns:
        List of matching documents
    """
    results = []
    
    for doc_id, doc in document_storage.items():
        # Simple text search implementation
        if query.lower() in doc["text"].lower():
            # Apply filters
            if document_type and doc["metadata"].get("document_type") != document_type:
                continue
                
            # Date filters would be applied here in a real implementation
            
            # Add to results
            results.append({
                "document_id": doc_id,
                "metadata": doc["metadata"],
                "snippet": doc["text"][:200] + "..."  # Text preview
            })
            
            if len(results) >= limit:
                break
    
    return {
        "query": query,
        "filters": {
            "document_type": document_type,
            "date_from": date_from,
            "date_to": date_to
        },
        "results_count": len(results),
        "results": results
    }

def start_api_server():
    """Start the API server"""
    uvicorn.run("document_processing.api:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start_api_server()
