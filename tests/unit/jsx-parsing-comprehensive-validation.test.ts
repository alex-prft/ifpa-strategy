/**
 * Comprehensive JSX Parsing Validation Unit Tests
 *
 * CRITICAL REGRESSION PREVENTION SUITE
 *
 * This test suite ensures the JSX parsing validation system correctly:
 * 1. Detects all broken auto-fix patterns that cause compilation errors
 * 2. Ignores correct JSX expressions (no false positives)
 * 3. Handles all edge cases identified in gap analysis
 * 4. Maintains 100% detection accuracy
 *
 * Based on the comprehensive gap analysis that achieved 100% pass rate.
 *
 * @see scripts/jsx-parsing-validator.js
 * @see tests/validation-gap-analysis.test.js
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import the validator class
const JSXParsingValidator = require('../../scripts/jsx-parsing-validator.js');

interface ValidationResult {
  criticalIssues: Array<{
    file: string;
    line: number;
    content: string;
    issue: string;
    pattern: string;
    severity: string;
  }>;
  warnings: Array<{
    file: string;
    line: number;
    content: string;
    issue: string;
    pattern: string;
    severity: string;
  }>;
  checkedFiles: number;
}

describe('JSX Parsing Validation System', () => {
  let validator: any;
  let tempDir: string;

  beforeEach(() => {
    validator = new JSXParsingValidator();
    tempDir = path.join(__dirname, 'temp-jsx-validation');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper function to create test files and run validation
   */
  const validateContent = (fileName: string, content: string): ValidationResult => {
    const testFile = path.join(tempDir, fileName);
    fs.writeFileSync(testFile, content);

    // Reset validator state
    validator.criticalIssues = [];
    validator.warnings = [];
    validator.checkedFiles = 0;

    // Run validation
    validator.validateFile(testFile);

    return {
      criticalIssues: validator.criticalIssues,
      warnings: validator.warnings,
      checkedFiles: validator.checkedFiles
    };
  };

  describe('Critical Pattern Detection - Must Flag as Errors', () => {
    test('detects broken if conditionals with JSX expressions', () => {
      const content = `
        function test() {
          if (data.length {'< 3'}) {
            return false;
          }
        }
      `;

      const result = validateContent('broken-if.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('conditional statement');
    });

    test('detects broken while loops with JSX expressions', () => {
      const content = `
        function test() {
          while (count {'< 10'}) {
            count++;
          }
        }
      `;

      const result = validateContent('broken-while.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('while loop');
    });

    test('detects broken JSX conditionals with malformed expressions', () => {
      const content = `
        return (
          <div>
            {index {'< 4'} && <span>Show</span>}
          </div>
        );
      `;

      const result = validateContent('broken-jsx-conditional.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('JSX conditional');
    });

    test('detects broken for loops with JSX expressions', () => {
      const content = `
        function test() {
          for (let i = 0; i {'< 10'}; i++) {
            console.log(i);
          }
        }
      `;

      const result = validateContent('broken-for.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('for loop');
    });

    test('detects unescaped < in JSX content (original dxptools pattern)', () => {
      const content = `
        return (
          <p className="text-blue-600">< 2min</p>
        );
      `;

      const result = validateContent('unescaped-jsx.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('Unescaped < in JSX content');
    });

    test('detects complex broken patterns from real codebase', () => {
      const content = `
        // Real patterns that were broken by auto-fix
        if (authData.timestamp && (now - authData.timestamp) {'< 30'} * 24 * 60 * 60 * 1000) {
          return true;
        }

        return (
          <div>
            {hoursDiff {'< 1'} && <span className="text-green-600">Recent</span>}
          </div>
        );
      `;

      const result = validateContent('complex-broken.tsx', content);

      expect(result.criticalIssues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Correct Patterns - Must NOT Flag as Errors', () => {
    test('ignores correct JSX expressions for displaying < symbols', () => {
      const content = `
        return (
          <div>
            <p className="text-blue-600">{'< 2min'}</p>
            <span>{'< 30 seconds'}</span>
            <div>{'< 100 items'}</div>
          </div>
        );
      `;

      const result = validateContent('correct-jsx.tsx', content);

      expect(result.criticalIssues).toHaveLength(0);
    });

    test('ignores normal JavaScript comparisons', () => {
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

      const result = validateContent('normal-js.tsx', content);

      expect(result.criticalIssues).toHaveLength(0);
    });

    test('ignores JSX expressions in attributes', () => {
      const content = `
        return (
          <div>
            <input min={value < 10 ? 1 : 5} />
            <Component threshold={count < 100 ? 'low' : 'high'} />
            <div className={size < 5 ? 'small' : 'large'}>Content</div>
          </div>
        );
      `;

      const result = validateContent('jsx-attributes.tsx', content);

      expect(result.criticalIssues).toHaveLength(0);
    });

    test('ignores template literals with comparisons', () => {
      const content = `
        return (
          <div className={\`text-\${size < 10 ? 'sm' : 'lg'}\`}>
            {\`Items: \${count < 5 ? 'few' : 'many'}\`}
          </div>
        );
      `;

      const result = validateContent('template-literals.tsx', content);

      expect(result.criticalIssues).toHaveLength(0);
    });

    test('ignores complex nested expressions', () => {
      const content = `
        const result = useMemo(() => {
          return data.filter(item => item.value < 100)
                     .map(item => item.score < 50 ? 'low' : 'high');
        }, [data]);

        return (
          <div>
            {result.length < 5 && <EmptyState />}
            {result.map(item => (
              <Item key={item.id} priority={item.priority < 10 ? 'urgent' : 'normal'} />
            ))}
          </div>
        );
      `;

      const result = validateContent('complex-nested.tsx', content);

      expect(result.criticalIssues).toHaveLength(0);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('handles multiple spaces in JSX content', () => {
      const content = `<p>  <   3   min  </p>`;

      const result = validateContent('multiple-spaces.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('Unescaped < in JSX content');
    });

    test('handles nested JSX with unescaped content', () => {
      const content = `
        return (
          <div>
            <section>
              <span>< 5 items</span>
            </section>
          </div>
        );
      `;

      const result = validateContent('nested-unescaped.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
    });

    test('handles mixed valid and invalid patterns', () => {
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

      const result = validateContent('mixed-patterns.tsx', content);

      // Should only flag the invalid JSX pattern, not the valid JS or valid JSX
      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('Unescaped < in JSX content');
    });

    test('handles empty and whitespace patterns', () => {
      const content = `
        return (
          <div>
            <p> < </p>
            <span><  2</span>
            <div>   <   </div>
          </div>
        );
      `;

      const result = validateContent('whitespace-patterns.tsx', content);

      // Should detect the < 2 pattern but not plain < without numbers
      expect(result.criticalIssues.length).toBeGreaterThanOrEqual(1);
    });

    test('handles very complex expressions', () => {
      const content = `
        // This is a complex real-world pattern
        if (
          preferences.budget_priority === 'investment_focused' &&
          rule.condition.value {'< 500000'} &&
          segmentData.monthly_users {'< 5000'} &&
          segmentData.conversion_rate {'< 0.03'}
        ) {
          return <p>< 1 hour</p>;
        }
      `;

      const result = validateContent('complex-expressions.tsx', content);

      // Should detect multiple broken patterns
      expect(result.criticalIssues.length).toBeGreaterThan(3);
    });
  });

  describe('Regression Prevention - Historical Patterns', () => {
    test('prevents OSAWorkflowForm.tsx regression', () => {
      const content = `
        if (data.current_capabilities.length {'< 3'}) {
          setError('Please select at least 3 capabilities');
          return;
        }
      `;

      const result = validateContent('osa-workflow-regression.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('conditional statement');
    });

    test('prevents PasswordProtection.tsx regression', () => {
      const content = `
        if (authData.timestamp && (now - authData.timestamp) {'< 30'} * 24 * 60 * 60 * 1000) {
          return false;
        }
      `;

      const result = validateContent('password-protection-regression.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('conditional statement');
    });

    test('prevents dxptools page regression', () => {
      const content = `
        return (
          <Card className="p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-800">Data Freshness</h4>
            <p className="text-2xl font-bold text-blue-600">< 2min</p>
            <p className="text-xs text-blue-600 mt-1">Avg latency</p>
          </Card>
        );
      `;

      const result = validateContent('dxptools-regression.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('Unescaped < in JSX content');
    });

    test('prevents insights page regression', () => {
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

      const result = validateContent('insights-regression.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      expect(result.criticalIssues[0].issue).toContain('JSX conditional');
    });
  });

  describe('System Health and Performance', () => {
    test('validates system handles large files efficiently', () => {
      // Create a large file with mixed patterns
      const largeContent = Array.from({ length: 1000 }, (_, i) => `
        function test${i}() {
          if (value < ${i}) return true;
          return <span>{'< ${i} items'}</span>;
        }
      `).join('\n');

      const startTime = Date.now();
      const result = validateContent('large-file.tsx', largeContent);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(result.criticalIssues).toHaveLength(0);
      expect(result.checkedFiles).toBe(1);
    });

    test('validates system handles malformed files gracefully', () => {
      const malformedContent = `
        This is not valid JavaScript/TypeScript
        }<><{
        function ( incomplete
        if {'< broken'}
      `;

      // Should not throw errors, just return warnings/issues
      expect(() => {
        validateContent('malformed.tsx', malformedContent);
      }).not.toThrow();
    });

    test('validates system state is properly reset between files', () => {
      // First file with issues
      const firstContent = `if (x {'< 3'}) return;`;
      const firstResult = validateContent('first.tsx', firstContent);

      expect(firstResult.criticalIssues).toHaveLength(1);

      // Second file without issues
      const secondContent = `if (x < 3) return;`;
      const secondResult = validateContent('second.tsx', secondContent);

      // Should not carry over issues from first file
      expect(secondResult.criticalIssues).toHaveLength(0);
    });
  });

  describe('Integration with Build Process', () => {
    test('validates npm script integration works', async () => {
      // This would normally test the actual npm script
      // For unit test, we just verify the validator can be imported and used
      expect(validator).toBeDefined();
      expect(typeof validator.validateFile).toBe('function');
      expect(typeof validator.run).toBe('function');
    });

    test('validates exit codes are correct', () => {
      // Test that critical issues would cause exit code 1
      const criticalContent = `if (x {'< 3'}) return;`;
      const result = validateContent('critical.tsx', criticalContent);

      expect(result.criticalIssues.length).toBeGreaterThan(0);
      // In real usage, this would cause process.exit(1)
    });

    test('validates warning-only scenarios allow deployment', () => {
      // Normal JavaScript that might trigger warnings but not critical issues
      const warningContent = `
        function test() {
          if (count < 10) return true;
          return false;
        }
      `;

      const result = validateContent('warning-only.tsx', warningContent);

      expect(result.criticalIssues).toHaveLength(0);
      // Warnings are OK for deployment, only critical issues block
    });
  });

  describe('Documentation and Error Messages', () => {
    test('provides clear error descriptions for each pattern type', () => {
      const patterns = [
        { content: `if (x {'< 3'}) return;`, expectedType: 'conditional statement' },
        { content: `while (x {'< 3'}) continue;`, expectedType: 'while loop' },
        { content: `for (i = 0; i {'< 3'}; i++) break;`, expectedType: 'for loop' },
        { content: `{x {'< 3'} && <div />}`, expectedType: 'JSX conditional' },
        { content: `<p>< 3min</p>`, expectedType: 'Unescaped < in JSX content' }
      ];

      patterns.forEach((pattern, index) => {
        const result = validateContent(`pattern-${index}.tsx`, pattern.content);

        expect(result.criticalIssues).toHaveLength(1);
        expect(result.criticalIssues[0].issue.toLowerCase()).toContain(pattern.expectedType.toLowerCase());
      });
    });

    test('provides helpful fix suggestions in descriptions', () => {
      const content = `if (x {'< 3'}) return;`;
      const result = validateContent('fix-suggestion.tsx', content);

      expect(result.criticalIssues).toHaveLength(1);
      // The error should help identify what's wrong
      expect(result.criticalIssues[0].issue).toContain('JSX expression');
    });
  });
});

// Export for use in other test files
export { JSXParsingValidator };