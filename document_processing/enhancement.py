# document_processing/enhancement.py

"""
This module provides AI-enhanced processing capabilities for medical documents,
including summarization, key findings extraction, trend identification, and
cross-referencing with existing patient records.
"""

import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import dateparser
from transformers import pipeline
import networkx as nx
from typing import List
from collections import defaultdict

# We'll use the standard English language model
# python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading 'en_core_web_sm' model. Please wait...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize HuggingFace transformers for named entity recognition
try:
    ner_pipeline = pipeline("ner", model="tmls/bert-large-finetuned-clinical")
except Exception as e:
    print(f"Could not load specialized NER model: {e}")
    print("Using default NER pipeline")
    ner_pipeline = pipeline("ner")

def _text_rank_sentence_similarity(sentence1: str, sentence2: str) -> float:
    """Calculate similarity between two sentences based on word overlap."""
    words1 = set(word.lower() for word in sentence1.split())
    words2 = set(word.lower() for word in sentence2.split())
    
    # Avoid division by zero
    if not words1 or not words2:
        return 0.0
        
    intersection = words1.intersection(words2)
    return len(intersection) / (np.log(len(words1) + 1) + np.log(len(words2) + 1))

def _build_similarity_graph(sentences: List[str]) -> nx.Graph:
    """Build a graph where nodes are sentences and edges represent similarity."""
    graph = nx.Graph()
    graph.add_nodes_from(range(len(sentences)))
    
    for i in range(len(sentences)):
        for j in range(i+1, len(sentences)):
            similarity = _text_rank_sentence_similarity(sentences[i], sentences[j])
            if similarity > 0:  # Only add edges with non-zero similarity
                graph.add_edge(i, j, weight=similarity)
                
    return graph

def summarize_report(text: str, ratio: float = 0.2) -> str:
    """
    Summarizes a medical report using a TextRank algorithm implementation.
    
    Args:
        text: The text to summarize
        ratio: The target ratio of the summary length to the original text length
        
    Returns:
        A summary of the text
    """
    # Split text into sentences
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    
    if len(sentences) < 3:
        return text
    
    # Build similarity graph
    graph = _build_similarity_graph(sentences)
    
    # Apply PageRank algorithm
    try:
        scores = nx.pagerank(graph)
    except:
        # If PageRank fails (e.g., due to disconnected graph), fall back to a simpler approach
        return " ".join(sentences[:max(1, int(len(sentences) * ratio))])
    
    # Sort sentences by score
    ranked_sentences = sorted(((scores[i], sentence) for i, sentence in enumerate(sentences)), reverse=True)
    
    # Select top sentences
    summary_length = max(1, int(len(sentences) * ratio))
    summary_sentences = [sentence for _, sentence in ranked_sentences[:summary_length]]
    
    # Restore original order
    ordered_summary = [sentence for sentence in sentences if sentence in summary_sentences]
    
    return " ".join(ordered_summary)


def extract_key_findings(text: str) -> dict:
    """
    Extracts key findings from a medical report, using advanced NLP techniques
    to identify medical conditions, medications, measurements, and important dates.
    
    Returns a structured dictionary of findings with normalized values where possible.
    """
    findings = {
        "conditions": [],
        "medications": [],
        "measurements": {},
        "dates": {},
        "patient_info": {},
    }
    
    # Use spaCy for initial entity recognition
    doc = nlp(text)
    
    # Extract potential measurements with regex patterns
    measurement_patterns = [
        (r"(\d+\.?\d*)\s*(?:mmHg|mm Hg)", "blood_pressure"),
        (r"(\d+\.?\d*)\s*(?:mg/dL|mg\/dL)", "glucose"),
        (r"(\d+\.?\d*)\s*(?:kg/m2|kg\/m2|BMI)", "bmi"),
        (r"(\d+\.?\d*)\s*(?:kg|lbs)", "weight"),
        (r"(\d+\.?\d*)\s*(?:cm|m)\s+(?:height|tall)", "height"),
        (r"(\d+)\s*(?:bpm)", "heart_rate"),
        (r"(\d+)/(\d+)", "blood_pressure"),  # e.g., 120/80
    ]
    
    for pattern, category in measurement_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Extract surrounding context for better interpretation
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            context = text[start:end]
            
            if category not in findings["measurements"]:
                findings["measurements"][category] = []
            
            findings["measurements"][category].append({
                "value": match.group(0),
                "context": context
            })
    
    # Extract dates with dateparser
    date_matches = re.finditer(r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b", text, re.IGNORECASE)
    for match in date_matches:
        date_text = match.group(0)
        parsed_date = dateparser.parse(date_text)
        if parsed_date:
            # Get context around the date
            start = max(0, match.start() - 40)
            end = min(len(text), match.end() + 40)
            context = text[start:end]
            
            # Try to determine what type of date this is
            date_type = "unknown"
            context_lower = context.lower()
            if any(term in context_lower for term in ["appointment", "visit", "follow-up", "followup", "check-up", "scheduled"]):
                date_type = "appointment"
            elif any(term in context_lower for term in ["prescribed", "prescription", "medication", "take", "dose"]):
                date_type = "prescription"
            elif any(term in context_lower for term in ["test", "lab", "result", "blood", "sample", "specimen"]):
                date_type = "lab_result"
                
            if date_type not in findings["dates"]:
                findings["dates"][date_type] = []
                
            findings["dates"][date_type].append({
                "date": parsed_date.strftime("%Y-%m-%d"),
                "original": date_text,
                "context": context
            })
    
    # Use transformers for advanced NER
    try:
        ner_results = ner_pipeline(text)
        
        # Group by entity type
        entity_groups = defaultdict(list)
        for entity in ner_results:
            entity_groups[entity["entity"]].append({
                "text": entity["word"],
                "score": entity["score"]
            })
            
        # Map to our categories
        for entity_type, entities in entity_groups.items():
            if "DISEASE" in entity_type or "CONDITION" in entity_type or "PROBLEM" in entity_type or "SYMPTOM" in entity_type:
                # Add unique conditions
                condition_texts = set([e["text"] for e in entities if e["score"] > 0.7])
                findings["conditions"].extend(condition_texts)
            
            elif "DRUG" in entity_type or "TREATMENT" in entity_type or "MEDICATION" in entity_type:
                med_texts = set([e["text"] for e in entities if e["score"] > 0.7])
                findings["medications"].extend(med_texts)
                
            elif "PATIENT" in entity_type or "PERSON" in entity_type or "DEMOGRAPHIC" in entity_type:
                for e in entities:
                    if e["score"] > 0.8:
                        findings["patient_info"][e["text"]] = e["score"]
    except Exception as e:
        # If transformer-based NER fails, we'll rely on the spaCy entities
        print(f"Advanced NER failed: {e}")
    
    except Exception as e:
        # Fallback to spaCy entities if transformer-based NER fails
        print(f"Advanced NER failed: {e}. Falling back to spaCy.")
        for ent in doc.ents:
            if ent.label_ in ["DISEASE", "CONDITION"]:
                findings["conditions"].append(ent.text)
            elif ent.label_ in ["CHEMICAL", "DRUG"]:
                findings["medications"].append(ent.text)

    # Remove duplicates
    findings["conditions"] = list(set(findings["conditions"]))
    findings["medications"] = list(set(findings["medications"]))
    
    return findings

def identify_trends(documents: list[dict]) -> dict:
    """
    Identifies trends from a series of documents over time.
    
    Parameters:
    - documents: A list of document dictionaries, each containing at minimum a 'date' 
      field and findings from extract_key_findings.
      
    Returns:
    - A dictionary containing identified trends, statistical analysis, and visualizable data.
    """
    if not documents or len(documents) < 2:
        return {"error": "Insufficient data for trend analysis"}
    
    # Sort documents by date for proper trend analysis
    try:
        sorted_docs = sorted(documents, key=lambda x: dateparser.parse(x.get("date", "")))
    except Exception as e:
        print(f"Error sorting documents by date: {e}")
        sorted_docs = documents  # Fall back to original order
    
    trends = {
        "measurements": {},
        "conditions": {},
        "medications": {},
        "changes": []
    }
    
    # Track unique values across all documents to detect patterns
    all_measurements = {}
    all_conditions = set()
    all_medications = set()
    
    # Process each document
    for i, doc in enumerate(sorted_docs):
        date = doc.get("date", "unknown")
        findings = doc.get("findings", {})
        
        # Process measurements (e.g., blood pressure, glucose)
        measurements = findings.get("measurements", {})
        for measurement_type, values in measurements.items():
            if isinstance(values, list):
                for value_item in values:
                    # Handle both string and dictionary value formats
                    value = value_item if isinstance(value_item, str) else value_item.get("value", "")
                    
                    # Extract numeric values for trend analysis
                    numeric_values = re.findall(r"(\d+\.?\d*)", value)
                    if numeric_values:
                        if measurement_type not in trends["measurements"]:
                            trends["measurements"][measurement_type] = []
                        
                        # Store the value with its date for time series analysis
                        trends["measurements"][measurement_type].append({
                            "date": date,
                            "value": float(numeric_values[0]),  # Use first numeric value
                            "original": value
                        })
                        
                        # Track in all_measurements for overall statistics
                        if measurement_type not in all_measurements:
                            all_measurements[measurement_type] = []
                        all_measurements[measurement_type].append(float(numeric_values[0]))
            
        # Track conditions for persistence analysis
        conditions = findings.get("conditions", [])
        for condition in conditions:
            if condition not in trends["conditions"]:
                trends["conditions"][condition] = []
            trends["conditions"][condition].append(date)
            all_conditions.add(condition)
            
        # Track medications for adherence/change analysis
        medications = findings.get("medications", [])
        for medication in medications:
            if medication not in trends["medications"]:
                trends["medications"][medication] = []
            trends["medications"][medication].append(date)
            all_medications.add(medication)
            
        # Detect significant changes between consecutive documents
        if i > 0:
            prev_doc = sorted_docs[i-1]
            prev_findings = prev_doc.get("findings", {})
            
            # Compare measurements for significant changes
            for m_type, values in all_measurements.items():
                if len(values) >= 2:
                    # Get the last two values for this measurement
                    curr_values = [v["value"] for v in trends["measurements"].get(m_type, []) 
                                 if v["date"] == date]
                    prev_values = [v["value"] for v in trends["measurements"].get(m_type, []) 
                                 if v["date"] == prev_doc.get("date", "")]
                    
                    if curr_values and prev_values:
                        change_pct = ((curr_values[-1] - prev_values[-1]) / prev_values[-1]) * 100
                        if abs(change_pct) > 10:  # Significant change threshold
                            trends["changes"].append({
                                "type": "measurement",
                                "name": m_type,
                                "from_date": prev_doc.get("date", ""),
                                "to_date": date,
                                "from_value": prev_values[-1],
                                "to_value": curr_values[-1],
                                "change_percent": change_pct,
                                "direction": "increase" if change_pct > 0 else "decrease"
                            })
    
    # Calculate statistics for measurements
    for m_type, values in all_measurements.items():
        if m_type in trends["measurements"] and len(values) > 1:
            values_array = np.array(values)
            trends["measurements"][m_type + "_stats"] = {
                "min": float(np.min(values_array)),
                "max": float(np.max(values_array)),
                "mean": float(np.mean(values_array)),
                "median": float(np.median(values_array)),
                "std_dev": float(np.std(values_array)),
                "trend_direction": "increasing" if values[-1] > values[0] else "decreasing" if values[-1] < values[0] else "stable",
                "data_points": len(values)
            }
    
    # Analyze medication adherence and changes
    medication_changes = []
    for med, dates in trends["medications"].items():
        # Check for medication gaps
        if len(dates) > 1:
            date_objs = [dateparser.parse(d) for d in dates]
            gaps = [(date_objs[i+1] - date_objs[i]).days for i in range(len(date_objs)-1)]
            avg_gap = sum(gaps) / len(gaps)
            
            if avg_gap > 45:  # Potential non-adherence or prescription changes
                medication_changes.append({
                    "medication": med,
                    "average_gap_days": avg_gap,
                    "potential_issue": "Possible non-adherence or intermittent use"
                })
    
    trends["medication_patterns"] = medication_changes
    
    return trends

def cross_reference_with_records(document_text: str, existing_records: list[str]) -> dict:
    """
    Cross-references a new document with existing records to find connections
    and similarities between documents.
    
    Parameters:
    - document_text: The text content of the new document
    - existing_records: A list of text strings from existing patient records
    
    Returns:
    - A dictionary with related documents and their similarity metrics
    """
    if not existing_records:
        return {"related_documents": []}

    # Extract key medical terms for better matching
    doc = nlp(document_text)
    doc_key_terms = set()
    for ent in doc.ents:
        if ent.label_ in ["DISEASE", "CONDITION", "CHEMICAL", "DRUG", "TREATMENT"]:
            doc_key_terms.add(ent.text.lower())
    
    # Extract key dates for temporal correlation
    date_pattern = r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b"
    doc_dates = set([d.group(0) for d in re.finditer(date_pattern, document_text, re.IGNORECASE)])
    
    # Use TF-IDF for semantic similarity
    vectorizer = TfidfVectorizer(
        stop_words='english', 
        ngram_range=(1, 2),  # Include bigrams for better context
        min_df=1, 
        max_df=0.9
    )
    all_texts = [document_text] + existing_records
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Calculate cosine similarity between the document and all existing records
    cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    
    # Prepare results
    related_docs = []
    
    for i, record_text in enumerate(existing_records):
        # Get similarity score from TF-IDF
        similarity_score = float(cosine_similarities[i])
        
        # Additional relevance metrics
        relevance_data = {}
        
        # Check for shared medical terms
        record_doc = nlp(record_text)
        record_key_terms = set()
        for ent in record_doc.ents:
            if ent.label_ in ["DISEASE", "CONDITION", "CHEMICAL", "DRUG", "TREATMENT"]:
                record_key_terms.add(ent.text.lower())
        
        shared_terms = doc_key_terms.intersection(record_key_terms)
        term_overlap_score = len(shared_terms) / max(len(doc_key_terms), 1)
        
        # Check for temporal proximity via date mentions
        record_dates = set([d.group(0) for d in re.finditer(date_pattern, record_text, re.IGNORECASE)])
        shared_dates = doc_dates.intersection(record_dates)
        date_overlap = len(shared_dates) / max(len(doc_dates), 1) if doc_dates else 0
        
        # Calculate combined relevance score (weighted average)
        combined_score = (similarity_score * 0.6) + (term_overlap_score * 0.3) + (date_overlap * 0.1)
        
        if similarity_score > 0.2 or term_overlap_score > 0.3:  # Lower threshold for medical relevance
            relevance_data = {
                "shared_medical_terms": list(shared_terms),
                "term_overlap_score": term_overlap_score,
                "shared_dates": list(shared_dates),
                "date_overlap_score": date_overlap
            }
            
            related_docs.append({
                "record_index": i,
                "similarity_score": similarity_score,
                "combined_relevance_score": combined_score,
                "relevance_data": relevance_data
            })
    
    # Sort by combined relevance score
    related_docs.sort(key=lambda x: x["combined_relevance_score"], reverse=True)
            
    return {
        "related_documents": related_docs,
        "total_analyzed": len(existing_records)
    }

if __name__ == '__main__':
    # Example Usage
    sample_report = """
    Patient Name: John Doe. Date: 2025-07-03.
    Diagnosis: Type 2 Diabetes.
    Prescription: Metformin 500mg daily.
    Notes: Patient reports stable blood sugar levels.
    Blood Pressure: 130/85 mmHg.
    Follow-up in 3 months.
    """

    summary = summarize_report(sample_report)
    print("--- Summary ---")
    print(summary)

    findings = extract_key_findings(sample_report)
    print("\n--- Key Findings ---")
    print(findings)

    # Trend analysis example
    docs = [
        {"date": "2025-01-15", "findings": {"measurements": ["Blood Pressure: 140/90 mmHg"]}},
        {"date": "2025-04-20", "findings": {"measurements": ["Blood Pressure: 135/88 mmHg"]}},
        {"date": "2025-07-03", "findings": {"measurements": ["Blood Pressure: 130/85 mmHg"]}},
    ]
    trends = identify_trends(docs)
    print("\n--- Trends ---")
    print(trends)

    # Cross-reference example
    existing = [
        "Previous visit noted high blood sugar and hypertension.",
        "Patient has a family history of heart disease."
    ]
    cross_ref = cross_reference_with_records(sample_report, existing)
    print("\n--- Cross-References ---")
    print(cross_ref)
