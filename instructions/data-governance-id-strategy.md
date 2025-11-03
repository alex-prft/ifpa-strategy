# Data Governance & ID Strategy

This instruction enforces ID priority order, PII protection, and attribute scope requirements across all agents and tools.

## Cross-System ID Policy (Non-negotiable)

### ID Priority Order
**MANDATORY HIERARCHY:**
1. **email_hash** (PRIMARY) - Hashed email identifier
2. **sf_contact_id** - Salesforce Contact ID
3. **opti_user_id** - Optimizely User ID
4. **zaius_id** - Legacy Zaius identifier

### Implementation Requirements

**All agent prompts MUST:**
- Reference this exact priority order
- Never deviate from the hierarchy
- Use the highest-priority available identifier
- Document which ID type was resolved

**All tool integrations MUST:**
- Implement ID resolution according to priority
- Maintain consistent joins across systems
- Log ID resolution decisions for audit
- Handle missing IDs gracefully

## PII Protection Standards

### Prohibited Data Handling

**NEVER ALLOWED:**
- Plaintext email addresses anywhere in the system
- Storage of unhashed email data
- Logging of actual email addresses
- Transmission of plaintext emails in API calls

**ALWAYS REQUIRED:**
- Email hashing using SHA-256
- Salt-based hashing when possible
- Truncated logging for audit trails
- Encrypted storage for sensitive identifiers

### Hashing Requirements

**Email Hash Standards:**
```
Algorithm: SHA-256
Format: Lowercase hexadecimal (64 characters)
Salt: Use consistent organization salt
Validation: Must match regex ^[a-fA-F0-9]{64}$
```

**Example (pseudocode):**
```
email_hash = sha256(lowercase(email) + organization_salt)
```

### Audit Logging
- Log first 8 characters of hash + "..." for identification
- Never log complete hash values
- Include timestamp and operation context
- Maintain 90-day retention for audit logs

## Attribute Allowlist

### Salesforce Fields (Exposed via ODP)

**Customer Classification:**
- customer_tier (Bronze, Silver, Gold, Platinum)
- lifecycle_stage (Lead, Prospect, Customer, Champion)
- customer_segment (SMB, Mid-Market, Enterprise)
- industry_vertical (predefined list)

**Engagement Metrics:**
- engagement_score (0-100 calculated score)
- last_activity_date (ISO 8601 format)
- communication_preference (Email, Phone, None)
- preferred_channel (Web, Mobile, Email)

**Geographic Data:**
- geographic_region (continent level only)
- country_code (ISO 3166-1 alpha-2)
- timezone (IANA timezone identifier)

**Product Interaction:**
- product_interest (array of product categories)
- feature_usage_level (None, Basic, Advanced, Power)
- last_purchase_category (product category only)

### Computed Attributes (ODP-Generated)

**Behavioral Scores:**
- propensity_to_purchase (0.0-1.0)
- churn_risk_score (0.0-1.0)
- engagement_trend (Increasing, Stable, Decreasing)

**Value Metrics:**
- total_ltv_bucket (<$100, $100-$500, $500-$1000, >$1000)
- purchase_frequency (Never, Rare, Occasional, Frequent)
- avg_order_value_bucket (<$50, $50-$200, $200-$500, >$500)

### PROHIBITED Attributes

**Never Include:**
- Full names or name components
- Specific addresses beyond region/country
- Phone numbers or contact details
- Specific purchase amounts or dates
- Individual transaction data
- Credit card or payment information
- Social security or government IDs

## Data Joins and Attribution

### Cross-System Consistency

**ODP ↔ Experimentation:**
- Use resolved ID for audience targeting
- Maintain user state across platforms
- Ensure Real-Time Audience sync
- Validate audience membership consistency

**ODP ↔ Salesforce:**
- Use sf_contact_id when available
- Fall back to email_hash for matching
- Never expose PII in ODP fields
- Maintain data freshness (daily sync)

**Attribution Windows:**
- 1-day: Immediate attribution
- 7-day: Short-term campaign impact
- 30-day: Long-term value assessment
- Use consistent windows across tools

## Privacy Compliance

### GDPR Compliance
- Right to deletion: Support ID removal from all systems
- Data portability: Export allowlisted attributes only
- Consent management: Respect opt-out preferences
- Purpose limitation: Use data only for personalization

### Data Minimization
- Collect only necessary attributes
- Regularly review attribute usage
- Remove unused or expired attributes
- Implement automatic data expiry

### User Rights Management
```json
{
  "right_to_access": "Export allowlisted attributes",
  "right_to_rectification": "Update incorrect attributes",
  "right_to_erasure": "Remove from all connected systems",
  "right_to_portability": "JSON export of user profile",
  "right_to_object": "Opt-out from personalization"
}
```

## Security Requirements

### API Authentication
- Bearer token authentication required
- Token rotation every 30 days
- Rate limiting: 1000 requests/hour per token
- IP allowlisting for production environments

### Data Transmission
- HTTPS required for all API calls
- TLS 1.2 minimum
- Certificate pinning recommended
- Request/response logging (sanitized)

### Access Controls
- Role-based access to different attribute sets
- Audit logging for all data access
- Regular access review (quarterly)
- Immediate revocation for departed personnel

## Error Handling

### ID Resolution Failures
```json
{
  "error": "ID_RESOLUTION_FAILED",
  "message": "No valid identifier found",
  "attempted_ids": ["email_hash", "sf_contact_id"],
  "resolution_order": ["email_hash", "sf_contact_id", "opti_user_id", "zaius_id"]
}
```

### PII Exposure Prevention
- Automatic scrubbing of error messages
- No PII in error logs
- Sanitized debug information only
- Immediate alert for PII exposure attempts

### Attribute Access Violations
```json
{
  "error": "ATTRIBUTE_NOT_ALLOWLISTED",
  "message": "Requested attribute not in allowlist",
  "requested_attribute": "phone_number",
  "available_attributes": ["customer_tier", "lifecycle_stage", ...]
}
```

## Monitoring and Compliance

### Data Quality Metrics
- ID resolution success rate >95%
- Cross-system consistency >99%
- Attribute completeness by field
- Data freshness latency <24 hours

### Compliance Monitoring
- Daily PII exposure scans
- Weekly attribute usage audits
- Monthly access pattern reviews
- Quarterly compliance assessments

### Alerting Thresholds
- ID resolution failure rate >5%
- Cross-system inconsistency >1%
- Unauthorized attribute access attempts
- PII exposure detection (immediate)

## Implementation Checklist

### For All Agents:
- [ ] Reference ID priority order in prompts
- [ ] Never request or process plaintext emails
- [ ] Only use allowlisted attributes
- [ ] Implement proper error handling
- [ ] Include audit logging

### For All Tools:
- [ ] Implement ID resolution logic
- [ ] Validate bearer token authentication
- [ ] Filter attributes to allowlist only
- [ ] Handle cross-system ID mapping
- [ ] Provide sanitized error responses

### For System Integration:
- [ ] Configure ODP-Salesforce sync
- [ ] Set up Real-Time Audience integration
- [ ] Implement consistent attribution windows
- [ ] Configure monitoring and alerting
- [ ] Document data flow architecture