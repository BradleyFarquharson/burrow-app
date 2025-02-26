#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p output

# Define output file
OUTPUT_FILE="output/all-code.txt"

# Clear output file if it exists
> "$OUTPUT_FILE"

# Find all code files, excluding node_modules, .git, .next, and other build/cache directories
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.next/*" \
  -not -path "*/out/*" \
  -not -path "*/.firebase/*" \
  -not -path "*/output/*" \
  -not -path "*/extract-all-code.sh" \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.css" -o -name "*.scss" -o -name "*.html" -o -name "*.md" -o -name "*.mjs" \) | sort | while read -r file; do
  
  # Print file path separator
  echo -e "\n\n================================================================================" >> "$OUTPUT_FILE"
  echo -e "=== FILE: $file" >> "$OUTPUT_FILE"
  echo -e "================================================================================\n" >> "$OUTPUT_FILE"
  
  # Append file content
  cat "$file" >> "$OUTPUT_FILE"
done

# Print completion message
echo "All code has been extracted to $OUTPUT_FILE"
echo "Total size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "Total lines: $(wc -l < "$OUTPUT_FILE")" 