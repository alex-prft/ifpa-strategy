#!/usr/bin/env node

/**
 * JSX Parsing Validator Script
 *
 * CRITICAL DEPLOYMENT SAFETY CHECK
 *
 * This script prevents deployment of code containing JSX parsing errors
 * caused by auto-fix regressions. It specifically looks for patterns that
 * indicate the auto-fix script incorrectly transformed JavaScript operators.
 *
 * Usage:
 * - npm run validate:jsx-parsing
 * - Pre-commit hook integration
 * - CI/CD pipeline safety check
 *
 * Exit Codes:
 * - 0: All checks passed, safe to deploy
 * - 1: Critical JSX parsing issues found, BLOCK DEPLOYMENT
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class JSXParsingValidator {
  constructor() {
    this.criticalIssues = [];
    this.warnings = [];
    this.checkedFiles = 0;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * CRITICAL: Detect broken auto-fix patterns that cause parsing errors
   */
  checkForBrokenAutoFixPatterns(content, filePath) {
    const brokenPatterns = [
      {
        // Broken conditionals: if (condition {'< number'}) - Enhanced for nested parentheses
        regex: /if\s*\([\s\S]*?{'\s*<\s*\d+[^}]*'}[\s\S]*?\)/g,
        description: 'Broken conditional statement with JSX expression',
        severity: 'CRITICAL'
      },
      {
        // Broken while loops: while (condition {'< number'})
        regex: /while\s*\([^)]*{'\s*<\s*\d+[^}]*'}\s*[^)]*\)/g,
        description: 'Broken while loop with JSX expression',
        severity: 'CRITICAL'
      },
      {
        // Broken JSX conditionals: {variable {'< number'} &&
        regex: /{\s*\w+\s*{'\s*<\s*\d+\w*'}\s*&&/g,
        description: 'Broken JSX conditional with malformed expression',
        severity: 'CRITICAL'
      },
      {
        // Broken for loops: for (i = 0; i {'< number'}; i++) - Fixed pattern
        regex: /for\s*\([^)]*{'\s*<\s*\d+[^}]*'}/g,
        description: 'Broken for loop with JSX expression',
        severity: 'CRITICAL'
      },
      {
        // Unescaped < in JSX content: ><text< (but NOT in attributes or valid JSX expressions)
        regex: />\s*<\s+\d+[^<{]*</g,
        description: 'Unescaped < in JSX content (needs JSX expression wrapper)',
        severity: 'CRITICAL'
      }
    ];

    const lines = content.split('\n');

    for (const pattern of brokenPatterns) {
      const matches = content.matchAll(pattern.regex);

      for (const match of matches) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex]?.trim() || '';

        this.criticalIssues.push({
          file: filePath,
          line: lineIndex + 1,
          content: lineContent,
          issue: pattern.description,
          pattern: match[0],
          severity: pattern.severity
        });
      }
    }
  }

  /**
   * Detect potentially problematic patterns that may cause issues
   */
  checkForPotentialIssues(content, filePath) {
    const potentialIssues = [
      {
        // Only warn about < operators in JavaScript code contexts, not JSX content
        regex: /(?:if|while|for|return|function|\=|\+|\-|\*|\/|\%|&&|\|\|)\s*[^'"]*\s*<\s+\d+/g,
        description: 'Potential < operator spacing issue (JavaScript context)',
        severity: 'WARNING'
      },
      {
        regex: /className=\{[^}]*`[^`]*\$\{[^}]*<\s*\d+/g,
        description: 'Template literal with < operator in className (may cause Tailwind issues)',
        severity: 'WARNING'
      }
    ];

    const lines = content.split('\n');

    for (const issue of potentialIssues) {
      const matches = content.matchAll(issue.regex);

      for (const match of matches) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex]?.trim() || '';

        this.warnings.push({
          file: filePath,
          line: lineIndex + 1,
          content: lineContent,
          issue: issue.description,
          pattern: match[0],
          severity: issue.severity
        });
      }
    }
  }

  /**
   * Get all TypeScript/TSX files recursively
   */
  getAllFiles(dir, extensions = ['.ts', '.tsx']) {
    let files = [];

    try {
      if (!fs.existsSync(dir)) return files;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }

    return files;
  }

  /**
   * Validate a single file
   */
  validateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Run critical checks
      this.checkForBrokenAutoFixPatterns(content, relativePath);

      // Run warning checks
      this.checkForPotentialIssues(content, relativePath);

      this.checkedFiles++;
    } catch (error) {
      this.warnings.push({
        file: path.relative(process.cwd(), filePath),
        line: 0,
        content: '',
        issue: `Failed to read file: ${error.message}`,
        pattern: '',
        severity: 'WARNING'
      });
    }
  }

  /**
   * Main validation routine
   */
  async run() {
    this.log('🔍 JSX PARSING VALIDATION', 'cyan');
    this.log('='.repeat(50), 'cyan');

    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx']);

    this.log(`\n📁 Scanning ${files.length} TypeScript/TSX files...`, 'blue');

    // Validate each file
    for (const file of files) {
      this.validateFile(file);
    }

    // Generate report
    this.generateReport();
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport() {
    this.log('\n📊 JSX PARSING VALIDATION RESULTS', 'cyan');
    this.log('='.repeat(50), 'cyan');

    // Summary
    this.log(`\n📈 Files Scanned: ${this.checkedFiles}`, 'blue');
    this.log(`🔥 Critical Issues: ${this.criticalIssues.length}`, this.criticalIssues.length > 0 ? 'red' : 'green');
    this.log(`⚠️  Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');

    // Critical Issues (BLOCK DEPLOYMENT)
    if (this.criticalIssues.length > 0) {
      this.log('\n🚨 CRITICAL ISSUES - DEPLOYMENT BLOCKED 🚨', 'red');
      this.log('These issues MUST be fixed before deployment:', 'red');

      this.criticalIssues.slice(0, 10).forEach((issue, index) => {
        this.log(`\n${index + 1}. ${colors.bold}${issue.file}:${issue.line}${colors.reset}`, 'red');
        this.log(`   Issue: ${issue.issue}`, 'red');
        this.log(`   Code: ${issue.content}`, 'yellow');
        this.log(`   Pattern: ${issue.pattern}`, 'magenta');
      });

      if (this.criticalIssues.length > 10) {
        this.log(`\n   ... and ${this.criticalIssues.length - 10} more critical issues`, 'red');
      }

      this.log('\n💡 QUICK FIX GUIDE:', 'cyan');
      this.log('   Replace: if (variable {\'< number\'}) with: if (variable < number)', 'white');
      this.log('   Replace: {index {\'< 4\'} && with: {index < 4 &&', 'white');
      this.log('   Replace: (time {\'< 30\'} * 60) with: (time < 30 * 60)', 'white');
    }

    // Warnings
    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS - Review Recommended', 'yellow');

      this.warnings.slice(0, 5).forEach((warning, index) => {
        this.log(`\n${index + 1}. ${warning.file}:${warning.line}`, 'yellow');
        this.log(`   ${warning.issue}`, 'yellow');
        if (warning.content) {
          this.log(`   Code: ${warning.content}`, 'white');
        }
      });

      if (this.warnings.length > 5) {
        this.log(`\n   ... and ${this.warnings.length - 5} more warnings`, 'yellow');
      }
    }

    // Success case
    if (this.criticalIssues.length === 0) {
      this.log('\n✅ JSX PARSING VALIDATION PASSED!', 'green');
      this.log('🚀 Safe to deploy - no critical JSX parsing issues found', 'green');

      if (this.warnings.length > 0) {
        this.log(`📝 Note: ${this.warnings.length} warnings found but don't block deployment`, 'blue');
      }
    }

    // Exit with appropriate code
    const exitCode = this.criticalIssues.length > 0 ? 1 : 0;

    if (exitCode === 1) {
      this.log('\n❌ VALIDATION FAILED - Fix critical issues before deployment', 'red');
    }

    process.exit(exitCode);
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new JSXParsingValidator();
  validator.run().catch(error => {
    console.error(`\n💥 Validation Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = JSXParsingValidator;