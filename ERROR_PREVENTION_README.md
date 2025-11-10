# OSA Error Prevention & Detection System

This comprehensive error prevention system automatically detects and prevents common development errors that can block compilation, cause runtime failures, or degrade user experience.

## 🚨 Common Errors We Prevent

### 1. **JSX Parsing Errors** (Critical - Blocks Compilation)
- **Issue**: `< 2min` syntax causes "Identifier cannot follow number" errors
- **Solution**: Use JSX expressions `{'< 2min'}` or HTML entities `&lt; 2min`
- **Detection**: Automatically scans all `.tsx` files for unescaped `<` characters

### 2. **Missing Import Dependencies** (Runtime Errors)
- **Issue**: Using Lucide icons or components without importing them
- **Solution**: Auto-detects missing imports and suggests fixes
- **Detection**: Compares used components against import statements

### 3. **Database Connection Failures** (API Resilience)
- **Issue**: `TypeError: fetch failed` when Supabase is unavailable
- **Solution**: Implement fallback mechanisms and error handling
- **Detection**: Validates API routes have proper error handling

### 4. **Authentication Failures** (Security Issues)
- **Issue**: Missing or invalid bearer token validation
- **Solution**: Add proper authentication checks to API routes
- **Detection**: Scans API routes for security patterns

## 🛠️ Usage Instructions

### Quick Start
```bash
# Run error detection (recommended before commits)
npm run error-check

# Run with automatic fixes
npm run error-check:fix

# Run comprehensive unit tests
npm run test:error-prevention

# Complete pre-commit validation
npm run pre-commit

# Full pre-deployment validation
npm run pre-deploy
```

### Manual Error Detection Script
```bash
# Run the error detection script directly
node scripts/error-prevention.js

# Enable verbose output
DEBUG=1 node scripts/error-prevention.js
```

## 🔧 Automated Error Fixes

The system can automatically fix certain types of errors:

### JSX Parsing Errors
```typescript
// ❌ BEFORE (causes parsing error)
<p>< 2min</p>

// ✅ AFTER (auto-fixed)
<p>{'< 2min'}</p>
```

### Import Dependencies
```typescript
// ❌ BEFORE (missing imports)
import { Card } from '@/components/ui/card';

function MyComponent() {
  return <Card><Button>Click</Button></Card>; // Button not imported
}

// ✅ AFTER (detected and suggested)
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function MyComponent() {
  return <Card><Button>Click</Button></Card>;
}
```

## 📊 Error Detection Categories

### 🔴 Critical Errors (Must Fix)
- JSX parsing errors that prevent compilation
- Missing imports causing runtime errors
- TypeScript compilation failures
- Missing environment variables

### 🟡 Warnings (Should Fix)
- Missing error handling in API routes
- Dynamic Tailwind classes that might be purged
- Unused imports affecting bundle size
- Missing status codes in API responses

### 🟢 Auto-fixable Issues
- JSX parsing errors with `< number` patterns
- Consistent import formatting
- Environment file structure

## 🧪 Unit Test Suite

### Test Categories

1. **JSX Syntax Validation** (`jsx-syntax-validation.test.ts`)
   - Detects unescaped `<` characters in JSX
   - Validates mathematical symbol encoding
   - Checks for dynamic Tailwind class issues

2. **Import Dependency Validation** (`import-dependency-validation.test.ts`)
   - Validates all used Lucide icons are imported
   - Checks shadcn/ui component imports
   - Detects unused imports for optimization

3. **API Resilience Validation** (`api-resilience-validation.test.ts`)
   - Ensures API routes have error handling
   - Validates authentication patterns
   - Checks database resilience mechanisms

### Running Tests
```bash
# Run all unit tests
npm run test:unit

# Watch mode for development
npm run test:unit:watch

# Run specific test file
npx vitest tests/unit/jsx-syntax-validation.test.ts
```

## 🔄 Integration with Development Workflow

### Pre-commit Hook (Recommended)
Add to your `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run pre-commit
if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed. Fix errors before committing."
  exit 1
fi
```

### CI/CD Integration
Add to your GitHub Actions or deployment pipeline:
```yaml
- name: Run Error Prevention Checks
  run: |
    npm install
    npm run error-check
    npm run test:error-prevention
```

### VS Code Integration
Add to `.vscode/tasks.json`:
```json
{
  "label": "OSA Error Check",
  "type": "shell",
  "command": "npm run error-check",
  "group": "test",
  "presentation": {
    "echo": true,
    "reveal": "always"
  }
}
```

## 📁 File Structure

```
/scripts/
  error-prevention.js         # Main error detection script
/tests/
  /unit/
    jsx-syntax-validation.test.ts        # JSX parsing checks
    import-dependency-validation.test.ts # Import validation
    api-resilience-validation.test.ts    # API error handling
  setup.ts                   # Test configuration
vitest.config.ts            # Test runner configuration
```

## 🚀 Best Practices

### For Developers
1. **Run `npm run error-check` before each commit**
2. **Fix all critical errors immediately**
3. **Address warnings during code review**
4. **Use auto-fix for safe, automated repairs**

### For Code Reviews
1. **Verify error prevention tests pass**
2. **Check that new JSX content uses proper encoding**
3. **Ensure API routes have error handling**
4. **Validate import statements are complete**

### for Deployment
1. **Run `npm run pre-deploy` before production**
2. **Monitor error detection results in CI/CD**
3. **Set up alerts for critical error detection**
4. **Review warnings regularly for improvements**

## 🔍 Troubleshooting

### Common Issues

**"No files found for testing"**
- Ensure you're running from the project root directory
- Check that the `src/` directory exists

**"TypeScript compilation failed"**
- Run `npx tsc --noEmit` to see detailed TypeScript errors
- Fix TypeScript issues before running error prevention

**"Module not found" errors**
- Install dependencies: `npm install`
- Ensure vitest is installed: `npm install --save-dev vitest`

### Debug Mode
```bash
# Enable detailed logging
DEBUG=1 node scripts/error-prevention.js

# Verbose test output
npm run test:unit -- --reporter=verbose
```

## 📈 Metrics & Monitoring

The error prevention system generates detailed reports:

- **Success Rate**: Percentage of files passing all checks
- **Error Trends**: Historical view of common error patterns
- **Auto-fix Rate**: How many issues were automatically resolved
- **Performance Impact**: Time saved by preventing runtime errors

Reports are saved to `error-detection-results.json` for analysis.

## 🤝 Contributing

To extend the error prevention system:

1. **Add new error patterns** to `scripts/error-prevention.js`
2. **Create corresponding unit tests** in `tests/unit/`
3. **Update documentation** with new error categories
4. **Test thoroughly** before submitting PRs

---

## 🆘 Emergency Procedures

If critical errors are blocking development:

1. **Immediate fix**: `npm run error-check:fix`
2. **Manual review**: Check `error-detection-results.json`
3. **Bypass temporarily**: Use `--skip-tests` flag (not recommended)
4. **Get help**: Review this documentation or contact team

**Remember**: The goal is to catch errors early and maintain high code quality! 🎯