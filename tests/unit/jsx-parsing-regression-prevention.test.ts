/**
 * JSX Parsing Regression Prevention Tests
 *
 * CRITICAL: These tests prevent the recurrence of auto-fix breaking valid JavaScript
 * conditionals by incorrectly transforming comparison operators into JSX expressions.
 *
 * Historical Context:
 * - Original auto-fix regex: /([^{'"]\s*)<\s+(\d+\w*)/g
 * - Problem: Matched JavaScript conditionals like "if (count < 5)"
 * - Incorrect transformation: "if (count {'< 5'})" -> PARSING ERROR
 * - Improved regex: /(>)\s*< (\d+\w*)\s*(<)/g - Only targets JSX content
 *
 * These tests ensure this regression NEVER happens again.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('JSX Parsing Regression Prevention', () => {

  describe('Critical: Prevent auto-fix breaking JavaScript conditionals', () => {
    it('should NEVER contain broken conditional pattern {"< number"} in any file', async () => {
      // This pattern indicates auto-fix broke JavaScript conditionals
      const brokenPatterns = [
        /{'<\s*\d+\w*'}/g,  // {'< 3'}, {'< 30'}, etc.
        /{'\s*<\s*\d+\w*'}/g,  // Variations with different spacing
      ];

      const srcDir = path.join(process.cwd(), 'src');
      const files = getAllFiles(srcDir, ['.tsx', '.ts']);

      const brokenFiles: { file: string; line: number; content: string; pattern: string }[] = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');

          for (const pattern of brokenPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
              const lineIndex = content.substring(0, match.index).split('\n').length - 1;
              brokenFiles.push({
                file: path.relative(process.cwd(), file),
                line: lineIndex + 1,
                content: lines[lineIndex]?.trim() || '',
                pattern: match[0]
              });
            }
          }
        } catch (error) {
          console.warn(`Could not read file ${file}:`, error);
        }
      }

      // CRITICAL ASSERTION: No broken patterns should exist
      if (brokenFiles.length > 0) {
        const errorMessage = brokenFiles
          .map(item => `${item.file}:${item.line} - "${item.content}" contains broken pattern: ${item.pattern}`)
          .join('\n');

        throw new Error(
          `❌ CRITICAL REGRESSION DETECTED: Auto-fix broke JavaScript conditionals!\n` +
          `Files with broken patterns:\n${errorMessage}\n\n` +
          `These patterns indicate the auto-fix script incorrectly transformed valid JavaScript ` +
          `comparison operators into JSX expressions, breaking compilation.`
        );
      }

      expect(brokenFiles).toHaveLength(0);
    });

    it('should validate specific files that previously had broken patterns are now fixed', () => {
      // These files specifically had auto-fix issues - ensure they're now correct
      const criticalFiles = [
        'src/app/engine/results/insights/page.tsx',
        'src/components/ResultsSidebar.tsx',
        'src/components/OSAWorkflowForm.tsx',
        'src/components/PasswordProtection.tsx'
      ];

      const validConditionalPatterns = [
        /if\s*\([^{]*<\s*\d+[^}]*\)/g,  // if (variable < number)
        /while\s*\([^{]*<\s*\d+[^}]*\)/g,  // while (variable < number)
        /{\s*\w+\s*<\s*\d+\s*&&/g,  // {variable < number &&
        /{\s*\w+\s*<\s*\d+\s*\?/g,  // {variable < number ?
      ];

      for (const filePath of criticalFiles) {
        const fullPath = path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Should NOT contain broken patterns
          expect(content).not.toMatch(/{'<\s*\d+}/);
          expect(content).not.toMatch(/{'\s*<\s*\d+\w*'}/);

          // Should contain valid conditional patterns if they exist
          const lines = content.split('\n');
          const conditionalLines = lines.filter(line =>
            line.includes('if (') || line.includes('while (') ||
            line.includes('< ') || line.includes('{') && line.includes('<')
          );

          // Verify no conditional line contains broken JSX pattern
          for (const line of conditionalLines) {
            expect(line).not.toMatch(/{'<\s*\d+/);
            expect(line).not.toMatch(/{'\s*<\s*\d+/);
          }
        }
      }
    });
  });

  describe('Auto-fix regex validation', () => {
    it('improved regex should only match JSX content, not JavaScript conditionals', () => {
      // Test the improved detection regex: /(>)\s*< \d+/g
      const improvedDetectionRegex = /(>)\s*< \d+/g;

      // Should MATCH: JSX content display issues
      const jsxContentCases = [
        '<p>< 5 minutes</p>',
        '<span>< 100 items</span>',
        '<div>< 30 seconds</div>',
      ];

      for (const testCase of jsxContentCases) {
        const matches = testCase.match(improvedDetectionRegex);
        expect(matches).toBeTruthy();
        expect(matches?.length).toBeGreaterThan(0);
      }

      // Should NOT MATCH: JavaScript conditionals
      const jsConditionalCases = [
        'if (count < 5) return;',
        'while (i < 100) { i++; }',
        'const result = value < 30 ? "small" : "large";',
        '{index < 4 && <span>Valid</span>}',
        '(now - timestamp) < 30 * 24 * 60 * 60 * 1000',
        'data.capabilities.length < 3',
      ];

      for (const testCase of jsConditionalCases) {
        const matches = testCase.match(improvedDetectionRegex);
        expect(matches).toBeFalsy();
      }
    });

    it('improved auto-fix regex should only fix JSX content', () => {
      // Test the improved auto-fix regex: /(>)\s*< (\d+\w*)\s*(<)/g
      const improvedAutoFixRegex = /(>)\s*< (\d+\w*)\s*(<)/g;

      // Should MATCH and FIX: JSX content between tags
      const jsxFixCases = [
        {
          input: '<p>< 5</p>',
          expected: '<p>{\'< 5\'}</p>',
          shouldMatch: true
        },
        {
          input: '<span>< 100</span>',
          expected: '<span>{\'< 100\'}</span>',
          shouldMatch: true
        }
      ];

      for (const testCase of jsxFixCases) {
        if (testCase.shouldMatch) {
          const fixed = testCase.input.replace(
            improvedAutoFixRegex,
            (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
          );
          expect(fixed).toBe(testCase.expected);
        }
      }

      // Should NOT MATCH: JavaScript conditionals (leave unchanged)
      const jsPreserveCases = [
        'if (count < 5) return;',
        'while (i < 100) continue;',
        '{index < 4 && <span>Test</span>}',
        'data.length < 3',
        '(now - time) < 30 * 60 * 1000',
      ];

      for (const testCase of jsPreserveCases) {
        const result = testCase.replace(
          improvedAutoFixRegex,
          (match, openTag, number, closeTag) => `${openTag}{'< ${number}'}${closeTag}`
        );
        // Should remain unchanged
        expect(result).toBe(testCase);
      }
    });
  });

  describe('Error detection integration', () => {
    it('should detect the specific errors that occurred in production', async () => {
      // Simulate the exact broken patterns that occurred
      const brokenTestCases = [
        `if (data.current_capabilities.length {'< 3'}) {`,
        `if (authData.timestamp && (now - authData.timestamp) {'< 30'} * 24 * 60 * 60 * 1000) {`,
        `{index {'< 4'} && (`,
        `if (hoursDiff {'< 1'}) return 'fresh';`,
        `if (hoursDiff {'< 24'}) return 'stale';`
      ];

      const detectionPattern = /{'<\s*\d+\w*'}/g;

      for (const testCase of brokenTestCases) {
        const matches = testCase.match(detectionPattern);
        expect(matches).toBeTruthy();
        expect(matches?.length).toBeGreaterThan(0);
      }
    });

    it('should pass validation for correctly fixed patterns', () => {
      // These are the corrected versions
      const fixedTestCases = [
        `if (data.current_capabilities.length < 3) {`,
        `if (authData.timestamp && (now - authData.timestamp) < 30 * 24 * 60 * 60 * 1000) {`,
        `{index < 4 && (`,
        `if (hoursDiff < 1) return 'fresh';`,
        `if (hoursDiff < 24) return 'stale';`
      ];

      const brokenPattern = /{'<\s*\d+\w*'}/g;

      for (const testCase of fixedTestCases) {
        const matches = testCase.match(brokenPattern);
        expect(matches).toBeFalsy();
      }
    });
  });

  describe('Comprehensive codebase validation', () => {
    it('should validate all TypeScript/TSX files for JSX parsing compliance', async () => {
      const srcDir = path.join(process.cwd(), 'src');
      const files = getAllFiles(srcDir, ['.tsx', '.ts']);

      const issues: { file: string; issue: string }[] = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');

          // Check for multiple types of JSX parsing issues
          const checks = [
            {
              pattern: /{'<\s*\d+}/g,
              message: 'Contains broken auto-fix pattern'
            },
            {
              pattern: /[^{'"]\s*<\s+\d+[^}]/g,
              message: 'May contain unescaped < before numbers outside JSX expressions'
            },
            {
              pattern: /if\s*\([^)]*{'\s*<\s*\d+/g,
              message: 'Contains broken conditional statement with JSX expression'
            }
          ];

          for (const check of checks) {
            const matches = content.match(check.pattern);
            if (matches) {
              issues.push({
                file: path.relative(process.cwd(), file),
                issue: `${check.message}: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`
              });
            }
          }
        } catch (error) {
          console.warn(`Could not validate file ${file}:`, error);
        }
      }

      if (issues.length > 0) {
        const errorMessage = issues
          .map(item => `${item.file}: ${item.issue}`)
          .join('\n');

        throw new Error(
          `❌ JSX PARSING ISSUES DETECTED:\n${errorMessage}\n\n` +
          `These files contain patterns that may cause compilation errors or indicate ` +
          `auto-fix regressions. Please review and fix before deployment.`
        );
      }

      expect(issues).toHaveLength(0);
    });
  });
});

// Utility function to get all files recursively
function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
  let files: string[] = [];

  try {
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }

  return files;
}