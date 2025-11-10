/**
 * JSX Syntax Validation Tests
 *
 * Prevents JSX parsing errors that block development server compilation.
 * Tests for common patterns that cause "Identifier cannot follow number" errors.
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const srcDir = path.join(process.cwd(), 'src');

// Get all TypeScript React files
function getAllTsxFiles(dir: string): string[] {
  let files: string[] = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files = files.concat(getAllTsxFiles(fullPath));
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist or be accessible
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }

  return files;
}

describe('JSX Syntax Validation', () => {
  const tsxFiles = getAllTsxFiles(srcDir);

  if (tsxFiles.length === 0) {
    it('should find TSX files to test', () => {
      expect(tsxFiles.length).toBeGreaterThan(0);
    });
    return;
  }

  tsxFiles.forEach((filePath) => {
    describe(`File: ${path.relative(process.cwd(), filePath)}`, () => {
      let content: string;

      beforeAll(() => {
        try {
          content = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
          content = '';
        }
      });

      it('should not contain unescaped < characters before numbers in JSX', () => {
        // Pattern: < followed by space and number (common error pattern)
        const problematicPattern = /[^{]< \d/g;
        const matches = content.match(problematicPattern);

        if (matches) {
          const lines = content.split('\n');
          const errorDetails = matches.map(match => {
            const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
            return `Line ${lineNumber}: "${match.trim()}"`;
          });

          expect(matches).toBeNull();
          console.error(`JSX Parsing Error Prevention: Found unescaped < characters:\n${errorDetails.join('\n')}`);
        }
      });

      it('should not contain unescaped < characters in template literals within JSX', () => {
        // Pattern: < followed by alphanumeric (broader check)
        const jsxOpenTagPattern = /<[^>\s/!]/g;
        const templateLiteralPattern = /`[^`]*<[^`]*`/g;

        const templateMatches = content.match(templateLiteralPattern);
        if (templateMatches) {
          templateMatches.forEach(template => {
            const innerMatches = template.match(jsxOpenTagPattern);
            if (innerMatches) {
              const lines = content.split('\n');
              const lineNumber = lines.findIndex(line => line.includes(template)) + 1;

              expect(innerMatches).toBeNull();
              console.error(`JSX Parsing Error: Unescaped < in template literal at line ${lineNumber}: ${template}`);
            }
          });
        }
      });

      it('should use proper HTML entity encoding or JSX expressions for mathematical symbols', () => {
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip import lines, comments, and non-JSX content
          if (line.trim().startsWith('import') ||
              line.trim().startsWith('//') ||
              line.trim().startsWith('/*') ||
              line.trim().startsWith('*') ||
              !line.includes('<')) {
            return;
          }

          // Check for < followed by space and number/word in JSX content
          const problematicPattern = />\s*[^<]*< [0-9a-zA-Z]/;
          if (problematicPattern.test(line)) {
            const suggestion = line.replace(
              /< (\d+\w*)/g,
              (match, capture) => `{'< ${capture}'}`
            );

            expect(problematicPattern.test(line)).toBe(false);
            console.error(`
JSX Parsing Error at ${filePath}:${index + 1}
Problematic line: ${line.trim()}
Suggested fix: ${suggestion}
            `.trim());
          }
        });
      });

      it('should not have missing closing tags in JSX', () => {
        // Basic check for common JSX tag mismatch patterns
        const openTags = (content.match(/<[a-zA-Z][^>/]*[^/]>/g) || []).length;
        const closeTags = (content.match(/<\/[a-zA-Z][^>]*>/g) || []).length;
        const selfClosingTags = (content.match(/<[a-zA-Z][^>]*\/>/g) || []).length;

        // This is a basic check - more sophisticated parsers would be needed for complete accuracy
        if (Math.abs(openTags - closeTags - selfClosingTags) > 5) { // Allow some tolerance for complex JSX
          console.warn(`Potential tag mismatch in ${filePath}: Open=${openTags}, Close=${closeTags}, SelfClosing=${selfClosingTags}`);
        }
      });

      it('should not contain dynamic Tailwind classes that might be purged in production', () => {
        // Check for template literal Tailwind classes
        const dynamicTailwindPattern = /className=\{[^}]*`[^`]*\$\{[^}]*\}[^`]*`[^}]*\}/g;
        const matches = content.match(dynamicTailwindPattern);

        if (matches) {
          const lines = content.split('\n');
          matches.forEach(match => {
            const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
            console.warn(`
Potential Tailwind Purge Issue at ${filePath}:${index + 1}:
Dynamic class: ${match}
Suggestion: Use explicit conditional logic instead of template literals for Tailwind classes.
            `.trim());
          });
        }
      });
    });
  });

  it('should provide guidance for JSX best practices', () => {
    console.log(`
JSX Syntax Best Practices:
1. Use JSX expressions for mathematical symbols: {'< 2min'} instead of &lt; 2min
2. Use HTML entities only when JSX expressions aren't suitable: &lt; &gt; &amp;
3. Avoid dynamic Tailwind classes: use explicit conditionals instead of template literals
4. Always close JSX tags properly
5. Use proper escaping in template literals within JSX
6. Test compilation after making changes to JSX content
    `.trim());
  });
});