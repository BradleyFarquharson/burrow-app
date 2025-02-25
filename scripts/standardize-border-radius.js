/**
 * Border Radius Standardization Script
 * 
 * This script helps identify components that aren't using standardized border radius
 * classes and suggests replacements based on our style guide.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'public'];

// Patterns to look for
const PATTERNS = [
  // Direct style border-radius
  { regex: /style={{[^}]*borderRadius:\s*['"]([^'"]+)['"]/g, replacement: suggestClass },
  // Rounded arbitrary values
  { regex: /rounded-\[([^\]]+)\]/g, replacement: suggestClass },
  // Specific corner arbitrary values
  { regex: /rounded-(tl|tr|bl|br)-\[([^\]]+)\]/g, replacement: suggestCorner },
];

// Map for suggesting standardized classes
function suggestClass(match, value) {
  // Extract the value (removing 'px', 'rem', etc.)
  const numericValue = parseFloat(value);
  
  // Based on common values, suggest standardized classes
  if (value.includes('9999') || value === 'full' || value === '50%') {
    return 'rounded-full';
  } else if (numericValue <= 2) {
    return 'rounded-sm';
  } else if (numericValue <= 6) {
    return 'rounded-md';
  } else if (numericValue <= 10) {
    return 'rounded-lg';
  } else {
    return 'rounded-xl';
  }
}

// Suggest corner-specific classes
function suggestCorner(match, corner, value) {
  const baseClass = suggestClass(match, value).replace('rounded-', '');
  return `rounded-${corner}-${baseClass}`;
}

// Find all component files
function findComponentFiles() {
  let files = [];
  
  try {
    // Use grep to find all files with rounded- classes or border-radius styles
    const grepCmd = `grep -r "rounded-\\|border-radius" --include="*.tsx" --include="*.jsx" ${SRC_DIR}`;
    const result = execSync(grepCmd, { encoding: 'utf8' });
    
    // Extract filenames from grep results
    const filePaths = result.split('\n')
      .filter(line => line.trim())
      .map(line => line.split(':')[0])
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    
    files = filePaths;
  } catch (error) {
    console.error('Error finding component files:', error);
  }
  
  return files;
}

// Analyze component files for non-standard border radius
function analyzeFiles(files) {
  const issues = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        PATTERNS.forEach(({ regex, replacement }) => {
          let match;
          while ((match = regex.exec(line)) !== null) {
            issues.push({
              file,
              lineNumber: lineNumber + 1,
              line: line.trim(),
              match: match[0],
              suggestion: replacement(match[0], match[1]),
            });
          }
        });
      });
    } catch (error) {
      console.error(`Error analyzing file ${file}:`, error);
    }
  });
  
  return issues;
}

// Main function
function main() {
  console.log('Border Radius Standardization Script');
  console.log('===================================');
  
  const files = findComponentFiles();
  console.log(`Found ${files.length} component files to analyze.`);
  
  const issues = analyzeFiles(files);
  console.log(`Found ${issues.length} non-standard border radius uses.`);
  
  if (issues.length > 0) {
    console.log('\nIssues found:');
    issues.forEach(issue => {
      console.log(`\nFile: ${issue.file}:${issue.lineNumber}`);
      console.log(`Line: ${issue.line}`);
      console.log(`Non-standard pattern: ${issue.match}`);
      console.log(`Suggested replacement: ${issue.suggestion}`);
    });
    
    console.log('\nFollow the migration guide in src/styles/README.md to standardize these components.');
  } else {
    console.log('All components are using standardized border radius classes!');
  }
}

// Run the script
main(); 