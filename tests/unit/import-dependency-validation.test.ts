/**
 * Import Dependency Validation Tests
 *
 * Prevents runtime errors from missing imports by validating that all used
 * components, icons, and utilities are properly imported.
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const srcDir = path.join(process.cwd(), 'src');

// Common icons and components that are frequently used but might be missing
const COMMON_LUCIDE_ICONS = [
  'ArrowLeft', 'Settings', 'Database', 'FileText', 'Zap', 'Mail', 'BookOpen',
  'Users', 'Activity', 'TrendingUp', 'MessageSquare', 'Brain', 'BarChart3',
  'Calendar', 'Target', 'Heart', 'Eye', 'PieChart', 'Award'
];

const SHADCN_COMPONENTS = [
  'Card', 'CardHeader', 'CardTitle', 'CardContent', 'CardDescription', 'CardFooter',
  'Button', 'Badge', 'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
  'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogTrigger',
  'Input', 'Label', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger',
  'SelectValue', 'Textarea', 'Checkbox', 'RadioGroup', 'RadioGroupItem',
  'Switch', 'Slider', 'Progress', 'Avatar', 'AvatarFallback', 'AvatarImage',
  'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger',
  'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger'
];

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
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }

  return files;
}

function extractImports(content: string): { lucideIcons: string[], shadcnComponents: string[] } {
  const lucideImportMatch = content.match(/from ['"]lucide-react['"];\s*$|import\s*{([^}]+)}\s*from\s*['"]lucide-react['"];?/gm);
  const shadcnImportMatches = content.match(/from\s*['"]@\/components\/ui\/[^'"]+['"];?/gm);

  const lucideIcons: string[] = [];
  const shadcnComponents: string[] = [];

  // Extract Lucide icons
  if (lucideImportMatch) {
    lucideImportMatch.forEach(match => {
      const importContent = match.match(/{\s*([^}]+)\s*}/);
      if (importContent) {
        const imports = importContent[1]
          .split(',')
          .map(imp => imp.trim())
          .filter(imp => imp.length > 0);
        lucideIcons.push(...imports);
      }
    });
  }

  // Extract shadcn components
  if (shadcnImportMatches) {
    shadcnImportMatches.forEach(match => {
      const importContent = match.match(/{\s*([^}]+)\s*}/);
      if (importContent) {
        const imports = importContent[1]
          .split(',')
          .map(imp => imp.trim())
          .filter(imp => imp.length > 0);
        shadcnComponents.push(...imports);
      }
    });
  }

  return { lucideIcons, shadcnComponents };
}

function findUsedComponents(content: string): { lucideIcons: string[], shadcnComponents: string[] } {
  const lucideIcons: string[] = [];
  const shadcnComponents: string[] = [];

  // Find used Lucide icons (as JSX components)
  COMMON_LUCIDE_ICONS.forEach(icon => {
    const iconPattern = new RegExp(`<${icon}[\\s/>]`, 'g');
    if (iconPattern.test(content)) {
      lucideIcons.push(icon);
    }
  });

  // Find used shadcn components
  SHADCN_COMPONENTS.forEach(component => {
    const componentPattern = new RegExp(`<${component}[\\s/>]`, 'g');
    if (componentPattern.test(content)) {
      shadcnComponents.push(component);
    }
  });

  return { lucideIcons, shadcnComponents };
}

describe('Import Dependency Validation', () => {
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

      it('should import all used Lucide React icons', () => {
        const imports = extractImports(content);
        const usedIcons = findUsedComponents(content);

        const missingIcons = usedIcons.lucideIcons.filter(
          icon => !imports.lucideIcons.includes(icon)
        );

        if (missingIcons.length > 0) {
          const currentImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"];?/);
          const currentImports = currentImportMatch
            ? currentImportMatch[1].split(',').map(imp => imp.trim())
            : [];

          const allImports = [...currentImports, ...missingIcons].sort();
          const suggestedImport = `import { ${allImports.join(', ')} } from 'lucide-react';`;

          expect(missingIcons).toEqual([]);
          console.error(`
Missing Lucide React imports in ${filePath}:
Missing: ${missingIcons.join(', ')}
Suggested import statement:
${suggestedImport}
          `.trim());
        }
      });

      it('should import all used shadcn/ui components', () => {
        const imports = extractImports(content);
        const usedComponents = findUsedComponents(content);

        const missingComponents = usedComponents.shadcnComponents.filter(
          component => !imports.shadcnComponents.includes(component)
        );

        if (missingComponents.length > 0) {
          expect(missingComponents).toEqual([]);
          console.error(`
Missing shadcn/ui component imports in ${filePath}:
Missing: ${missingComponents.join(', ')}

Add these import statements:
${missingComponents.map(comp =>
  `import { ${comp} } from '@/components/ui/${comp.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}';`
).join('\n')}
          `.trim());
        }
      });

      it('should not have unused imports (to keep bundle size minimal)', () => {
        const imports = extractImports(content);
        const usedComponents = findUsedComponents(content);

        const unusedLucideIcons = imports.lucideIcons.filter(
          icon => !usedComponents.lucideIcons.includes(icon)
        );

        const unusedShadcnComponents = imports.shadcnComponents.filter(
          component => !usedComponents.shadcnComponents.includes(component)
        );

        if (unusedLucideIcons.length > 0 || unusedShadcnComponents.length > 0) {
          console.warn(`
Unused imports detected in ${filePath}:
${unusedLucideIcons.length > 0 ? `Unused Lucide icons: ${unusedLucideIcons.join(', ')}` : ''}
${unusedShadcnComponents.length > 0 ? `Unused shadcn components: ${unusedShadcnComponents.join(', ')}` : ''}

Consider removing unused imports to optimize bundle size.
          `.trim());
        }
      });

      it('should use consistent import patterns', () => {
        const importLines = content.split('\n').filter(line =>
          line.trim().startsWith('import') && line.includes('from')
        );

        const inconsistencies: string[] = [];

        importLines.forEach((line, index) => {
          // Check for missing semicolons
          if (!line.trim().endsWith(';')) {
            inconsistencies.push(`Line ${index + 1}: Missing semicolon - ${line.trim()}`);
          }

          // Check for inconsistent quote usage (prefer single quotes)
          if (line.includes('"') && !line.includes("'")) {
            inconsistencies.push(`Line ${index + 1}: Use single quotes for consistency - ${line.trim()}`);
          }
        });

        if (inconsistencies.length > 0) {
          console.warn(`
Import consistency issues in ${filePath}:
${inconsistencies.join('\n')}
          `.trim());
        }
      });

      it('should have proper React imports when using JSX', () => {
        // Check if file contains JSX but is missing React import
        const hasJSX = /<[A-Z]/.test(content);
        const hasReactImport = /import.*React.*from\s*['"]react['"]/.test(content);
        const hasUseClientDirective = /'use client'/.test(content);

        if (hasJSX && !hasReactImport && filePath.endsWith('.tsx')) {
          // In Next.js 13+ with app router, React import is not always required
          // but it's good practice to have it
          console.info(`
Note: ${filePath} contains JSX but no explicit React import.
This is fine in Next.js 13+ but consider adding for clarity:
import React from 'react';
          `.trim());
        }

        if (hasUseClientDirective && !hasJSX) {
          console.warn(`
Warning: ${filePath} has 'use client' directive but no JSX.
Consider if this component actually needs to be a client component.
          `.trim());
        }
      });
    });
  });

  it('should provide import best practices guidance', () => {
    console.log(`
Import Dependency Best Practices:
1. Always import all used icons from lucide-react
2. Import shadcn/ui components from their specific paths: @/components/ui/[component]
3. Remove unused imports to optimize bundle size
4. Use consistent import formatting (single quotes, semicolons)
5. Group imports logically: React first, then external libraries, then internal components
6. Use 'use client' directive only when necessary for client-side functionality
    `.trim());
  });
});