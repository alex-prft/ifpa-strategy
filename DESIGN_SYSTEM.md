# Opal Personalization Generator - Design System

## Overview

This project implements a comprehensive design system using shadcn/ui components with a light-themed, professional appearance optimized for B2B personalization and experimentation tools.

## Design Principles

1. **Light & Clean**: Optimized for professional B2B environments
2. **Data-Driven**: Clear visualization of complex analytics and metrics
3. **Accessible**: High contrast ratios and semantic structure
4. **Scalable**: Consistent component patterns across all views
5. **Responsive**: Mobile-first approach with desktop optimization

## Color System

### Light Theme (Primary)
- **Background**: Clean white (`hsl(0 0% 100%)`)
- **Foreground**: Deep charcoal (`hsl(222.2 84% 4.9%)`)
- **Primary**: Optimizely blue (`hsl(221.2 83.2% 53.3%)`)
- **Secondary**: Light slate (`hsl(210 40% 96%)`)
- **Muted**: Subtle gray (`hsl(210 40% 96%)`)
- **Border**: Light gray (`hsl(214.3 31.8% 91.4%)`)

### Chart Colors
- **Chart 1**: Orange (`hsl(12 76% 61%)`)
- **Chart 2**: Teal (`hsl(173 58% 39%)`)
- **Chart 3**: Navy (`hsl(197 37% 24%)`)
- **Chart 4**: Yellow (`hsl(43 74% 66%)`)
- **Chart 5**: Coral (`hsl(27 87% 67%)`)

## Typography

- **Primary Font**: System font stack for optimal performance
- **Scale**:
  - Display: 4xl (36px)
  - Headline: 2xl (24px)
  - Title: xl (20px)
  - Body: base (16px)
  - Caption: sm (14px)
  - Micro: xs (12px)

## Component Library

### Core Components

#### Button (`/src/components/ui/button.tsx`)
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon
- **Usage**: Primary actions, navigation, form submissions

#### Card (`/src/components/ui/card.tsx`)
- **Parts**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Usage**: Content containers, data displays, form sections

#### Tabs (`/src/components/ui/tabs.tsx`)
- **Parts**: Tabs, TabsList, TabsTrigger, TabsContent
- **Usage**: Multi-view interfaces, data organization

### Chart Components

#### ChartContainer (`/src/components/ui/chart.tsx`)
- **Features**: Responsive wrapper, consistent styling, tooltip integration
- **Usage**: All data visualizations

#### Chart Types
- **Bar Charts**: Maturity progression, comparative analysis
- **Radar Charts**: Capability assessments
- **Line Charts**: ROI projections, timeline data
- **Pie Charts**: Investment breakdowns
- **Area Charts**: Progress tracking

## Layout System

### Grid System
- **Container**: Max-width 7xl (1280px) with responsive padding
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Spacing Scale
- **Base unit**: 4px (0.25rem)
- **Scale**: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64

## Page Layouts

### Homepage Layout
1. **Header**: Branding, navigation, user actions
2. **Hero Section**: Value proposition, feature highlights
3. **Feature Grid**: 4-column responsive grid
4. **Maturity Overview**: 4-phase framework visualization
5. **Form Section**: Assessment input form
6. **Footer**: Links, credits, version info

### Results Layout
1. **Header**: Breadcrumb, actions
2. **Tab Navigation**: Strategy, Analytics, MCP
3. **Content Area**: Dynamic based on active tab
4. **Executive Summary**: Key metrics cards
5. **Detailed Views**: Matrix, phases, roadmap, resources

### Analytics Dashboard
1. **KPI Cards**: 4-column metric overview
2. **Chart Grid**: Responsive chart layout
3. **Tabbed Content**: Overview, capabilities, timeline, investment
4. **Interactive Elements**: Filters, drill-downs

## MCP Integration

### Server Configuration
- **Endpoint**: `/api/mcp`
- **Protocol**: Model Context Protocol v2024-11-05
- **Tools**: 6 specialized personalization tools
- **Resources**: Framework data, templates, benchmarks
- **Prompts**: Assessment workflows, recommendations

### Tool Registry
1. **PMG Assessment**: Complete maturity evaluation
2. **Audience Lookup**: User profile queries
3. **Content Recommendations**: AI-powered content suggestions
4. **Experiment Analytics**: Historical performance data
5. **Campaign Management**: CMP integration
6. **Notifications**: Email delivery system

## Performance Considerations

### Optimization Strategies
- **Code Splitting**: Lazy-loaded components
- **Bundle Size**: Tree-shaking unused code
- **Image Optimization**: WebP format, responsive sizing
- **Caching**: Static assets, API responses
- **CDN**: Vercel Edge Network

### Metrics Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## Accessibility

### WCAG Compliance
- **Level**: AA compliance target
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full support
- **Screen Readers**: Semantic HTML, ARIA labels
- **Focus Management**: Visible indicators

### Implementation
- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: Descriptive image labels
- **Form Labels**: Associated with inputs
- **Error Messages**: Clear, actionable feedback

## Browser Support

### Supported Browsers
- **Chrome**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Edge**: Last 2 versions

### Progressive Enhancement
- **Base Experience**: Core functionality without JS
- **Enhanced Experience**: Full interactivity
- **Fallbacks**: Graceful degradation

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── ModernHomepage.tsx
│   ├── ModernMaturityPlanDisplay.tsx
│   ├── MaturityAnalyticsDashboard.tsx
│   └── DetailedMaturityMatrix.tsx
├── lib/
│   ├── utils.ts         # Utility functions
│   └── mcp/             # MCP server implementation
└── app/
    ├── globals.css      # Design system tokens
    └── api/             # Backend services
```

## Usage Guidelines

### Component Usage
1. Always use design system components
2. Follow established patterns for consistency
3. Extend components through composition
4. Document new patterns in this file

### Code Standards
1. TypeScript for type safety
2. ESLint for code quality
3. Prettier for formatting
4. Conventional commits for history

### Testing Strategy
1. Unit tests for components
2. Integration tests for workflows
3. E2E tests for user journeys
4. Performance monitoring

## Future Enhancements

### Planned Features
1. **Dark Mode**: Complete dark theme implementation
2. **Animations**: Micro-interactions, transitions
3. **Internationalization**: Multi-language support
4. **Real-time Updates**: WebSocket integration
5. **Advanced Analytics**: Custom chart types

### Maintenance
1. **Dependency Updates**: Monthly security patches
2. **Performance Reviews**: Quarterly optimization
3. **Design Reviews**: Bi-annual UX improvements
4. **Accessibility Audits**: Annual compliance checks