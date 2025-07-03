"""
Document Management Module

This module provides document management functionality including:
1. Version control for documents
2. Document sharing with family
3. Annotation and note-taking
4. Document search and indexing
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
import shutil
from pathlib import Path

class DocumentManager:
    """
    Document Manager class for handling document storage, versioning, sharing,
    and annotations.
    """
    
    def __init__(self, base_storage_path: str = "document_storage"):
        """
        Initialize the Document Manager
        
        Args:
            base_storage_path: Base path for document storage
        """
        self.base_path = Path(base_storage_path)
        self.documents_path = self.base_path / "documents"
        self.versions_path = self.base_path / "versions"
        self.annotations_path = self.base_path / "annotations"
        self.shares_path = self.base_path / "shares"
        self.index_path = self.base_path / "index"
        
        # Create directory structure if it doesn't exist
        for path in [self.base_path, self.documents_path, self.versions_path, 
                    self.annotations_path, self.shares_path, self.index_path]:
            path.mkdir(exist_ok=True, parents=True)
        
    def store_document(self, document_id: str, content: str, metadata: Dict) -> bool:
        """
        Store a document with its metadata
        
        Args:
            document_id: Unique document identifier
            content: Document content (text)
            metadata: Document metadata
            
        Returns:
            True if successful, False otherwise
        """
        try:
            doc_path = self.documents_path / document_id
            doc_path.mkdir(exist_ok=True)
            
            # Store content
            with open(doc_path / "content.txt", "w") as f:
                f.write(content)
                
            # Store metadata
            with open(doc_path / "metadata.json", "w") as f:
                json.dump(metadata, f, indent=2)
                
            # Initialize version control
            self._create_initial_version(document_id, metadata)
                
            return True
        except Exception as e:
            print(f"Error storing document: {e}")
            return False
            
    def _create_initial_version(self, document_id: str, metadata: Dict) -> None:
        """Create the initial version record for a document"""
        version_info = {
            "version": 1,
            "timestamp": datetime.now().isoformat(),
            "changes": "Initial document creation",
            "metadata": metadata
        }
        
        version_path = self.versions_path / document_id
        version_path.mkdir(exist_ok=True)
        
        with open(version_path / "v1.json", "w") as f:
            json.dump(version_info, f, indent=2)
            
    def create_version(self, document_id: str, changes: str) -> int:
        """
        Create a new version of a document
        
        Args:
            document_id: Document identifier
            changes: Description of changes
            
        Returns:
            New version number
        """
        version_path = self.versions_path / document_id
        if not version_path.exists():
            version_path.mkdir(exist_ok=True)
            current_version = 0
        else:
            # Find current version
            versions = [int(f.stem[1:]) for f in version_path.glob("v*.json")]
            current_version = max(versions) if versions else 0
            
        # Create new version
        new_version = current_version + 1
        version_info = {
            "version": new_version,
            "timestamp": datetime.now().isoformat(),
            "changes": changes
        }
        
        with open(version_path / f"v{new_version}.json", "w") as f:
            json.dump(version_info, f, indent=2)
            
        return new_version
        
    def get_document(self, document_id: str) -> Dict:
        """
        Retrieve a document by ID
        
        Args:
            document_id: Document identifier
            
        Returns:
            Document content and metadata
        """
        doc_path = self.documents_path / document_id
        
        if not doc_path.exists():
            raise ValueError(f"Document {document_id} not found")
            
        # Read content
        with open(doc_path / "content.txt", "r") as f:
            content = f.read()
            
        # Read metadata
        with open(doc_path / "metadata.json", "r") as f:
            metadata = json.load(f)
            
        return {
            "document_id": document_id,
            "content": content,
            "metadata": metadata
        }
        
    def get_version_history(self, document_id: str) -> List[Dict]:
        """
        Get version history for a document
        
        Args:
            document_id: Document identifier
            
        Returns:
            List of version information
        """
        version_path = self.versions_path / document_id
        
        if not version_path.exists():
            return []
            
        versions = []
        for version_file in sorted(version_path.glob("v*.json")):
            with open(version_file, "r") as f:
                versions.append(json.load(f))
                
        return versions
        
    def add_annotation(self, document_id: str, annotation: Dict, user_id: str) -> bool:
        """
        Add an annotation to a document
        
        Args:
            document_id: Document identifier
            annotation: Annotation data
            user_id: ID of the user making the annotation
            
        Returns:
            True if successful
        """
        annotation_path = self.annotations_path / document_id
        annotation_path.mkdir(exist_ok=True)
        
        # Generate annotation ID
        annotation_id = f"{int(datetime.now().timestamp())}"
        
        # Add metadata to annotation
        full_annotation = {
            **annotation,
            "annotation_id": annotation_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
        
        # Save annotation
        with open(annotation_path / f"{annotation_id}.json", "w") as f:
            json.dump(full_annotation, f, indent=2)
            
        # Create a new document version
        self.create_version(document_id, f"Added annotation {annotation_id}")
            
        return True
        
    def get_annotations(self, document_id: str) -> List[Dict]:
        """
        Get all annotations for a document
        
        Args:
            document_id: Document identifier
            
        Returns:
            List of annotations
        """
        annotation_path = self.annotations_path / document_id
        
        if not annotation_path.exists():
            return []
            
        annotations = []
        for annotation_file in annotation_path.glob("*.json"):
            with open(annotation_file, "r") as f:
                annotations.append(json.load(f))
                
        # Sort by timestamp
        annotations.sort(key=lambda x: x.get("timestamp", ""))
        return annotations
        
    def share_document(self, document_id: str, user_ids: List[str], permission_level: str) -> bool:
        """
        Share a document with other users
        
        Args:
            document_id: Document identifier
            user_ids: List of user IDs to share with
            permission_level: Permission level (view, edit, admin)
            
        Returns:
            True if successful
        """
        share_path = self.shares_path / document_id
        share_path.mkdir(exist_ok=True)
        
        sharing_info = {
            "document_id": document_id,
            "shared_with": {},
            "timestamp": datetime.now().isoformat()
        }
        
        # Load existing sharing info if available
        share_file = share_path / "sharing.json"
        if share_file.exists():
            with open(share_file, "r") as f:
                sharing_info = json.load(f)
                
        # Update sharing permissions
        for user_id in user_ids:
            sharing_info["shared_with"][user_id] = permission_level
            
        # Save sharing info
        with open(share_file, "w") as f:
            json.dump(sharing_info, f, indent=2)
            
        return True
        
    def get_sharing_info(self, document_id: str) -> Dict:
        """
        Get sharing information for a document
        
        Args:
            document_id: Document identifier
            
        Returns:
            Sharing information
        """
        share_path = self.shares_path / document_id / "sharing.json"
        
        if not share_path.exists():
            return {
                "document_id": document_id,
                "shared_with": {}
            }
            
        with open(share_path, "r") as f:
            return json.load(f)
            
    def search_documents(self, query: str, filters: Dict = None) -> List[Dict]:
        """
        Search for documents based on keywords and filters
        
        Args:
            query: Search query
            filters: Additional search filters
            
        Returns:
            List of matching documents
        """
        results = []
        filters = filters or {}
        
        # Simple implementation - in a real system, use a proper search index
        for doc_dir in self.documents_path.glob("*"):
            if not doc_dir.is_dir():
                continue
                
            document_id = doc_dir.name
            
            # Read metadata
            try:
                with open(doc_dir / "metadata.json", "r") as f:
                    metadata = json.load(f)
                    
                # Apply filters
                if filters.get("document_type") and metadata.get("document_type") != filters["document_type"]:
                    continue
                    
                if filters.get("date_from") and metadata.get("creation_date", "") < filters["date_from"]:
                    continue
                    
                if filters.get("date_to") and metadata.get("creation_date", "") > filters["date_to"]:
                    continue
                
                # Check content for query
                with open(doc_dir / "content.txt", "r") as f:
                    content = f.read()
                    
                if query.lower() in content.lower() or query.lower() in str(metadata).lower():
                    # Match found
                    results.append({
                        "document_id": document_id,
                        "metadata": metadata,
                        "snippet": content[:200] + "..." if len(content) > 200 else content
                    })
            except Exception as e:
                print(f"Error searching document {document_id}: {e}")
                continue
                
        return results
        
    def get_document_by_type(self, doc_type: str, limit: int = 10) -> List[Dict]:
        """
        Get documents of a specific type
        
        Args:
            doc_type: Document type
            limit: Maximum number of documents to return
            
        Returns:
            List of matching documents
        """
        results = []
        
        for doc_dir in self.documents_path.glob("*"):
            if not doc_dir.is_dir():
                continue
                
            document_id = doc_dir.name
            
            try:
                # Read metadata
                with open(doc_dir / "metadata.json", "r") as f:
                    metadata = json.load(f)
                    
                if metadata.get("document_type") == doc_type:
                    results.append({
                        "document_id": document_id,
                        "metadata": metadata
                    })
                    
                    if len(results) >= limit:
                        break
            except Exception:
                continue
                
        return results
        
    def get_user_documents(self, user_id: str) -> List[Dict]:
        """
        Get documents owned by or shared with a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of documents
        """
        owned_docs = []
        shared_docs = []
        
        # Find owned documents
        for doc_dir in self.documents_path.glob("*"):
            if not doc_dir.is_dir():
                continue
                
            document_id = doc_dir.name
            
            try:
                # Read metadata
                with open(doc_dir / "metadata.json", "r") as f:
                    metadata = json.load(f)
                    
                if metadata.get("owner_id") == user_id:
                    owned_docs.append({
                        "document_id": document_id,
                        "metadata": metadata,
                        "ownership": "owned"
                    })
            except Exception:
                continue
                
        # Find shared documents
        for share_file in self.shares_path.glob("*/sharing.json"):
            try:
                with open(share_file, "r") as f:
                    sharing_info = json.load(f)
                    
                if user_id in sharing_info.get("shared_with", {}):
                    document_id = sharing_info.get("document_id")
                    
                    # Get document metadata
                    metadata_file = self.documents_path / document_id / "metadata.json"
                    if metadata_file.exists():
                        with open(metadata_file, "r") as f:
                            metadata = json.load(f)
                            
                        shared_docs.append({
                            "document_id": document_id,
                            "metadata": metadata,
                            "ownership": "shared",
                            "permission_level": sharing_info["shared_with"][user_id]
                        })
            except Exception:
                continue
                
        return owned_docs + shared_docs

# Example usage
if __name__ == "__main__":
    manager = DocumentManager()
    
    # Store a document
    doc_id = "test123"
    content = "This is a test document with medical information."
    metadata = {
        "document_type": "lab_result",
        "creation_date": "2025-07-02",
        "owner_id": "user1"
    }
    
    manager.store_document(doc_id, content, metadata)
    
    # Add an annotation
    annotation = {
        "text": "Important lab result",
        "position": {"page": 1, "x": 100, "y": 200},
        "color": "yellow"
    }
    
    manager.add_annotation(doc_id, annotation, "user1")
    
    # Share the document
    manager.share_document(doc_id, ["user2", "user3"], "view")
    
    # Get document
    doc = manager.get_document(doc_id)
    print(f"Document: {doc}")
    
    # Get version history
    versions = manager.get_version_history(doc_id)
    print(f"Versions: {versions}")
    
    # Get annotations
    annotations = manager.get_annotations(doc_id)
    print(f"Annotations: {annotations}")
    
    # Get sharing info
    sharing = manager.get_sharing_info(doc_id)
    print(f"Sharing: {sharing}")
    
    # Search
    search_results = manager.search_documents("medical")
    print(f"Search results: {search_results}")
