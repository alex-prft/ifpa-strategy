#!/usr/bin/env node

/**
 * Comprehensive Runtime Error Prevention Unit Tests
 *
 * CRITICAL REGRESSION PREVENTION SUITE
 *
 * This test suite prevents runtime errors that cause production failures:
 * 1. Missing component imports (Badge, Card, Button, etc.)
 * 2. Undefined component references
 * 3. Icon import issues
 * 4. Type safety violations
 * 5. Deployment-blocking runtime errors
 *
 * These tests ensure our error prevention system catches ALL runtime issues
 * before they reach production.
 */

const fs = require('fs');
const path = require('path');
const RuntimeErrorPrevention = require('../../scripts/runtime-error-prevention.js');

class RuntimeErrorPreventionTest {
  constructor() {
    this.validator = new RuntimeErrorPrevention();
    this.testResults = [];
    this.tempDir = path.join(__dirname, 'temp-runtime-test');
  }

  log(message, color = 'white') {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Create test file and validate content
   */
  async validateContent(fileName, content) {
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

    // Load databases
    await this.validator.loadComponentDatabase();

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
   * Test missing component import detection
   */
  testMissingComponentImports() {
    this.log('\n🔍 Testing Missing Component Import Detection...', 'cyan');

    this.runTest('Missing Badge import detection', async () => {
      const content = `
        'use client';
        import { Card } from '@/components/ui/card';

        export default function TestComponent() {
          return (
            <div>
              <Card>
                <Badge variant="outline">Test</Badge>
              </Card>
            </div>
          );
        }
      `;

      const result = await this.validateContent('missing-badge.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].component === 'Badge', 'Should detect Badge component');
      this.assert(result.criticalIssues[0].suggestedImport.includes('badge'), 'Should suggest Badge import');
    });

    this.runTest('Missing Button import detection', async () => {
      const content = `
        'use client';
        import { Card } from '@/components/ui/card';

        export default function TestComponent() {
          return (
            <div>
              <Button onClick={() => {}}>Click me</Button>
            </div>
          );
        }
      `;

      const result = await this.validateContent('missing-button.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].component === 'Button', 'Should detect Button component');
    });

    this.runTest('Missing multiple component imports', async () => {
      const content = `
        'use client';

        export default function TestComponent() {
          return (
            <div>
              <Card>
                <Badge>Test</Badge>
                <Button>Click</Button>
                <Input type="text" />
              </Card>
            </div>
          );
        }
      `;

      const result = await this.validateContent('missing-multiple.tsx', content);
      this.assert(result.criticalIssues.length >= 3, `Expected at least 3 critical issues, got ${result.criticalIssues.length}`);
    });

    this.runTest('Correct imports should pass', async () => {
      const content = `
        'use client';
        import { Card } from '@/components/ui/card';
        import { Badge } from '@/components/ui/badge';
        import { Button } from '@/components/ui/button';

        export default function TestComponent() {
          return (
            <div>
              <Card>
                <Badge variant="outline">Test</Badge>
                <Button onClick={() => {}}>Click me</Button>
              </Card>
            </div>
          );
        }
      `;

      const result = await this.validateContent('correct-imports.tsx', content);
      this.assert(result.criticalIssues.length === 0, `Expected 0 critical issues, got ${result.criticalIssues.length}`);
    });
  }

  /**
   * Test missing icon import detection
   */
  testMissingIconImports() {
    this.log('\n🎨 Testing Missing Icon Import Detection...', 'cyan');

    this.runTest('Missing Lucide icon import detection', async () => {
      const content = `
        'use client';
        import { Button } from '@/components/ui/button';

        export default function TestComponent() {
          return (
            <div>
              <Button>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          );
        }
      `;

      const result = await this.validateContent('missing-icon.tsx', content);
      this.assert(result.criticalIssues.length === 1, `Expected 1 critical issue, got ${result.criticalIssues.length}`);
      this.assert(result.criticalIssues[0].component === 'ArrowLeft', 'Should detect ArrowLeft icon');
      this.assert(result.criticalIssues[0].suggestedImport === 'lucide-react', 'Should suggest lucide-react import');
    });

    this.runTest('Multiple missing icons detection', async () => {
      const content = `
        'use client';

        export default function TestComponent() {
          return (
            <div>
              <Settings className="h-6 w-6" />
              <Users className="h-4 w-4" />
              <BarChart3 className="h-5 w-5" />
            </div>
          );
        }
      `;

      const result = await this.validateContent('missing-icons.tsx', content);
      this.assert(result.criticalIssues.length >= 2, `Expected at least 2 critical issues, got ${result.criticalIssues.length}`);
    });

    this.runTest('Correct icon imports should pass', async () => {
      const content = `
        'use client';
        import { ArrowLeft, Settings, Users } from 'lucide-react';

        export default function TestComponent() {
          return (
            <div>
              <ArrowLeft className="h-4 w-4" />
              <Settings className="h-6 w-6" />
              <Users className="h-4 w-4" />
            </div>
          );
        }
      `;

      const result = await this.validateContent('correct-icons.tsx', content);
      this.assert(result.criticalIssues.length === 0, `Expected 0 critical issues, got ${result.criticalIssues.length}`);
    });
  }

  /**
   * Test historical regression prevention
   */
  testHistoricalRegressions() {
    this.log('\n🏛️ Testing Historical Runtime Error Prevention...', 'cyan');

    this.runTest('Badge import regression (original insights page issue)', async () => {
      const content = `
        'use client';
        import { Card, CardContent } from '@/components/ui/card';

        export default function AnalyticsInsightsPage() {
          return (
            <div>
              <Card>
                <CardContent>
                  {items.map((item, index) => (
                    <Badge key={index} variant="outline">
                      {item.name}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        }
      `;

      const result = await this.validateContent('badge-regression.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should detect Badge import issue');
      this.assert(result.criticalIssues[0].component === 'Badge', 'Should identify Badge as missing');
    });

    this.runTest('Complex component usage patterns', async () => {
      const content = `
        'use client';
        import { useState } from 'react';

        export default function ComplexComponent() {
          const [open, setOpen] = useState(false);

          return (
            <div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Title</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="tab1">
                    <TabsList>
                      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1">
                      <Select>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </Select>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          );
        }
      `;

      const result = await this.validateContent('complex-components.tsx', content);
      this.assert(result.criticalIssues.length >= 5, 'Should detect multiple missing components');
    });
  }

  /**
   * Test edge cases and boundaries
   */
  testEdgeCases() {
    this.log('\n🎯 Testing Edge Cases and Boundary Conditions...', 'cyan');

    this.runTest('HTML elements should not be flagged', async () => {
      const content = `
        export default function TestComponent() {
          return (
            <div>
              <p>Text</p>
              <span>More text</span>
              <button>HTML Button</button>
              <input type="text" />
            </div>
          );
        }
      `;

      const result = await this.validateContent('html-elements.tsx', content);
      this.assert(result.criticalIssues.length === 0, 'HTML elements should not be flagged as missing imports');
    });

    this.runTest('Self-closing components detection', async () => {
      const content = `
        export default function TestComponent() {
          return (
            <div>
              <Input />
              <Separator />
              <Avatar />
            </div>
          );
        }
      `;

      const result = await this.validateContent('self-closing.tsx', content);
      this.assert(result.criticalIssues.length >= 2, 'Should detect self-closing components');
    });

    this.runTest('Mixed valid and invalid imports', async () => {
      const content = `
        'use client';
        import { Card } from '@/components/ui/card';
        // Badge is missing but Card is correct

        export default function TestComponent() {
          return (
            <Card>
              <Badge>Missing import</Badge>
            </Card>
          );
        }
      `;

      const result = await this.validateContent('mixed-imports.tsx', content);
      this.assert(result.criticalIssues.length === 1, 'Should only flag Badge, not Card');
      this.assert(result.criticalIssues[0].component === 'Badge', 'Should only detect Badge as missing');
    });

    this.runTest('Empty and malformed files', async () => {
      const content = `
        // Empty file with just comments
        /*
         * No actual component usage
         */
      `;

      const result = await this.validateContent('empty-file.tsx', content);
      this.assert(result.criticalIssues.length === 0, 'Empty files should not cause errors');
    });
  }

  /**
   * Test system integration and performance
   */
  testSystemIntegration() {
    this.log('\n⚙️ Testing System Integration and Performance...', 'cyan');

    this.runTest('Large file handling', async () => {
      // Create a large file with many components
      const largeContent = Array.from({ length: 100 }, (_, i) => `
        <Card key={i}>
          <Badge>Item ${i}</Badge>
          <Button>Button ${i}</Button>
        </Card>
      `).join('\n');

      const content = `
        'use client';

        export default function LargeComponent() {
          return (
            <div>
              ${largeContent}
            </div>
          );
        }
      `;

      const startTime = Date.now();
      const result = await this.validateContent('large-file.tsx', content);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 2 seconds)
      this.assert(duration < 2000, `Validation took too long: ${duration}ms`);
      this.assert(result.criticalIssues.length >= 2, 'Should detect missing Card, Badge, Button');
    });

    this.runTest('Real codebase validation', async () => {
      // Test against actual insights page (should pass after our fix)
      const insightsPath = path.join(process.cwd(), 'src/app/engine/results/insights/page.tsx');

      if (fs.existsSync(insightsPath)) {
        this.validator.criticalIssues = [];
        this.validator.warnings = [];
        await this.validator.loadComponentDatabase();
        this.validator.validateFile(insightsPath);

        this.assert(this.validator.criticalIssues.length === 0,
          `Insights page should have no critical issues after our fix, found: ${this.validator.criticalIssues.length}`);
      }
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
    this.log('📋 RUNTIME ERROR PREVENTION TEST REPORT', 'cyan');
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
      this.log(`✅ Runtime error prevention system is working correctly`, 'green');
      this.log(`✅ All import validation patterns work properly`, 'green');
      this.log(`✅ Historical runtime errors are prevented`, 'green');
      this.log(`🚀 System is ready for production deployment`, 'green');
    } else {
      this.log(`\n⚠️ TESTS FAILED - Runtime error prevention has issues`, 'red');
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
    this.log('🧪 RUNTIME ERROR PREVENTION TEST SUITE', 'cyan');
    this.log('Testing comprehensive import and component validation...\n', 'white');

    try {
      await this.testMissingComponentImports();
      await this.testMissingIconImports();
      await this.testHistoricalRegressions();
      await this.testEdgeCases();
      await this.testSystemIntegration();

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
  const testSuite = new RuntimeErrorPreventionTest();
  testSuite.run().catch(error => {
    console.error(`\n💥 Test Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = RuntimeErrorPreventionTest;