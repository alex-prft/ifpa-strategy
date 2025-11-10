#!/usr/bin/env node

/**
 * Comprehensive Gap Analysis for JSX Parsing Validation System
 *
 * Tests all edge cases and patterns to ensure complete coverage
 * and identify any remaining detection gaps.
 */

const JSXParsingValidator = require('../scripts/jsx-parsing-validator.js');
const fs = require('fs');
const path = require('path');

class ValidationGapAnalysis {
  constructor() {
    this.testResults = [];
    this.validator = new JSXParsingValidator();
  }

  /**
   * Create test files with specific patterns to validate detection
   */
  createTestFile(fileName, content) {
    const testFile = path.join(__dirname, 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(testFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(testFile, content);
    return testFile;
  }

  /**
   * Test detection of critical patterns
   */
  async testCriticalPatterns() {
    console.log('\n🔍 Testing Critical Pattern Detection...');

    const criticalTests = [
      {
        name: 'Broken if conditional',
        content: `
          function test() {
            if (data.length {'< 3'}) {
              return false;
            }
          }
        `,
        shouldDetect: true,
        pattern: 'if conditional with JSX expression'
      },
      {
        name: 'Broken while loop',
        content: `
          function test() {
            while (count {'< 10'}) {
              count++;
            }
          }
        `,
        shouldDetect: true,
        pattern: 'while loop with JSX expression'
      },
      {
        name: 'Broken JSX conditional',
        content: `
          return (
            <div>
              {index {'< 4'} && <span>Show</span>}
            </div>
          );
        `,
        shouldDetect: true,
        pattern: 'JSX conditional with malformed expression'
      },
      {
        name: 'Broken for loop',
        content: `
          function test() {
            for (let i = 0; i {'< 10'}; i++) {
              console.log(i);
            }
          }
        `,
        shouldDetect: true,
        pattern: 'for loop with JSX expression'
      },
      {
        name: 'Unescaped JSX content - original dxptools pattern',
        content: `
          return (
            <p className="text-blue-600">< 2min</p>
          );
        `,
        shouldDetect: true,
        pattern: 'unescaped < in JSX content'
      },
      {
        name: 'Correct JSX expression - should NOT be flagged',
        content: `
          return (
            <p className="text-blue-600">{'< 2min'}</p>
          );
        `,
        shouldDetect: false,
        pattern: 'correct JSX expression'
      },
      {
        name: 'Normal JavaScript comparison - should NOT be flagged',
        content: `
          function test() {
            if (value < 10) {
              return true;
            }
          }
        `,
        shouldDetect: false,
        pattern: 'normal JavaScript comparison'
      }
    ];

    for (const test of criticalTests) {
      const testFile = this.createTestFile(`critical-${test.name.replace(/\s+/g, '-')}.tsx`, test.content);

      // Reset validator state
      this.validator.criticalIssues = [];
      this.validator.warnings = [];
      this.validator.checkedFiles = 0;

      // Run validation
      this.validator.validateFile(testFile);

      const detected = this.validator.criticalIssues.length > 0;
      const passed = detected === test.shouldDetect;

      this.testResults.push({
        test: test.name,
        pattern: test.pattern,
        expected: test.shouldDetect ? 'DETECT' : 'IGNORE',
        actual: detected ? 'DETECTED' : 'IGNORED',
        passed,
        issues: this.validator.criticalIssues.length,
        details: this.validator.criticalIssues.map(issue => issue.description)
      });

      console.log(`  ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      if (!passed) {
        console.log(`    Expected: ${test.shouldDetect ? 'DETECT' : 'IGNORE'}, Got: ${detected ? 'DETECTED' : 'IGNORED'}`);
        if (detected && this.validator.criticalIssues.length > 0) {
          console.log(`    Issues found: ${this.validator.criticalIssues.map(i => i.description).join(', ')}`);
        }
      }

      // Cleanup
      fs.unlinkSync(testFile);
    }
  }

  /**
   * Test edge cases and boundary conditions
   */
  async testEdgeCases() {
    console.log('\n🎯 Testing Edge Cases...');

    const edgeTests = [
      {
        name: 'Multiple spaces in JSX content',
        content: `<p>  <   3   min  </p>`,
        shouldDetect: true
      },
      {
        name: 'Nested JSX with unescaped content',
        content: `<div><span>< 5 items</span></div>`,
        shouldDetect: true
      },
      {
        name: 'Mixed valid and invalid patterns',
        content: `
          if (count < 5) { // Valid JS
            return <p>< 3min</p>; // Invalid JSX
          }
        `,
        shouldDetect: true
      },
      {
        name: 'Complex className with template literals',
        content: `<div className={\`text-\${size < 10 ? 'sm' : 'lg'}\`}>Content</div>`,
        shouldDetect: false
      },
      {
        name: 'JSX expression in attributes',
        content: `<input min={value < 10 ? 1 : 5} />`,
        shouldDetect: false
      }
    ];

    for (const test of edgeTests) {
      const testFile = this.createTestFile(`edge-${test.name.replace(/\s+/g, '-')}.tsx`, test.content);

      // Reset validator state
      this.validator.criticalIssues = [];
      this.validator.warnings = [];
      this.validator.checkedFiles = 0;

      // Run validation
      this.validator.validateFile(testFile);

      const detected = this.validator.criticalIssues.length > 0;
      const passed = detected === test.shouldDetect;

      this.testResults.push({
        test: test.name,
        pattern: 'edge case',
        expected: test.shouldDetect ? 'DETECT' : 'IGNORE',
        actual: detected ? 'DETECTED' : 'IGNORED',
        passed,
        issues: this.validator.criticalIssues.length
      });

      console.log(`  ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);

      // Cleanup
      fs.unlinkSync(testFile);
    }
  }

  /**
   * Test against real codebase patterns
   */
  async testRealWorldPatterns() {
    console.log('\n🌍 Testing Real-World Patterns...');

    // Test current codebase for any remaining issues
    const srcDir = path.join(process.cwd(), 'src');

    // Reset validator state for full scan
    this.validator.criticalIssues = [];
    this.validator.warnings = [];
    this.validator.checkedFiles = 0;

    const files = this.validator.getAllFiles(srcDir, ['.ts', '.tsx']);

    for (const file of files.slice(0, 20)) { // Test subset for performance
      this.validator.validateFile(file);
    }

    console.log(`  📁 Scanned ${this.validator.checkedFiles} files`);
    console.log(`  🔥 Critical Issues: ${this.validator.criticalIssues.length}`);
    console.log(`  ⚠️  Warnings: ${this.validator.warnings.length}`);

    // Analyze warning patterns
    const warningPatterns = {};
    this.validator.warnings.forEach(warning => {
      const pattern = warning.issue;
      warningPatterns[pattern] = (warningPatterns[pattern] || 0) + 1;
    });

    console.log('  📊 Warning Pattern Distribution:');
    Object.entries(warningPatterns).forEach(([pattern, count]) => {
      console.log(`    - ${pattern}: ${count} occurrences`);
    });
  }

  /**
   * Generate comprehensive gap analysis report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE GAP ANALYSIS REPORT');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`\n📈 Overall Results:`);
    console.log(`  ✅ Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`  ❌ Failed: ${failedTests}/${totalTests} (${Math.round(failedTests/totalTests*100)}%)`);

    if (failedTests > 0) {
      console.log(`\n🚨 Failed Tests:`);
      this.testResults.filter(r => !r.passed).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.test}`);
        console.log(`     Expected: ${result.expected}, Got: ${result.actual}`);
        console.log(`     Pattern: ${result.pattern}`);
      });
    }

    // Gap Analysis
    console.log(`\n🔍 Gap Analysis:`);

    if (passedTests === totalTests) {
      console.log(`  🎉 NO GAPS DETECTED - Validation system is comprehensive!`);
      console.log(`  ✅ All critical patterns are properly detected`);
      console.log(`  ✅ All correct patterns are properly ignored`);
      console.log(`  ✅ Edge cases are handled correctly`);
    } else {
      console.log(`  ⚠️  GAPS IDENTIFIED - ${failedTests} patterns need attention`);

      // Categorize gaps
      const missedDetections = this.testResults.filter(r => !r.passed && r.expected === 'DETECT');
      const falsePositives = this.testResults.filter(r => !r.passed && r.expected === 'IGNORE');

      if (missedDetections.length > 0) {
        console.log(`  🔴 Missed Detections (${missedDetections.length}): Critical patterns not caught`);
      }

      if (falsePositives.length > 0) {
        console.log(`  🟡 False Positives (${falsePositives.length}): Valid patterns incorrectly flagged`);
      }
    }

    console.log(`\n💡 Recommendations:`);
    if (passedTests === totalTests) {
      console.log(`  🚀 System is ready for production deployment`);
      console.log(`  📝 Consider adding the test patterns to regression test suite`);
      console.log(`  🔄 Run this analysis after any detection pattern changes`);
    } else {
      console.log(`  🔧 Fix identified gaps before production deployment`);
      console.log(`  🧪 Add failing test cases to regression test suite`);
      console.log(`  🔍 Review regex patterns for missed cases`);
    }

    // Cleanup temp directory
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Run complete gap analysis
   */
  async run() {
    console.log('🔬 STARTING COMPREHENSIVE GAP ANALYSIS');
    console.log('This will test all detection patterns and edge cases...\n');

    await this.testCriticalPatterns();
    await this.testEdgeCases();
    await this.testRealWorldPatterns();

    this.generateReport();
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analysis = new ValidationGapAnalysis();
  analysis.run().catch(console.error);
}

module.exports = ValidationGapAnalysis;