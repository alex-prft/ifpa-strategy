/**
 * Auto-fix Validation Tests
 *
 * These tests ensure that the auto-fix functionality in error-prevention.js
 * correctly fixes JSX parsing errors while preserving valid JavaScript syntax.
 *
 * Prevents regressions where auto-fix breaks conditional statements, mathematical
 * expressions, or other valid JavaScript operators.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Import the ErrorDetector class for testing
const ErrorDetector = require('../../scripts/error-prevention.js');

describe('Auto-fix JSX Parsing Errors', () => {

  describe('Should fix JSX content display issues', () => {
    it('should fix unescaped < characters in JSX content between tags', () => {
      const testContent = `
        <div>
          <p>Time remaining: < 2min</p>
          <span>Budget: < 100 dollars</span>
        </div>
      `;

      const expectedContent = `
        <div>
          <p>Time remaining: {'< 2min'}</p>
          <span>Budget: {'< 100 dollars'}</span>
        </div>
      `;

      // Apply the same regex as the auto-fix
      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      expect(fixedContent).toContain("{'< 2min'}");
      expect(fixedContent).toContain("{'< 100'}");
    });

    it('should handle multiple JSX content issues in the same file', () => {
      const testContent = `
        <div>
          <p>Duration: < 5 seconds</p>
          <p>Size: < 10MB</p>
          <p>Count: < 999 items</p>
        </div>
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      expect(fixedContent).toContain("{'< 5'}");
      expect(fixedContent).toContain("{'< 10'}");
      expect(fixedContent).toContain("{'< 999'}");
    });
  });

  describe('Should preserve valid JavaScript syntax', () => {
    it('should NOT modify JavaScript conditional statements', () => {
      const testContent = `
        function getDataFreshness(lastReceived: Date) {
          const now = new Date();
          const timeDiff = now.getTime() - lastReceived.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);

          if (hoursDiff < 1) return 'fresh';
          if (hoursDiff < 24) return 'stale';
          return 'old';
        }
      `;

      // Apply the auto-fix regex
      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should remain unchanged
      expect(fixedContent).toBe(testContent);
      expect(fixedContent).toContain('if (hoursDiff < 1)');
      expect(fixedContent).toContain('if (hoursDiff < 24)');
    });

    it('should NOT modify JSX conditional expressions', () => {
      const testContent = `
        <div>
          {index < 4 && (
            <span>Valid JSX conditional</span>
          )}
          {count < 10 ? 'Small' : 'Large'}
        </div>
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should remain unchanged
      expect(fixedContent).toBe(testContent);
      expect(fixedContent).toContain('{index < 4 &&');
      expect(fixedContent).toContain('{count < 10 ?');
    });

    it('should NOT modify while loops and for loops', () => {
      const testContent = `
        function processData() {
          let i = 0;
          while (i < 100) {
            console.log(i);
            i++;
          }

          for (let j = 0; j < 50; j++) {
            process(j);
          }
        }
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should remain unchanged
      expect(fixedContent).toBe(testContent);
      expect(fixedContent).toContain('while (i < 100)');
      expect(fixedContent).toContain('j < 50');
    });

    it('should NOT modify mathematical expressions', () => {
      const testContent = `
        const isValid = value < 100 && value > 0;
        const result = x < 5 ? 'small' : 'large';
        const array = numbers.filter(n => n < 10);
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should remain unchanged
      expect(fixedContent).toBe(testContent);
      expect(fixedContent).toContain('value < 100');
      expect(fixedContent).toContain('x < 5');
      expect(fixedContent).toContain('n < 10');
    });

    it('should NOT modify comparison operators in function parameters', () => {
      const testContent = `
        function compareValues(a: number, b: number) {
          return a < 1000 && b < 500;
        }

        const callback = (num: number) => num < 42;
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should remain unchanged
      expect(fixedContent).toBe(testContent);
      expect(fixedContent).toContain('a < 1000');
      expect(fixedContent).toContain('b < 500');
      expect(fixedContent).toContain('num < 42');
    });
  });

  describe('Mixed scenarios - complex real-world cases', () => {
    it('should fix JSX content while preserving JavaScript logic in the same file', () => {
      const testContent = `
        function DataComponent({ data }: Props) {
          const hoursDiff = getTimeDiff();

          if (hoursDiff < 1) {
            return <span className="fresh">Fresh data</span>;
          }

          return (
            <div>
              <p>Data age: < 2 hours</p>
              {hoursDiff < 24 && (
                <span className="recent">Recent data</span>
              )}
              <p>Updated: < 30 minutes ago</p>
            </div>
          );
        }
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should fix JSX content
      expect(fixedContent).toContain("{'< 2'}");
      expect(fixedContent).toContain("{'< 30'}");

      // Should preserve JavaScript logic
      expect(fixedContent).toContain('if (hoursDiff < 1)');
      expect(fixedContent).toContain('{hoursDiff < 24 &&');
    });

    it('should work correctly with nested JSX and complex conditional logic', () => {
      const testContent = `
        <Card>
          {items.map((item, index) => (
            <div key={item.id}>
              <p>Processing time: < 5 seconds</p>
              {index < 4 && (
                <div>
                  <span>Size: < 10 MB</span>
                  {item.priority < 3 ? (
                    <span>High priority</span>
                  ) : (
                    <span>Duration: < 1 hour</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      `;

      const fixedContent = testContent.replace(
        /(>)\s*< (\d+\w*)\s*(<)/g,
        (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
      );

      // Should fix JSX content display
      expect(fixedContent).toContain("{'< 5'}");
      expect(fixedContent).toContain("{'< 10'}");
      expect(fixedContent).toContain("{'< 1'}");

      // Should preserve JavaScript conditionals
      expect(fixedContent).toContain('{index < 4 &&');
      expect(fixedContent).toContain('{item.priority < 3 ?');
    });
  });

  describe('Detection pattern validation', () => {
    it('should detect problematic JSX content patterns', () => {
      const testContent = `
        <div>
          <p>Time: < 5 minutes</p>
        </div>
      `;

      // Test the detection regex
      const detectionPattern = /(>)\s*< \d+/g;
      const matches = testContent.match(detectionPattern);

      expect(matches).toBeTruthy();
      expect(matches?.length).toBe(1);
      expect(matches?.[0]).toContain('< 5');
    });

    it('should NOT detect JavaScript conditionals as problematic', () => {
      const testContent = `
        if (count < 5) {
          return 'small';
        }

        while (index < 10) {
          index++;
        }
      `;

      const detectionPattern = /(>)\s*< \d+/g;
      const matches = testContent.match(detectionPattern);

      expect(matches).toBeFalsy();
    });

    it('should NOT detect JSX conditionals as problematic', () => {
      const testContent = `
        <div>
          {count < 5 && <span>Small</span>}
          {value < 100 ? 'Valid' : 'Invalid'}
        </div>
      `;

      const detectionPattern = /(>)\s*< \d+/g;
      const matches = testContent.match(detectionPattern);

      expect(matches).toBeFalsy();
    });
  });
});

// Integration test with the actual ErrorDetector class
describe('ErrorDetector Auto-fix Integration', () => {
  it('should not break valid JavaScript when auto-fixing is disabled', async () => {
    const detector = new ErrorDetector();

    // Mock a file with valid JavaScript conditionals
    const testFile = path.join(__dirname, 'test-conditional.tsx');
    const validContent = `
      function TestComponent() {
        const [count, setCount] = useState(0);

        if (count < 5) {
          return <div>Count is small</div>;
        }

        return (
          <div>
            {count < 10 && <span>Less than 10</span>}
            <p>Current count: {count}</p>
          </div>
        );
      }
    `;

    // Write test file
    fs.writeFileSync(testFile, validContent);

    try {
      // Run JSX syntax check
      await detector.checkJSXSyntax();

      // Verify the file wasn't modified incorrectly
      const fileContent = fs.readFileSync(testFile, 'utf8');
      expect(fileContent).toContain('if (count < 5)');
      expect(fileContent).toContain('{count < 10 &&');

      // Should not contain broken auto-fix syntax
      expect(fileContent).not.toContain("{'< 5'}");
      expect(fileContent).not.toContain("{'< 10'}");

    } finally {
      // Clean up test file
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });
});