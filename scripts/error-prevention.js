#!/usr/bin/env node

/**
 * OSA Error Prevention and Detection Script
 *
 * Automated process to detect and prevent common errors that block development.
 * Run this before commits, deployments, or after making significant changes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');
const resultsFile = path.join(__dirname, '..', 'error-detection-results.json');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

class ErrorDetector {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixed = [];
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // 1. JSX Parsing Error Detection
  async checkJSXSyntax() {
    this.log('\n🔍 Checking JSX Syntax...', 'cyan');

    const tsxFiles = this.getAllFiles(srcDir, ['.tsx', '.ts']);

    for (const file of tsxFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        // Check for unescaped < characters before numbers in JSX content (between tags), not in JavaScript conditionals
        const problematicPattern = /(>)\s*< \d+/g;
        const matches = content.match(problematicPattern);

        if (matches) {
          matches.forEach(match => {
            const lineNum = lines.findIndex(line => line.includes(match.trim())) + 1;
            this.errors.push({
              type: 'JSX_PARSING_ERROR',
              file: path.relative(process.cwd(), file),
              line: lineNum,
              issue: `Unescaped < character: "${match.trim()}"`,
              fix: `Use JSX expression: {'< number'} or HTML entity: &lt;`
            });
          });
        }

        // Check for template literal issues in JSX
        const templateLiteralPattern = /className=\{[^}]*`[^`]*\$\{[^}]*\}[^`]*`[^}]*\}/g;
        const templateMatches = content.match(templateLiteralPattern);

        if (templateMatches) {
          templateMatches.forEach(match => {
            const lineNum = lines.findIndex(line => line.includes(match)) + 1;
            this.warnings.push({
              type: 'DYNAMIC_TAILWIND_CLASS',
              file: path.relative(process.cwd(), file),
              line: lineNum,
              issue: `Dynamic Tailwind class may be purged in production`,
              fix: `Use explicit conditional logic instead of template literals`
            });
          });
        }

      } catch (error) {
        this.errors.push({
          type: 'FILE_READ_ERROR',
          file: path.relative(process.cwd(), file),
          issue: `Failed to read file: ${error.message}`
        });
      }
    }
  }

  // 2. Import Dependency Validation
  async checkImports() {
    this.log('📦 Checking Import Dependencies...', 'cyan');

    const lucideIcons = [
      'ArrowLeft', 'Settings', 'Database', 'FileText', 'Zap', 'Mail', 'BookOpen',
      'Users', 'Activity', 'TrendingUp', 'MessageSquare', 'Brain', 'BarChart3',
      'Calendar', 'Target', 'Heart', 'Eye', 'PieChart', 'Award'
    ];

    const tsxFiles = this.getAllFiles(srcDir, ['.tsx']);

    for (const file of tsxFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Extract lucide imports
        const lucideImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"];?/);
        const importedIcons = lucideImportMatch
          ? lucideImportMatch[1].split(',').map(icon => icon.trim())
          : [];

        // Find used icons
        const usedIcons = lucideIcons.filter(icon => {
          const iconPattern = new RegExp(`<${icon}[\\s/>]`, 'g');
          return iconPattern.test(content);
        });

        // Check for missing imports
        const missingIcons = usedIcons.filter(icon => !importedIcons.includes(icon));

        if (missingIcons.length > 0) {
          this.errors.push({
            type: 'MISSING_IMPORT',
            file: path.relative(process.cwd(), file),
            issue: `Missing lucide-react imports: ${missingIcons.join(', ')}`,
            fix: `Add to import: { ${[...importedIcons, ...missingIcons].sort().join(', ')} }`
          });
        }

        // Check for unused imports
        const unusedIcons = importedIcons.filter(icon => !usedIcons.includes(icon));
        if (unusedIcons.length > 0) {
          this.warnings.push({
            type: 'UNUSED_IMPORT',
            file: path.relative(process.cwd(), file),
            issue: `Unused lucide-react imports: ${unusedIcons.join(', ')}`,
            fix: `Remove unused imports to optimize bundle size`
          });
        }

      } catch (error) {
        this.errors.push({
          type: 'IMPORT_CHECK_ERROR',
          file: path.relative(process.cwd(), file),
          issue: `Failed to check imports: ${error.message}`
        });
      }
    }
  }

  // 3. API Route Validation
  async checkAPIRoutes() {
    this.log('🌐 Checking API Routes...', 'cyan');

    const apiDir = path.join(srcDir, 'app', 'api');
    if (!fs.existsSync(apiDir)) {
      this.log('ℹ️  No API directory found, skipping API checks', 'yellow');
      return;
    }

    const apiFiles = this.getAllFiles(apiDir, ['.ts', '.tsx']);

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Check for error handling
        const hasErrorHandling = /try\s*{[\s\S]*?}\s*catch|\.catch\s*\(/.test(content);
        if (!hasErrorHandling && content.includes('async function')) {
          this.warnings.push({
            type: 'MISSING_ERROR_HANDLING',
            file: path.relative(process.cwd(), file),
            issue: `API route lacks error handling`,
            fix: `Add try-catch blocks around async operations`
          });
        }

        // Check for status codes
        const hasStatusCodes = /status:\s*\d+/.test(content);
        if (!hasStatusCodes && content.includes('NextResponse')) {
          this.warnings.push({
            type: 'MISSING_STATUS_CODES',
            file: path.relative(process.cwd(), file),
            issue: `API route should return explicit status codes`,
            fix: `Add { status: 200/400/500 } to responses`
          });
        }

        // Check for database error handling
        if (content.includes('supabase') || content.includes('fetch')) {
          const hasDbErrorHandling = /fetch.*failed|database.*unavailable|connection.*error/i.test(content);
          if (!hasDbErrorHandling) {
            this.warnings.push({
              type: 'DB_RESILIENCE',
              file: path.relative(process.cwd(), file),
              issue: `Missing database error resilience`,
              fix: `Add fallback mechanisms for database failures`
            });
          }
        }

      } catch (error) {
        this.errors.push({
          type: 'API_CHECK_ERROR',
          file: path.relative(process.cwd(), file),
          issue: `Failed to check API route: ${error.message}`
        });
      }
    }
  }

  // 4. Environment Variable Validation
  async checkEnvironmentVariables() {
    this.log('🔧 Checking Environment Variables...', 'cyan');

    const envExampleFile = path.join(process.cwd(), '.env.example');
    const envLocalFile = path.join(process.cwd(), '.env.local');

    try {
      // Check if .env.example exists
      if (fs.existsSync(envExampleFile)) {
        const envExample = fs.readFileSync(envExampleFile, 'utf8');
        const exampleVars = envExample.match(/^[A-Z_]+=.*/gm) || [];

        // Check if .env.local exists
        if (!fs.existsSync(envLocalFile)) {
          this.warnings.push({
            type: 'MISSING_ENV_FILE',
            file: '.env.local',
            issue: `.env.local file not found`,
            fix: `Create .env.local based on .env.example`
          });
        } else {
          const envLocal = fs.readFileSync(envLocalFile, 'utf8');

          // Check for missing variables
          exampleVars.forEach(varLine => {
            const varName = varLine.split('=')[0];
            if (!envLocal.includes(varName)) {
              this.warnings.push({
                type: 'MISSING_ENV_VAR',
                file: '.env.local',
                issue: `Missing environment variable: ${varName}`,
                fix: `Add ${varName} to .env.local`
              });
            }
          });
        }
      } else {
        this.warnings.push({
          type: 'MISSING_ENV_EXAMPLE',
          file: '.env.example',
          issue: `No .env.example file found`,
          fix: `Create .env.example with required environment variables`
        });
      }
    } catch (error) {
      this.errors.push({
        type: 'ENV_CHECK_ERROR',
        issue: `Failed to check environment variables: ${error.message}`
      });
    }
  }

  // 5. Build Validation
  async checkBuildHealth() {
    this.log('🏗️  Checking Build Health...', 'cyan');

    try {
      // Check if TypeScript compilation passes
      this.log('   Checking TypeScript compilation...', 'blue');
      execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: process.cwd() });
      this.log('   ✅ TypeScript compilation passed', 'green');

    } catch (error) {
      this.errors.push({
        type: 'TYPESCRIPT_ERROR',
        issue: 'TypeScript compilation failed',
        details: error.stdout?.toString() || error.stderr?.toString() || error.message,
        fix: 'Fix TypeScript errors before proceeding'
      });
    }
  }

  // Utility: Get all files with specific extensions
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

  // Auto-fix common issues
  async autoFix() {
    this.log('\n🔧 Attempting Auto-fixes...', 'magenta');

    for (const error of this.errors) {
      if (error.type === 'JSX_PARSING_ERROR' && error.file && error.line) {
        try {
          const filePath = path.join(process.cwd(), error.file);
          const content = fs.readFileSync(filePath, 'utf8');

          // Auto-fix JSX parsing errors - only target JSX content display, not JavaScript operators
          const fixedContent = content.replace(
            // Only match < followed by numbers within JSX content (between > and <), not in JavaScript conditionals
            /(>)\s*< (\d+\w*)\s*(<)/g,
            (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
          );

          if (fixedContent !== content) {
            fs.writeFileSync(filePath, fixedContent);
            this.fixed.push({
              file: error.file,
              fix: `Auto-fixed JSX parsing error at line ${error.line}`
            });
            this.log(`   ✅ Fixed JSX parsing error in ${error.file}`, 'green');
          }
        } catch (fixError) {
          this.log(`   ❌ Failed to auto-fix ${error.file}: ${fixError.message}`, 'red');
        }
      }
    }
  }

  // Generate comprehensive report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        fixed: this.fixed.length,
        status: this.errors.length === 0 ? 'PASSED' : 'FAILED'
      },
      errors: this.errors,
      warnings: this.warnings,
      fixed: this.fixed
    };

    // Write to file
    fs.writeFileSync(resultsFile, JSON.stringify(report, null, 2));

    // Display summary
    this.log('\n📊 ERROR DETECTION SUMMARY', 'cyan');
    this.log('=' * 50, 'cyan');

    if (this.errors.length === 0) {
      this.log('✅ NO CRITICAL ERRORS FOUND!', 'green');
    } else {
      this.log(`❌ ${this.errors.length} CRITICAL ERRORS DETECTED`, 'red');
      this.errors.slice(0, 5).forEach((error, index) => {
        this.log(`${index + 1}. ${error.file || 'Global'}: ${error.issue}`, 'red');
        if (error.fix) {
          this.log(`   Fix: ${error.fix}`, 'yellow');
        }
      });
      if (this.errors.length > 5) {
        this.log(`   ... and ${this.errors.length - 5} more errors`, 'red');
      }
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️  ${this.warnings.length} IMPROVEMENT OPPORTUNITIES`, 'yellow');
      this.warnings.slice(0, 3).forEach((warning, index) => {
        this.log(`${index + 1}. ${warning.file || 'Global'}: ${warning.issue}`, 'yellow');
      });
      if (this.warnings.length > 3) {
        this.log(`   ... and ${this.warnings.length - 3} more warnings`, 'yellow');
      }
    }

    if (this.fixed.length > 0) {
      this.log(`\n🔧 ${this.fixed.length} ISSUES AUTO-FIXED`, 'green');
      this.fixed.forEach((fix, index) => {
        this.log(`${index + 1}. ${fix.file}: ${fix.fix}`, 'green');
      });
    }

    this.log(`\n📁 Full report saved to: ${resultsFile}`, 'blue');

    // Exit with appropriate code
    process.exit(this.errors.length === 0 ? 0 : 1);
  }

  // Main execution
  async run() {
    this.log('🚀 OSA ERROR PREVENTION & DETECTION', 'magenta');
    this.log('='.repeat(50), 'magenta');

    try {
      await this.checkJSXSyntax();
      await this.checkImports();
      await this.checkAPIRoutes();
      await this.checkEnvironmentVariables();
      await this.checkBuildHealth();

      if (this.errors.some(e => e.type === 'JSX_PARSING_ERROR')) {
        await this.autoFix();
      }

      this.generateReport();

    } catch (error) {
      this.log(`\n💥 Fatal Error: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const detector = new ErrorDetector();
  detector.run();
}

module.exports = ErrorDetector;