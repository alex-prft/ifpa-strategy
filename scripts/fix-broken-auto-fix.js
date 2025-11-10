#!/usr/bin/env node

/**
 * Fix Broken Auto-Fix Script
 *
 * This script systematically fixes all instances where the auto-fix script
 * incorrectly transformed JavaScript comparison operators into JSX expressions.
 *
 * Fixes patterns like:
 * - if (variable {'< number'}) → if (variable < number)
 * - (value {'< 30'} * 60) → (value < 30 * 60)
 * - hash <{'< 5'} → hash < 5
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

class BrokenAutoFixRepairer {
  constructor() {
    this.fixedFiles = [];
    this.totalFixes = 0;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
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
   * Fix broken auto-fix patterns in a single file
   */
  fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let fixedContent = content;
      let fileFixCount = 0;

      // Pattern 1: {'< number'} anywhere in code
      const pattern1 = /{'<\s*(\d+\w*)'}/g;
      const matches1 = content.matchAll(pattern1);
      for (const match of matches1) {
        fileFixCount++;
      }
      fixedContent = fixedContent.replace(pattern1, '< $1');

      // Pattern 2: Handle variations with different spacing
      const pattern2 = /{'\s*<\s*(\d+\w*)\s*'}/g;
      const matches2 = fixedContent.matchAll(pattern2);
      for (const match of matches2) {
        fileFixCount++;
      }
      fixedContent = fixedContent.replace(pattern2, '< $1');

      // Pattern 3: Fix malformed hash operations like hash <{'< 5'}
      const pattern3 = /<\s*{'<\s*(\d+\w*)'}/g;
      const matches3 = fixedContent.matchAll(pattern3);
      for (const match of matches3) {
        fileFixCount++;
      }
      fixedContent = fixedContent.replace(pattern3, '< $1');

      if (fileFixCount > 0 && fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent);

        const relativePath = path.relative(process.cwd(), filePath);
        this.fixedFiles.push({
          file: relativePath,
          fixes: fileFixCount
        });
        this.totalFixes += fileFixCount;

        this.log(`✅ Fixed ${fileFixCount} issues in ${relativePath}`, 'green');
      }

    } catch (error) {
      this.log(`❌ Error fixing file ${filePath}: ${error.message}`, 'red');
    }
  }

  /**
   * Main repair routine
   */
  async run() {
    this.log('🔧 BROKEN AUTO-FIX REPAIR TOOL', 'cyan');
    this.log('='.repeat(50), 'cyan');

    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx']);

    this.log(`\n📁 Scanning ${files.length} TypeScript/TSX files for broken auto-fix patterns...`, 'blue');

    // Fix each file
    for (const file of files) {
      this.fixFile(file);
    }

    // Generate summary
    this.generateReport();
  }

  /**
   * Generate repair report
   */
  generateReport() {
    this.log('\n📊 REPAIR SUMMARY', 'cyan');
    this.log('='.repeat(30), 'cyan');

    this.log(`\n✅ Files Fixed: ${this.fixedFiles.length}`, 'green');
    this.log(`🔧 Total Fixes Applied: ${this.totalFixes}`, 'green');

    if (this.fixedFiles.length > 0) {
      this.log('\n📋 Fixed Files:', 'blue');

      this.fixedFiles.slice(0, 10).forEach((file, index) => {
        this.log(`${index + 1}. ${file.file} (${file.fixes} fixes)`, 'yellow');
      });

      if (this.fixedFiles.length > 10) {
        this.log(`   ... and ${this.fixedFiles.length - 10} more files`, 'yellow');
      }

      this.log('\n🎉 All broken auto-fix patterns have been repaired!', 'green');
      this.log('📝 Next steps:', 'blue');
      this.log('   1. Run: npm run validate:jsx-parsing', 'reset');
      this.log('   2. Test: npm run dev', 'reset');
      this.log('   3. Commit changes when validation passes', 'reset');

    } else {
      this.log('\n✨ No broken auto-fix patterns found!', 'green');
      this.log('🎯 All files are already correctly formatted.', 'green');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const repairer = new BrokenAutoFixRepairer();
  repairer.run().catch(error => {
    console.error(`\n💥 Repair Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = BrokenAutoFixRepairer;