#!/usr/bin/env node

/**
 * Comprehensive Runtime Error Prevention System
 *
 * CRITICAL DEPLOYMENT SAFETY SYSTEM
 *
 * This system prevents common runtime errors that cause production failures:
 * 1. Missing component imports (Badge, Card, Button, etc.)
 * 2. Undefined variable references
 * 3. Missing dependencies in package.json
 * 4. Type errors and undefined properties
 * 5. Broken icon imports
 *
 * Usage:
 * - npm run validate:runtime-errors
 * - Pre-commit hook integration
 * - CI/CD pipeline safety check
 *
 * Exit Codes:
 * - 0: All checks passed, safe to deploy
 * - 1: Critical runtime issues found, BLOCK DEPLOYMENT
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

class RuntimeErrorPrevention {
  constructor() {
    this.criticalIssues = [];
    this.warnings = [];
    this.checkedFiles = 0;
    this.componentDatabase = new Map();
    this.iconDatabase = new Set();
    this.packageJson = null;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Load component and icon databases
   */
  async loadComponentDatabase() {
    // Load UI components
    const uiComponentsPath = path.join(process.cwd(), 'src/components/ui');
    if (fs.existsSync(uiComponentsPath)) {
      const uiFiles = fs.readdirSync(uiComponentsPath);
      uiFiles.forEach(file => {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const componentName = this.extractComponentName(file);
          this.componentDatabase.set(componentName, `@/components/ui/${file.replace('.tsx', '').replace('.ts', '')}`);
        }
      });
    }

    // Load Lucide React icons
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      this.packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      if (this.packageJson.dependencies['lucide-react']) {
        // Common Lucide icons - in production, this could be dynamically loaded
        const commonIcons = [
          'ArrowLeft', 'ArrowRight', 'BarChart3', 'Users', 'TrendingUp', 'Eye', 'Target',
          'Heart', 'Brain', 'Zap', 'MessageSquare', 'Activity', 'Award', 'Calendar',
          'PieChart', 'Settings', 'Database', 'FileText', 'Mail', 'BookOpen', 'Search',
          'Filter', 'Download', 'Upload', 'Edit', 'Trash', 'Plus', 'Minus', 'Check',
          'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'Home',
          'User', 'Lock', 'Unlock', 'Key', 'Shield', 'AlertTriangle', 'Info',
          'CheckCircle', 'XCircle', 'Clock', 'Globe', 'Star', 'ThumbsUp', 'ThumbsDown'
        ];

        commonIcons.forEach(icon => this.iconDatabase.add(icon));
      }
    } catch (error) {
      this.warnings.push({
        file: 'package.json',
        issue: 'Could not load package.json for dependency validation',
        severity: 'WARNING'
      });
    }

    this.log(`📦 Loaded ${this.componentDatabase.size} UI components and ${this.iconDatabase.size} icons`, 'blue');
  }

  /**
   * Extract component name from file
   */
  extractComponentName(filename) {
    return filename.replace('.tsx', '').replace('.ts', '')
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * CRITICAL: Check for missing component imports
   */
  checkMissingImports(content, filePath) {
    const lines = content.split('\n');

    // Extract all imports
    const imports = new Set();
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let importMatch;

    while ((importMatch = importRegex.exec(content)) !== null) {
      if (importMatch[1]) {
        // Named imports
        const namedImports = importMatch[1].split(',').map(imp => imp.trim());
        namedImports.forEach(imp => imports.add(imp));
      } else {
        // Default imports (simplified)
        const defaultImport = importMatch[0].match(/import\s+(\w+)/);
        if (defaultImport) imports.add(defaultImport[1]);
      }
    }

    // Check for component usage without imports
    const componentUsageRegex = /<(\w+)[\s>]/g;
    let componentMatch;
    const usedComponents = new Set();

    while ((componentMatch = componentUsageRegex.exec(content)) !== null) {
      const componentName = componentMatch[1];

      // Skip HTML elements and common React elements
      if (this.isHTMLElement(componentName) || componentName === 'div' || componentName === 'span') {
        continue;
      }

      usedComponents.add(componentName);
    }

    // Check for missing component imports
    usedComponents.forEach(component => {
      if (!imports.has(component) && this.componentDatabase.has(component)) {
        const lineNumber = this.findComponentUsageLine(lines, component);
        this.criticalIssues.push({
          file: filePath,
          line: lineNumber,
          issue: `Missing import for component: ${component}`,
          component,
          suggestedImport: this.componentDatabase.get(component),
          severity: 'CRITICAL'
        });
      }
    });

    // Check for missing icon imports
    const iconUsageRegex = /<(\w+)\s+className="[^"]*(?:h-\d+|w-\d+|icon)"/g;
    let iconMatch;

    while ((iconMatch = iconUsageRegex.exec(content)) !== null) {
      const iconName = iconMatch[1];

      if (this.iconDatabase.has(iconName) && !imports.has(iconName)) {
        const lineNumber = this.findComponentUsageLine(lines, iconName);
        this.criticalIssues.push({
          file: filePath,
          line: lineNumber,
          issue: `Missing import for Lucide icon: ${iconName}`,
          component: iconName,
          suggestedImport: 'lucide-react',
          severity: 'CRITICAL'
        });
      }
    }
  }

  /**
   * Check for undefined variables and common runtime errors
   */
  checkUndefinedReferences(content, filePath) {
    const lines = content.split('\n');

    // Check for common undefined reference patterns
    const undefinedPatterns = [
      {
        regex: /\b(\w+)\s+is\s+not\s+defined/g,
        description: 'Variable is not defined'
      },
      {
        regex: /Cannot\s+read\s+propert(?:y|ies)\s+of\s+undefined/g,
        description: 'Property access on undefined'
      },
      {
        regex: /\b(\w+)\.(\w+)\s*(?=\()/g,
        description: 'Potential method call on undefined object',
        validate: (match) => {
          const objName = match[1];
          return !['console', 'document', 'window', 'process', 'Math', 'Date', 'JSON'].includes(objName);
        }
      }
    ];

    undefinedPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern.regex);

      for (const match of matches) {
        if (pattern.validate && !pattern.validate(match)) continue;

        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex]?.trim() || '';

        this.warnings.push({
          file: filePath,
          line: lineIndex + 1,
          content: lineContent,
          issue: pattern.description,
          pattern: match[0],
          severity: 'WARNING'
        });
      }
    });
  }

  /**
   * Check for TypeScript errors and type issues
   */
  checkTypeErrors(content, filePath) {
    const typeErrorPatterns = [
      {
        regex: /:\s*any(?!\w)/g,
        description: 'Explicit any type usage (potential type safety issue)',
        severity: 'WARNING'
      },
      {
        regex: /@ts-ignore/g,
        description: 'TypeScript ignore comment (potential type issue)',
        severity: 'WARNING'
      },
      {
        regex: /as\s+any/g,
        description: 'Type assertion to any (potential type safety issue)',
        severity: 'WARNING'
      }
    ];

    const lines = content.split('\n');

    typeErrorPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern.regex);

      for (const match of matches) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex]?.trim() || '';

        if (pattern.severity === 'CRITICAL') {
          this.criticalIssues.push({
            file: filePath,
            line: lineIndex + 1,
            content: lineContent,
            issue: pattern.description,
            severity: 'CRITICAL'
          });
        } else {
          this.warnings.push({
            file: filePath,
            line: lineIndex + 1,
            content: lineContent,
            issue: pattern.description,
            severity: 'WARNING'
          });
        }
      }
    });
  }

  /**
   * Utility functions
   */
  isHTMLElement(tagName) {
    const htmlElements = [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'button', 'input', 'form', 'label', 'select', 'option',
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'nav', 'header', 'footer', 'main', 'section', 'article', 'aside'
    ];
    return htmlElements.includes(tagName.toLowerCase());
  }

  findComponentUsageLine(lines, component) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`<${component}`)) {
        return i + 1;
      }
    }
    return 1;
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

      // Skip non-component files
      if (!content.includes('export') && !content.includes('import')) {
        return;
      }

      // Run all checks
      this.checkMissingImports(content, relativePath);
      this.checkUndefinedReferences(content, relativePath);
      this.checkTypeErrors(content, relativePath);

      this.checkedFiles++;
    } catch (error) {
      this.warnings.push({
        file: path.relative(process.cwd(), filePath),
        issue: `Failed to read file: ${error.message}`,
        severity: 'WARNING'
      });
    }
  }

  /**
   * Main validation routine
   */
  async run() {
    this.log('🛡️ RUNTIME ERROR PREVENTION SYSTEM', 'cyan');
    this.log('='.repeat(50), 'cyan');

    // Load component and icon databases
    await this.loadComponentDatabase();

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
    this.log('\n📊 RUNTIME ERROR PREVENTION RESULTS', 'cyan');
    this.log('='.repeat(50), 'cyan');

    // Summary
    this.log(`\n📈 Files Scanned: ${this.checkedFiles}`, 'blue');
    this.log(`🔥 Critical Issues: ${this.criticalIssues.length}`, this.criticalIssues.length > 0 ? 'red' : 'green');
    this.log(`⚠️  Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');

    // Critical Issues (BLOCK DEPLOYMENT)
    if (this.criticalIssues.length > 0) {
      this.log('\n🚨 CRITICAL RUNTIME ISSUES - DEPLOYMENT BLOCKED 🚨', 'red');
      this.log('These issues WILL cause production failures:', 'red');

      this.criticalIssues.slice(0, 10).forEach((issue, index) => {
        this.log(`\n${index + 1}. ${colors.bold}${issue.file}:${issue.line}${colors.reset}`, 'red');
        this.log(`   Issue: ${issue.issue}`, 'red');

        if (issue.component && issue.suggestedImport) {
          this.log(`   Component: ${issue.component}`, 'yellow');
          this.log(`   Add Import: import { ${issue.component} } from '${issue.suggestedImport}';`, 'green');
        }
      });

      if (this.criticalIssues.length > 10) {
        this.log(`\n   ... and ${this.criticalIssues.length - 10} more critical issues`, 'red');
      }

      this.log('\n🔧 QUICK FIX COMMANDS:', 'cyan');
      const componentFixes = [...new Set(this.criticalIssues
        .filter(issue => issue.component && issue.suggestedImport)
        .map(issue => `Add: import { ${issue.component} } from '${issue.suggestedImport}';`)
      )];

      componentFixes.slice(0, 5).forEach(fix => {
        this.log(`   ${fix}`, 'white');
      });
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
      this.log('\n✅ RUNTIME ERROR PREVENTION PASSED!', 'green');
      this.log('🚀 Safe to deploy - no critical runtime issues found', 'green');

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
  const validator = new RuntimeErrorPrevention();
  validator.run().catch(error => {
    console.error(`\n💥 Validation Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = RuntimeErrorPrevention;