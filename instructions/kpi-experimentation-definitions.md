# KPI & Experimentation Definitions

This instruction ensures all proposals and blueprints conform to KPI, MDE (Minimum Detectable Effect), guardrail standards, and experimentation best practices.

## Core KPIs and Definitions

### Primary KPIs

**Conversion Rate (CVR)**
- Definition: Percentage of visitors who complete a desired action
- Calculation: (Conversions / Unique Visitors) × 100
- Typical MDE: 10-20% relative improvement
- Sample Size: ~85,000 visitors per variant for 15% MDE
- Guardrails: Revenue per visitor, bounce rate

**Revenue Per Visitor (RPV)**
- Definition: Average revenue generated per unique visitor
- Calculation: Total Revenue / Unique Visitors
- Typical MDE: 5-15% relative improvement
- Sample Size: ~50,000 visitors per variant for 10% MDE
- Guardrails: Conversion rate, average order value

**Click-Through Rate (CTR)**
- Definition: Percentage of users who click on a specific element
- Calculation: (Clicks / Impressions) × 100
- Typical MDE: 15-25% relative improvement
- Sample Size: ~25,000 visitors per variant for 20% MDE
- Guardrails: Downstream conversion, engagement time

**Average Order Value (AOV)**
- Definition: Average monetary value of each order
- Calculation: Total Revenue / Number of Orders
- Typical MDE: 8-12% relative improvement
- Sample Size: ~35,000 visitors per variant for 10% MDE
- Guardrails: Conversion rate, return rate

### Secondary KPIs

**Engagement Metrics**
- Time on page (>10% improvement)
- Pages per session (>8% improvement)
- Scroll depth (>15% improvement)
- Video completion rate (>20% improvement)

**Retention Metrics**
- Return visitor rate (>5% improvement)
- Email signup rate (>25% improvement)
- Account creation rate (>15% improvement)

## Minimum Detectable Effects (MDE)

### Standard MDE Guidelines

**High-Impact Changes**: 5-10% MDE
- Complete page redesigns
- Major workflow changes
- New product introductions

**Medium-Impact Changes**: 10-20% MDE
- Layout modifications
- Content personalization
- Navigation improvements

**Low-Impact Changes**: 20-30% MDE
- Copy changes
- Color adjustments
- Minor UI tweaks

### Sample Size Requirements

Calculate required sample size using:
- Statistical power: 80%
- Statistical significance: 95%
- Two-tailed test
- Equal traffic allocation

**Formula Reference:**
```
n = 2 × (Z_α/2 + Z_β)² × p × (1-p) / (MDE × p)²
```

Where:
- Z_α/2 = 1.96 (for 95% confidence)
- Z_β = 0.84 (for 80% power)
- p = baseline conversion rate

## Guardrail Metrics

### Revenue Guardrails
- Revenue per visitor must not decrease by >3%
- Total revenue must not decrease by >2%
- Average order value must not decrease by >5%

### Experience Guardrails
- Page load time must not increase by >10%
- Bounce rate must not increase by >15%
- Error rate must not increase by >50%

### Engagement Guardrails
- Time on site must not decrease by >10%
- Pages per session must not decrease by >8%

## Experiment Design Standards

### Statistical Requirements
- Minimum experiment duration: 1 week
- Minimum sample size: Meet MDE requirements
- Traffic allocation: 50/50 for A/B tests
- Randomization: User-level (cookie-based)

### Quality Checks
- AA tests quarterly to validate randomization
- Sample ratio mismatch checks (p-value >0.001)
- Novelty effect monitoring (week 1 vs week 2+)

### Stopping Rules
- **Early stopping for positive results**: Not recommended
- **Early stopping for negative results**: If guardrails breached
- **Maximum duration**: 4 weeks unless seasonal considerations

## Implementation Requirements

### Web Experimentation
- Use Optimizely Web SDK
- Implement proper event tracking
- Ensure cross-device consistency
- Include fallback experiences

### Feature Experimentation
- Use Optimizely Feature Flags
- Implement gradual rollout capability
- Monitor feature performance
- Plan rollback procedures

### Measurement Standards
- Track primary KPI within 24 hours
- Include attribution windows: 1-day, 7-day, 30-day
- Monitor cohort effects
- Calculate incremental lift

## Risk Assessment

### High-Risk Experiments
- Revenue impact >$10K/week
- Changes to checkout flow
- Changes to pricing display
- Major navigation modifications

**Requirements for High-Risk:**
- Stakeholder approval required
- Reduced traffic allocation (10-25%)
- Daily monitoring
- Rapid rollback capability

### Medium-Risk Experiments
- Revenue impact $1K-$10K/week
- Content personalization
- Product recommendation changes
- Email campaign modifications

### Low-Risk Experiments
- Revenue impact <$1K/week
- Copy changes
- Visual design tweaks
- Non-conversion tracking

## Success Criteria

### Statistical Significance
- Confidence level: 95% minimum
- Two-tailed tests preferred
- Bonferroni correction for multiple comparisons

### Practical Significance
- Effect size must exceed MDE
- Business impact must justify implementation cost
- Results must be directionally consistent across segments

### Validation Requirements
- Results stable for minimum 1 week
- Consistent across primary segments
- No significant guardrail violations
- Post-experiment validation recommended

## Documentation Requirements

### Experiment Brief Must Include:
- Clear hypothesis statement
- Primary and secondary KPIs
- Sample size calculations
- Risk assessment and mitigation
- Implementation timeline
- Success/failure criteria

### Results Documentation Must Include:
- Statistical significance results
- Confidence intervals
- Segmentation analysis
- Business impact calculation
- Implementation recommendations
- Lessons learned