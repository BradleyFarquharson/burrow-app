#!/bin/bash

# Exit on error
set -e

echo "🔍 Adding 'use client' directive to React component files..."

# Process component files
find src/components -name "*.tsx" | while read -r file; do
  # Skip if file already has 'use client'
  if ! grep -q "'use client'" "$file" && ! grep -q '"use client"' "$file"; then
    echo "Adding 'use client' to $file"
    # Create a temporary file with 'use client' at the top
    echo "'use client';" > temp_file
    echo "" >> temp_file
    cat "$file" >> temp_file
    # Replace the original file
    mv temp_file "$file"
  fi
done

# Process hook files that might use React hooks
find src/hooks -name "*.ts" -o -name "*.tsx" | grep -v "types.ts" | while read -r file; do
  # Check if file contains React hooks
  if grep -q "use[A-Z]" "$file"; then
    # Skip if file already has 'use client'
    if ! grep -q "'use client'" "$file" && ! grep -q '"use client"' "$file"; then
      echo "Adding 'use client' to $file"
      # Create a temporary file with 'use client' at the top
      echo "'use client';" > temp_file
      echo "" >> temp_file
      cat "$file" >> temp_file
      # Replace the original file
      mv temp_file "$file"
    fi
  fi
done

echo "✅ 'use client' directives added successfully!" 