#!/bin/bash
# Start the PHRM-Diag document processing service

# Default values
MODE="api"
PORT=8000
HOST="0.0.0.0"
FILE=""
OUTPUT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift
      shift
      ;;
    --port)
      PORT="$2"
      shift
      shift
      ;;
    --host)
      HOST="$2"
      shift
      shift
      ;;
    --file)
      FILE="$2"
      shift
      shift
      ;;
    --output)
      OUTPUT="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if Tesseract is installed
if ! command -v tesseract &> /dev/null; then
  echo "Tesseract OCR is not installed."
  echo "Please install it using your package manager:"
  echo "  Ubuntu/Debian: sudo apt install tesseract-ocr"
  echo "  macOS: brew install tesseract"
  echo "  Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki"
  exit 1
fi

# Build command
CMD="python main.py --mode $MODE"

if [ "$MODE" == "api" ]; then
  CMD="$CMD --host $HOST --port $PORT"
elif [ "$MODE" == "cli" ]; then
  if [ -z "$FILE" ]; then
    echo "Error: --file is required for CLI mode"
    exit 1
  fi
  CMD="$CMD --file \"$FILE\""
  if [ ! -z "$OUTPUT" ]; then
    CMD="$CMD --output \"$OUTPUT\""
  fi
fi

# Execute the command
echo "Starting PHRM-Diag document processing service..."
echo "Command: $CMD"
eval $CMD
