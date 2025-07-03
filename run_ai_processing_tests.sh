#!/bin/bash

# Test script for AI-Enhanced Document Processing features
# This script runs the test_ai_processing.py to validate
# all the Week 16 features.

# Set up colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====================================${NC}"
echo -e "${YELLOW}PHRM-Diag AI Processing Test Runner${NC}"
echo -e "${YELLOW}====================================${NC}"

# Check if Python environment is set up
echo -e "\n${GREEN}Checking Python environment...${NC}"
if command -v python3 &> /dev/null
then
    PYTHON="python3"
elif command -v python &> /dev/null
then
    PYTHON="python"
else
    echo -e "${RED}Error: Python is not installed${NC}"
    exit 1
fi

# Check for required packages
echo -e "\n${GREEN}Checking required packages...${NC}"
$PYTHON -c "
import sys
try:
    import spacy
    import gensim
    import sklearn
    import numpy
    import transformers
    import dateparser
    import networkx
    print('All required packages are installed')
except ImportError as e:
    print(f'Missing package: {str(e)}')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo -e "${RED}Please install the required packages:${NC}"
    echo "pip install spacy gensim scikit-learn numpy transformers dateparser networkx"
    exit 1
fi

# Check for spacy model
echo -e "\n${GREEN}Checking for spaCy model...${NC}"
$PYTHON -c "
import sys
try:
    import spacy
    try:
        spacy.load('en_core_web_sm')
        print('spaCy model is installed')
    except:
        print('Installing spaCy model...')
        spacy.cli.download('en_core_web_sm')
        print('spaCy model installed successfully')
except Exception as e:
    print(f'Error: {str(e)}')
    sys.exit(1)
"

# Run the tests
echo -e "\n${GREEN}Running AI document processing tests...${NC}"
cd "$(dirname "$0")"
$PYTHON document_processing/test_ai_processing.py

# Check if tests succeeded
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    echo -e "${GREEN}Week 16 features are working correctly.${NC}"
else
    echo -e "\n${RED}Tests failed. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}====================================${NC}"
echo -e "${YELLOW}Test run completed${NC}"
echo -e "${YELLOW}====================================${NC}"
