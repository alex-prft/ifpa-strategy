#!/usr/bin/env node

/**
 * Comprehensive JSX Parsing Regression Test Suite
 *
 * CRITICAL UNIT TESTS for JSX Parsing Validation System
 *
 * This test suite prevents regression of the JSX parsing errors that were
 * identified and fixed. It ensures 100% detection accuracy is maintained.
 *
 * Can be run with: node tests/unit/jsx-parsing-regression-test.js
 * Or via npm: npm run test:jsx-regression (if added to package.json)
 *
 * Based on the comprehensive gap analysis that achieved 100% pass rate.
 */

const fs = require('fs');
const path = require('path');
const JSXParsingValidator = require('../../scripts/jsx-parsing-validator.js');

class JSXParsingRegressionTest {
  constructor() {
    this.validator = new JSXParsingValidator();
    this.testResults = [];
    this.tempDir = path.join(__dirname, 'temp-jsx-regression');
  }

  log(message, color = 'white') {
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
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Create test file and validate content
   */
  validateContent(fileName, content) {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const testFile = path.join(this.tempDir, fileName);
    fs.writeFileSync(testFile, content);

    // Reset validator state
    this.validator.criticalIssues = [];
    this.validator.warnings = [];
    this.validator.checkedFiles = 0;

    // Run validation
    this.validator.validateFile(testFile);

    return {
      criticalIssues: this.validator.criticalIssues,
      warnings: this.validator.warnings,
      checkedFiles: this.validator.checkedFiles
    };
  }

  /**
   * Assert function for test validation
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Run a single test case
   */
  runTest(testName, testFunction) {
    try {
      testFunction();
      this.testResults.push({ name: testName, status: 'PASSED', error: null });
      this.log(`  ✅ ${testName}`, 'green');
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`  ❌ ${testName}: ${error.message}`, 'red');
    }
  }

  /**
   * Critical pattern detection tests - must flag as errors
   */
  testCriticalPatterns() {
    this.log('\n🔍 Testing Critical Pattern Detection (Must Flag as Errors)...', 'cyan');

    this.runTest('Broken if conditional detection', () => {
      const content = `
        function test() {
          if (data.length {'< 3'}) {
            return false;
          }
        }
      `;

      const result = this.validateContent('broken-if.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].issue.includes('conditional'), 'Should detect conditional statement issue');
    });

    this.runTest('Broken while loop detection', () => {
      const content = `
        function test() {
          while (count {'< 10'}) {
            count++;
          }
        }
      `;

      const result = this.validateContent('broken-while.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].issue.includes('while'), 'Should detect while loop issue');
    });

    this.runTest('Broken JSX conditional detection', () => {
      const content = `
        return (
          <div>
            {index {'< 4'} && <span>Show</span>}
          </div>
        );
      `;

      const result = this.validateContent('broken-jsx-conditional.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].issue.includes('JSX conditional'), 'Should detect JSX conditional issue');
    });

    this.runTest('Broken for loop detection', () => {
      const content = `
        function test() {
          for (let i = 0; i {'< 10'}; i++) {
            console.log(i);
          }
        }
      `;

      const result = this.validateContent('broken-for.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].issue.includes('for loop'), 'Should detect for loop issue');
    });

    this.runTest('Unescaped JSX content detection (original dxptools pattern)', () => {
      const content = `
        return (
          <p className="text-blue-600">< 2min</p>
        );
      `;

      const result = this.validateContent('unescaped-jsx.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].issue.includes('Unescaped'), 'Should detect unescaped JSX content');
    });
  }

  /**
   * Correct pattern tests - must NOT flag as errors
   */
  testCorrectPatterns() {
    this.log('\n✅ Testing Correct Patterns (Must NOT Flag as Errors)...', 'cyan');

    this.runTest('Correct JSX expressions should be ignored', () => {
      const content = `
        return (
          <div>
            <p className="text-blue-600">{'< 2min'}</p>
            <span>{'< 30 seconds'}</span>
            <div>{'< 100 items'}</div>
          </div>
        );
      `;

      const result = this.validateContent('correct-jsx.tsx', content);
      this.assert(result.criticalIssues.length === 0, `Expected 0 critical issues, got ${result.criticalIssues.length}`);
    });

    this.runTest('Normal JavaScript comparisons should be ignored', () => {
      const content = `
        function test() {
          if (value < 10) {
            return true;
          }

          while (count < 100) {
            count++;
          }

          for (let i = 0; i < 50; i++) {
            console.log(i);
          }
        }
      `;

      const result = this.validateContent('normal-js.tsx', content);
      this.assert(result.criticalIssues.length === 0, `Expected 0 critical issues, got ${result.criticalIssues.length}`);
    });

    this.runTest('JSX expressions in attributes should be ignored', () => {
      const content = `
        return (
          <div>
            <input min={value < 10 ? 1 : 5} />
            <Component threshold={count < 100 ? 'low' : 'high'} />
          </div>
        );
      `;

      const result = this.validateContent('jsx-attributes.tsx', content);
      this.assert(result.criticalIssues.length === 0, `Expected 0 critical issues, got ${result.criticalIssues.length}`);
    });
  }

  /**
   * Historical regression tests for specific fixes
   */
  testHistoricalRegressions() {
    this.log('\n🏛️ Testing Historical Regression Prevention...', 'cyan');

    this.runTest('OSAWorkflowForm.tsx regression prevention', () => {
      const content = `
        if (data.current_capabilities.length {'< 3'}) {
          setError('Please select at least 3 capabilities');
          return;
        }
      `;

      const result = this.validateContent('osa-workflow-regression.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect OSA workflow pattern');
    });

    this.runTest('PasswordProtection.tsx regression prevention', () => {
      const content = `
        if (authData.timestamp && (now - authData.timestamp) {'< 30'} * 24 * 60 * 60 * 1000) {
          return false;
        }
      `;

      const result = this.validateContent('password-protection-regression.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect password protection pattern');
    });

    this.runTest('DXPTools page regression prevention', () => {
      const content = `
        return (
          <Card className="p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-800">Data Freshness</h4>
            <p className="text-2xl font-bold text-blue-600">< 2min</p>
            <p className="text-xs text-blue-600 mt-1">Avg latency</p>
          </Card>
        );
      `;

      const result = this.validateContent('dxptools-regression.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect DXPTools pattern');
    });

    this.runTest('Insights page regression prevention', () => {
      const content = `
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {recommendations.slice(0, 4).map((rec, index) => (
              <Card key={index} className="p-4">
                {index {'< 4'} && (
                  <div className="mb-2">
                    <Badge variant="secondary">{rec.category}</Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>
        );
      `;

      const result = this.validateContent('insights-regression.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect insights pattern');
    });
  }

  /**
   * Edge case testing
   */
  testEdgeCases() {
    this.log('\n🎯 Testing Edge Cases and Boundary Conditions...', 'cyan');

    this.runTest('Multiple spaces in JSX content', () => {
      const content = `<p>  <   3   min  </p>`;

      const result = this.validateContent('multiple-spaces.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect multiple spaces pattern');
    });

    this.runTest('Nested JSX with unescaped content', () => {
      const content = `
        return (
          <div>
            <section>
              <span>< 5 items</span>
            </section>
          </div>
        );
      `;

      const result = this.validateContent('nested-unescaped.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect nested unescaped content');
    });

    this.runTest('Mixed valid and invalid patterns', () => {
      const content = `
        function Component() {
          if (count < 5) { // Valid JS - should be ignored
            return <p>< 3min</p>; // Invalid JSX - should be flagged
          }

          return (
            <div>
              <span>{'< 10 items'}</span> {/* Valid JSX - should be ignored */}
            </div>
          );
        }
      `;

      const result = this.validateContent('mixed-patterns.tsx', content);
      // Should only flag the invalid JSX pattern, not the valid JS or valid JSX
      this.assert(result.criticalIssues.length === 1, 'Should detect only the invalid JSX pattern');
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAILED').length;

    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📋 JSX PARSING REGRESSION TEST REPORT', 'cyan');
    this.log('='.repeat(60), 'cyan');

    this.log(`\n📈 Overall Results:`, 'white');
    this.log(`  ✅ Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`, passedTests === totalTests ? 'green' : 'yellow');
    this.log(`  ❌ Failed: ${failedTests}/${totalTests} (${Math.round(failedTests/totalTests*100)}%)`, failedTests === 0 ? 'green' : 'red');

    if (failedTests > 0) {
      this.log(`\n🚨 Failed Tests:`, 'red');
      this.testResults.filter(r => r.status === 'FAILED').forEach((result, index) => {
        this.log(`  ${index + 1}. ${result.name}`, 'red');
        this.log(`     Error: ${result.error}`, 'red');
      });
    }

    if (passedTests === totalTests) {
      this.log(`\n🎉 ALL TESTS PASSED!`, 'green');
      this.log(`✅ JSX parsing validation system is working correctly`, 'green');
      this.log(`✅ All historical regressions are prevented`, 'green');
      this.log(`✅ Edge cases are handled properly`, 'green');
      this.log(`🚀 System is ready for production deployment`, 'green');
    } else {
      this.log(`\n⚠️ TESTS FAILED - Validation system has regressions`, 'red');
      this.log(`🔧 Fix failing tests before deployment`, 'red');
    }

    return passedTests === totalTests;
  }

  /**
   * Cleanup temp files
   */
  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Run complete test suite
   */
  async run() {
    this.log('🧪 JSX PARSING REGRESSION TEST SUITE', 'cyan');
    this.log('Testing comprehensive validation system for regressions...\n', 'white');

    try {
      this.testCriticalPatterns();
      this.testCorrectPatterns();
      this.testHistoricalRegressions();
      this.testEdgeCases();

      const allPassed = this.generateReport();

      this.cleanup();

      // Exit with appropriate code
      process.exit(allPassed ? 0 : 1);
    } catch (error) {
      this.log(`\n💥 Test Suite Error: ${error.message}`, 'red');
      this.cleanup();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const testSuite = new JSXParsingRegressionTest();
  testSuite.run().catch(error => {
    console.error(`\n💥 Test Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = JSXParsingRegressionTest;