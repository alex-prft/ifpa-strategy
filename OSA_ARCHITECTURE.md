# OSA (Optimizely Strategy Assistant) - Technical Architecture Documentation

## Main Services Overview

OSA consists of **seven core microservices** that work together to provide AI-powered optimization strategy recommendations:

### 🔴 Core Services (P0 - Mandatory)
- **Ingestion & Orchestration Service** (`Opal Connector`) - OPAL workflow orchestration, webhook handling, and data ingestion from Optimizely platform
- **Recommendation Service** (`Decision Layer`) - Central AI intelligence engine that synthesizes data to generate personalized strategic recommendations
- **Knowledge & Retrieval Service** (`RAG Brain`) - Foundation knowledge layer with vector storage, semantic search, and continuous learning from all interactions

### 🟡 Enhanced Services (P1 - High Priority)
- **Strategy Intake Service** (`Engine Form`) - Business context collection, form validation, and user requirement gathering for enhanced recommendations
- **Preferences & Policy Service** (`Personal Configurator`) - User preference management, policy enforcement, and configuration constraints
- **UX Design Service** (`Artist`) - Frontend experience layer, component library, data visualization, and responsive design systems

### 🟢 Future Services (P2 - Optional)
- **Conversational Analytics Service** (`TTYD - Talk To Your Data`) - Natural language querying interface for interactive data exploration

### 🌐 Platform Services (P0 - Infrastructure)
- **API Gateway** - Authentication, rate limiting, request routing, and circuit breakers
- **Event Bus** - Asynchronous message routing and event streaming between services
- **Monitoring Service** - Health checks, metrics collection, distributed tracing, and alerting

## Table of Contents
1. [System Overview](#system-overview)
2. [Ingestion & Orchestration Service](#ingestion--orchestration-service)
3. [Strategy Intake Service](#strategy-intake-service)
4. [Recommendation Service](#recommendation-service)
5. [Knowledge & Retrieval Service](#knowledge--retrieval-service)
6. [Preferences & Policy Service](#preferences--policy-service)
7. [UX Design Service (Artist)](#ux-design-service-artist)
8. [System Integration & Data Flow](#system-integration--data-flow)
9. [Technical Stack & Infrastructure](#technical-stack--infrastructure)
10. [Security & Performance](#security--performance)

---

## System Overview

OSA (Optimizely Strategy Assistant) is a comprehensive AI-powered platform that transforms Optimizely data into actionable strategic insights. The system is architected as **seven independent microservices** that communicate through event-driven patterns to provide personalized, data-driven recommendations for optimization strategy.

### Core Philosophy
- **Service-Oriented Architecture**: Independent services with clear boundaries and contracts
- **Event-Driven Communication**: Asynchronous messaging for loose coupling and scalability
- **Data-Driven Decision Making**: Every recommendation is backed by actual Optimizely data
- **Personalization at Scale**: User preferences and business context shape all outputs
- **Continuous Learning**: The Knowledge & Retrieval Service learns from every interaction
- **Resilient Architecture**: Circuit breakers and fallback mechanisms ensure functionality

### Service Naming Convention

| Official Service Name | Internal Alias | Priority | Purpose |
|----------------------|----------------|----------|---------|
| **Ingestion & Orchestration Service** | **Opal Connector** | 🔴 P0 + 🟡 P1 | OPAL workflows & agents |
| **Strategy Intake Service** | **Engine Form** | 🟡 P1 | Form processing & validation |
| **Recommendation Service** | **Decision Layer** | 🔴 P0 | Decision layer & ML scoring |
| **Knowledge & Retrieval Service** | **RAG Brain** | 🔴 P0 | RAG Brain Phase 1 |
| **Preferences & Policy Service** | **Personal Configurator** | 🟡 P1 | User prefs & compliance |
| **UX Design Service** | **Artist** | 🟡 P1 | Frontend experience layer |
| **Conversational Analytics Service** | **TTYD** | 🟢 P2 | Natural language querying |

### Microservices Architecture

#### 🔴 MANDATORY (P0) - Core Services
Essential services for basic OSA operation that cannot be disabled:
- **Knowledge & Retrieval Service** *(Internal: RAG Brain)* - Foundation knowledge layer with semantic search
- **Recommendation Service** *(Internal: Decision Layer)* - Core intelligence engine for generating recommendations
- **Ingestion & Orchestration Service** *(Internal: Opal Connector)* (minimum viable) - Basic OPAL data ingestion

#### 🟡 HIGH PRIORITY (P1) - Enhanced Services
Services that significantly improve user experience with defined fallback mechanisms:
- **Strategy Intake Service** *(Internal: Engine Form)* - Business context collection and validation
- **Preferences & Policy Service** *(Internal: Personal Configurator)* - User customization and governance rules
- **UX Design Service** *(Internal: Artist)* - Frontend experience layer and visualization engine
- **Ingestion & Orchestration Service** *(Internal: Opal Connector)* (full featured) - Complete OPAL workflow management

#### 🟢 OPTIONAL (P2) - Future Services
Services that provide advanced capabilities but are not required for core functionality:
- **Conversational Analytics Service** *(Internal: TTYD - Talk To Your Data)* - Natural language querying interface
- **Advanced Analytics Service** - Predictive insights and forecasting

#### 🌐 PLATFORM (P0) - Infrastructure Services
Cross-cutting platform services that all business services depend on:
- **API Gateway** - Authentication, rate limiting, request routing, circuit breakers
- **Event Bus** - Asynchronous message routing and event streaming
- **Monitoring Service** - Health checks, metrics, tracing, and alerting

### Service Communication Patterns

#### Event-Driven Architecture
All services communicate through events published to a central event bus:

1. **Command Events**: Trigger actions (`orchestration.workflow.trigger`)
2. **State Events**: Notify of changes (`intake.submitted`, `agent.completed`)
3. **Query Events**: Request data (`knowledge.retrieve.request`)
4. **Health Events**: System status (`service.health.degraded`)

#### Service Contracts
Each service exposes:
- **REST API**: Synchronous operations with OpenAPI contracts
- **Event Schemas**: Asynchronous communication with versioned Avro schemas
- **Health Endpoints**: Status and readiness checks
- **Metrics Endpoints**: Prometheus-compatible metrics

### Service Independence & Resilience

#### Deployment Independence
Each service can be deployed independently:
- **Vercel Serverless Functions**: Auto-scaling per service
- **Independent Databases**: No shared data stores between services
- **API Versioning**: Backward compatibility with consumer-driven contracts
- **Feature Flags**: Runtime toggles for new functionality

#### Resilience Patterns
1. **Circuit Breakers**: Automatic failure detection and recovery
2. **Retry with Backoff**: Exponential backoff with jitter for transient failures
3. **Bulkhead Pattern**: Isolation of critical vs non-critical operations
4. **Timeout Handling**: Configured timeouts with graceful degradation
5. **Health Checks**: Continuous monitoring with automatic traffic routing

---

## Ingestion & Orchestration Service

**Service Name**: `ingestion-orchestration-service` (Internal Alias: **Opal Connector**)
**Priority Level**: 🔴 P0 (Core) + 🟡 P1 (Enhanced)
**Deployment**: Vercel Serverless Functions
**Database**: `orchestration_db` (Supabase instance)
**API Contract**: `/api/v1/orchestration/*`
**Failback Strategy**: Manual Force Sync operations when OPAL webhook fails

### Service Purpose
The Ingestion & Orchestration Service handles OPAL webhooks, agent orchestration, retries, partial results, and status events. It serves as the primary data ingestion pipeline, responsible for retrieving, processing, and storing Optimizely data within the OSA ecosystem.

### Service Boundaries
**Owns**:
- OPAL workflow orchestration and agent coordination
- Webhook event validation and authentication
- Agent execution status and progress tracking
- Workflow retry logic and error recovery
- Real-time status streaming via Server-Sent Events

**Depends On**:
- OPAL external APIs for agent execution
- Event Bus for publishing workflow events
- Knowledge & Retrieval Service for storing agent results

**Provides To**:
- Recommendation Service (agent results and insights)
- Strategy Dashboard (real-time workflow status)
- All services (workflow completion events)

### System Modes

#### Full Operation Mode (P1)
- Real-time webhook integration with OPAL
- Automatic data synchronization
- Live status monitoring via SSE
- Complete agent orchestration

#### Degraded Mode (P0)
- Manual Force Sync capability
- Cached data utilization
- Basic webhook event logging
- Essential data ingestion only

#### Emergency Failbacks
- **Webhook Failure**: Force Sync button triggers manual workflow
- **OPAL Unavailable**: Use previously cached execution data
- **Network Issues**: Local data processing with cached insights
- **Agent Failure**: Partial results from available agents

### Technical Components

#### 1. Webhook Infrastructure
**File**: `/src/app/api/webhooks/opal-workflow/route.ts`

```typescript
// Core webhook handler that receives OPAL workflow events
export async function POST(request: NextRequest) {
  // Authentication & validation
  // Event processing & storage
  // Real-time status updates via SSE
}
```

**Key Processes**:
- **Authentication**: HMAC-SHA256 signature validation and Bearer token verification
- **Event Processing**: Handles 5 core workflow events (agent_started, agent_completed, workflow_completed, workflow_failed, data_received)
- **Data Storage**: Persists all webhook events to `opal_webhook_events` table for audit and monitoring
- **Real-time Updates**: Broadcasts status changes via Server-Sent Events for live UI updates

#### 2. OPAL Agent Orchestration
**Agents**: 5 specialized AI agents that process different aspects of Optimizely data

1. **Content Review Agent** (`content_review`)
   - Analyzes experiment content and variations
   - Identifies content performance patterns
   - Provides content optimization recommendations

2. **Geographic Audit Agent** (`geo_audit`)
   - Evaluates geographic performance distribution
   - Identifies regional optimization opportunities
   - Recommends geo-targeting strategies

3. **Audience Suggester Agent** (`audience_suggester`)
   - Analyzes audience segment performance
   - Identifies high-value audience opportunities
   - Recommends audience targeting strategies

4. **Experiment Blueprinter Agent** (`experiment_blueprinter`)
   - Creates detailed experiment plans
   - Recommends test strategies and methodologies
   - Provides statistical guidance and sample size calculations

5. **Personalization Idea Generator** (`personalization_idea_generator`)
   - Generates personalization strategies
   - Identifies personalization opportunities
   - Recommends implementation approaches

#### 3. Force Sync Mechanism
**File**: `/src/app/api/sync-status/route.ts`

```typescript
// Manual trigger for OPAL workflow when webhook fails
const workflowTriggerData = {
  workflow_name: 'strategy_assistant_workflow',
  input_data: execution,
  trigger_source: 'force_sync',
  metadata: { session_id, execution_id, user_id: 'alex', force_sync: true }
};
```

**Process Flow**:
1. User clicks Force Sync button
2. System retrieves latest execution data
3. Triggers OPAL workflow with comprehensive payload
4. Tracks workflow progress via webhook events
5. Updates UI with real-time status

#### 4. Data Persistence Layer
**Database Tables**:
- `opal_workflow_executions`: Stores workflow execution metadata
- `opal_agent_executions`: Tracks individual agent runs
- `opal_webhook_events`: Comprehensive webhook event audit log
- `opal_odp_insights`: ODP-specific insights and recommendations
- `opal_content_insights`: Content analysis and optimization data

### Guidelines & Best Practices

#### Data Integrity
- All webhook events are stored with full payload for audit purposes
- Failed events are logged with detailed error information
- Processing times are tracked for performance monitoring

#### Resilience Patterns
- Circuit breaker pattern for external API calls
- Graceful degradation when OPAL services are unavailable
- Fallback to cached data when real-time data is inaccessible

#### Monitoring & Alerting
- Real-time webhook status monitoring via SSE
- Comprehensive logging for all data ingestion processes
- Performance metrics tracking for optimization

---

## Strategy Intake Service

**Service Name**: `strategy-intake-service` (Internal Alias: **Engine Form**)
**Priority Level**: 🟡 P1 (Enhanced Experience)
**Deployment**: Vercel Serverless Functions
**Database**: `intake_db` (Supabase instance)
**API Contract**: `/api/v1/intake/*`
**Failback Strategy**: Default business context and basic recommendations

### Service Purpose
The Strategy Intake Service captures business/technical context, validates inputs, versions submissions, and emits intake.submitted events. It collects additional business context and user preferences to enhance the AI decision-making process beyond raw Optimizely data.

### Service Boundaries
**Owns**:
- Business context collection and validation
- Dynamic form generation based on available data
- Input validation and business logic enforcement
- Context enrichment and data normalization
- Intake submission versioning and audit trail

**Depends On**:
- Event Bus for publishing intake events
- Preferences & Policy Service for validation rules
- Knowledge & Retrieval Service for contextual defaults

**Provides To**:
- Recommendation Service (enriched business context)
- All services (intake.submitted@1 events)
- Strategy Dashboard (form validation and user guidance)

**Critical Change**: 🚨 **NO AUTOMATIC WEBHOOK TRIGGERS** - Form submission only stores intake data and publishes events. All OPAL workflows must be manually triggered via Force Sync only.

### System Modes

#### Full Operation Mode (P1)
- Dynamic form generation based on available data
- Real-time validation and business logic enforcement
- Contextual help and intelligent defaults
- Progressive disclosure of complexity

#### Degraded Mode (P0 Fallback)
- Static form with essential fields only
- Basic validation without external dependencies
- Standard industry defaults applied automatically
- Simplified user interface

#### Emergency Failbacks
- **Form Unavailable**: Use industry-standard business context defaults
- **Validation Failure**: Accept basic inputs without advanced validation
- **External APIs Down**: Skip enrichment, use raw user inputs only
- **Complex Logic Failure**: Revert to simple form processing

### Technical Components

#### 1. Dynamic Form Generation
**File**: `/src/components/StrategyDashboard.tsx`

The Engine Form dynamically adapts based on:
- Available Optimizely data
- User's previous inputs
- Business context requirements
- Industry-specific considerations

#### 2. Data Collection Categories

**Business Context**:
- Industry vertical and market positioning
- Business objectives and KPIs
- Competitive landscape
- Seasonal considerations
- Brand guidelines and constraints

**Technical Context**:
- Implementation capabilities
- Development resources
- Technical constraints
- Platform integrations
- Performance requirements

**Strategic Context**:
- Risk tolerance levels
- Budget considerations
- Timeline constraints
- Success metrics definition
- Stakeholder requirements

#### 3. Form State Management

```typescript
// Centralized state management for form data
interface EngineFormState {
  businessContext: BusinessContext;
  technicalRequirements: TechnicalRequirements;
  strategicPreferences: StrategicPreferences;
  completionStatus: FormCompletionStatus;
}
```

### Data Processing Pipeline

#### 1. Input Validation
- Real-time field validation
- Business logic constraints
- Data type enforcement
- Required field checking

#### 2. Context Enhancement
- Enriches form data with external context
- Validates against Optimizely data patterns
- Identifies potential conflicts or inconsistencies

#### 3. Decision Layer Integration
- Transforms form data into decision parameters
- Maps business requirements to technical recommendations
- Provides weighted inputs for AI decision-making

### Guidelines & Best Practices

#### User Experience
- Progressive disclosure of complexity
- Smart defaults based on industry patterns
- Contextual help and guidance
- Save-as-you-go functionality

#### Data Quality
- Comprehensive validation rules
- Business logic enforcement
- Consistency checking across related fields
- Historical data comparison for anomaly detection

---

## Recommendation Service

**Service Name**: `recommendation-service` (Internal Alias: **Decision Layer**)
**Priority Level**: 🔴 P0 (Mandatory - Core Intelligence)
**Deployment**: Vercel Serverless Functions
**Database**: `recommendations_db` (Supabase instance)
**API Contract**: `/api/v1/recommendations/*`
**Failback Strategy**: Basic recommendation engine with cached insights

### Service Purpose
The Recommendation Service provides deterministic API and event outputs with confidence & evidence. It serves as the central intelligence hub that synthesizes data from all OSA services to generate personalized, actionable strategic recommendations.

### Service Boundaries
**Owns**:
- Multi-source data integration and synthesis
- AI-powered recommendation generation with confidence scoring
- Recommendation caching and performance optimization
- Evidence linking and source attribution
- Recommendation quality metrics and feedback processing

**Depends On**:
- Knowledge & Retrieval Service (knowledge retrieval and context)
- Strategy Intake Service (business context and requirements)
- Preferences & Policy Service (user constraints and guidelines)
- Ingestion & Orchestration Service (OPAL agent results)

**Provides To**:
- Strategy Dashboard (recommendations display and interaction)
- Conversational Analytics Service (recommendation context for queries)
- All services (decision.recommendations.generated@1 events)

### API Contract
```typescript
POST /api/v1/recommendations/generate
{
  "intake_id": "string",
  "workflow_id": "string",
  "context": "object",
  "preferences": "object"
}

Response: {
  "recommendations": [
    {
      "id": "string",
      "type": "strategic|tactical|technical",
      "title": "string",
      "description": "string",
      "confidence_score": "number (0-1)",
      "evidence_links": ["string"],
      "implementation_effort": "low|medium|high",
      "expected_impact": "object"
    }
  ],
  "metadata": {
    "generation_time_ms": "number",
    "sources": ["string"],
    "fallback_mode": "boolean"
  }
}
```

### System Modes

#### Full Operation Mode (P0)
- Multi-source data integration from all OSA systems
- AI-powered recommendation generation with confidence scoring
- Real-time personalization based on user preferences
- Advanced pattern recognition and trend analysis

#### Degraded Mode (P0 Minimum)
- Basic recommendation engine using available data only
- Fallback to cached insights when live data unavailable
- Simple recommendation algorithms without AI enhancement
- Static recommendation templates for common scenarios

#### Emergency Failbacks
- **AI Engine Failure**: Use rule-based recommendation templates
- **Data Integration Failure**: Generate recommendations from single best source
- **Personalization Failure**: Provide generic industry-standard recommendations
- **Complete System Failure**: Display cached recommendations with clear timestamps

### Technical Components

#### 1. Multi-Source Data Integration

**Data Sources**:
- OPAL Agent insights and analysis
- Engine Form business context
- Personal Configurator preferences
- TTYD query patterns and results
- RAG Brain historical learning
- Real-time Optimizely performance data

#### 2. AI Decision Engine

**Core Algorithm**:
```typescript
interface DecisionParameters {
  opalInsights: OpalAgentResults[];
  businessContext: EngineFormData;
  userPreferences: PersonalConfig;
  historicalPerformance: HistoricalData;
  realTimeMetrics: LiveMetrics;
  ragContext: LearningContext;
}

class DecisionEngine {
  async generateRecommendations(params: DecisionParameters): Promise<Recommendations> {
    // 1. Context analysis and data synthesis
    // 2. Pattern recognition and trend analysis
    // 3. Risk assessment and opportunity identification
    // 4. Personalization based on user preferences
    // 5. Recommendation generation and prioritization
    // 6. Confidence scoring and validation
  }
}
```

#### 3. Recommendation Categories

**Strategic Recommendations**:
- Experiment prioritization and roadmap
- Audience targeting strategies
- Content optimization approaches
- Personalization opportunities
- Geographic expansion strategies

**Technical Recommendations**:
- Implementation best practices
- Platform configuration optimizations
- Integration recommendations
- Performance improvement strategies
- Measurement and analytics setup

**Tactical Recommendations**:
- Immediate action items
- Quick wins and low-hanging fruit
- Resource allocation suggestions
- Timeline and milestone planning
- Success metrics definition

#### 4. Confidence Scoring System

```typescript
interface RecommendationConfidence {
  dataQuality: number;        // 0-100: Quality of underlying data
  historicalAccuracy: number; // 0-100: Past recommendation success rate
  contextRelevance: number;   // 0-100: Relevance to current situation
  implementationFeasibility: number; // 0-100: Ease of implementation
  overallConfidence: number;  // Weighted composite score
}
```

### Processing Architecture

#### 1. Real-Time Processing Pipeline
- Continuous data ingestion from all subsystems
- Real-time pattern recognition and anomaly detection
- Dynamic recommendation adjustment based on new data
- Live performance monitoring and feedback incorporation

#### 2. Batch Processing Pipeline
- Deep analysis of historical patterns
- Complex correlation analysis across multiple data dimensions
- Long-term trend identification and forecasting
- Comprehensive strategy optimization

### Guidelines & Best Practices

#### Decision Quality
- Multi-source validation of all recommendations
- Confidence scoring for transparency
- Fallback strategies for low-confidence scenarios
- Continuous validation against actual outcomes

#### Performance Optimization
- Efficient data processing algorithms
- Caching strategies for frequently accessed patterns
- Incremental processing for large datasets
- Load balancing for high-volume scenarios

---

## Conversational Analytics Service

**Service Name**: `conversational-analytics-service` (Internal Alias: **TTYD - Talk To Your Data**)
**Priority Level**: 🟢 P2 (Optional - Future Feature)
**Deployment**: Vercel Serverless Functions
**Database**: `analytics_db` (Supabase instance)
**API Contract**: `/api/v1/analytics/*`
**Failback Strategy**: Standard dashboard interface and predefined reports

### Service Purpose
The Conversational Analytics Service focuses on natural language queries + visualization, consuming the same Recommendation & Knowledge APIs. It provides natural language querying capabilities that allow users to interactively explore their Optimizely data through conversational AI, enabling ad-hoc analysis and insight discovery.

### Service Boundaries
**Owns**:
- Natural language query processing and understanding
- Conversational context and memory management
- Query-to-visualization mapping and chart generation
- Interactive conversation flows and follow-up suggestions
- Query history and user preference learning

**Depends On**:
- Knowledge & Retrieval Service (data retrieval and context search)
- Recommendation Service (action recommendations based on queries)
- Preferences & Policy Service (user display preferences)
- Event Bus for query event publishing

**Provides To**:
- Strategy Dashboard (embedded conversational interface)
- All services (analytics.query.executed@1 events)
- Knowledge & Retrieval Service (query patterns for learning)

### API Contract
```typescript
POST /api/v1/analytics/query
{
  "query": "string",
  "session_id": "string",
  "context": "object",
  "response_format": "text|chart|table|mixed"
}

Response: {
  "response_type": "text|visualization|recommendation",
  "content": {
    "text": "string",
    "charts": ["object"],
    "data_tables": ["object"],
    "recommendations": ["string"]
  },
  "follow_up_suggestions": ["string"],
  "confidence_score": "number (0-1)",
  "sources": ["string"]
}
```

### System Modes

#### Full Operation Mode (P2)
- Natural language query processing with advanced NLP
- Interactive conversational AI with context memory
- Multi-modal responses (text, charts, tables)
- Real-time data exploration and visualization

#### Degraded Mode (P1 Fallback)
- Predefined query templates with natural language interface
- Basic question-answer functionality without conversation memory
- Static chart generation from common queries
- Simple data filtering and sorting capabilities

#### Emergency Failbacks
- **NLP Engine Failure**: Revert to traditional dashboard with filters
- **AI Model Unavailable**: Use predefined report templates
- **Data Query Failure**: Display cached query results with timestamps
- **Complete TTYD Failure**: Full fallback to standard StrategyDashboard interface

### Implementation Status
- **Current**: Not yet implemented (P2 future feature)
- **Planned**: Advanced conversational AI for data exploration
- **Fallback**: Enhanced dashboard filtering and search capabilities

### Technical Components

#### 1. Natural Language Processing Pipeline

**Query Understanding**:
```typescript
interface TTYDQuery {
  userInput: string;
  intent: QueryIntent;
  entities: ExtractedEntities;
  context: ConversationContext;
  dataRequirements: DataRequirement[];
}

class QueryProcessor {
  async parseQuery(input: string): Promise<TTYDQuery> {
    // 1. Intent classification (comparison, trend, segmentation, etc.)
    // 2. Entity extraction (metrics, dimensions, time periods)
    // 3. Context understanding (previous queries, current session)
    // 4. Data requirement mapping
  }
}
```

#### 2. Data Query Engine

**Dynamic Query Generation**:
- Translates natural language to structured data queries
- Optimizes query performance for large datasets
- Handles complex multi-dimensional analysis
- Provides real-time results with streaming responses

**Query Types Supported**:
- **Trend Analysis**: "Show me conversion rate trends over the last quarter"
- **Comparative Analysis**: "Compare experiment performance by geographic region"
- **Segmentation**: "Break down revenue by audience segment and traffic source"
- **Anomaly Detection**: "Identify unusual patterns in last week's data"
- **Forecasting**: "Predict next month's performance based on current trends"

#### 3. Response Generation

**Multi-Modal Responses**:
- Text explanations with key insights
- Interactive visualizations and charts
- Data tables with drill-down capabilities
- Action recommendations based on findings
- Follow-up question suggestions

#### 4. Conversation Memory

```typescript
interface ConversationContext {
  sessionId: string;
  queryHistory: TTYDQuery[];
  dataContext: DataSnapshot;
  userPreferences: DisplayPreferences;
  followUpSuggestions: string[];
}
```

### Integration Architecture

#### 1. Data Source Integration
- Direct connection to Optimizely APIs
- Integration with OPAL processed insights
- Access to historical OSA analysis results
- Real-time metric streaming capabilities

#### 2. AI Model Integration
- Large Language Model for natural language understanding
- Specialized models for data analysis and pattern recognition
- Custom fine-tuning on Optimizely domain knowledge
- Continuous learning from user interactions

### Guidelines & Best Practices

#### Query Performance
- Intelligent query optimization and caching
- Progressive data loading for large result sets
- Real-time streaming for long-running queries
- Automatic query simplification for complex requests

#### User Experience
- Contextual query suggestions
- Interactive result exploration
- Natural conversation flow
- Clear data source attribution

---

## Preferences & Policy Service

**Service Name**: `preferences-policy-service` (Internal Alias: **Personal Configurator**)
**Priority Level**: 🟡 P1 (Enhanced Experience)
**Deployment**: Vercel Serverless Functions
**Database**: `preferences_db` (Supabase instance)
**API Contract**: `/api/v1/preferences/*`
**Failback Strategy**: System-wide default configurations with industry best practices

### Service Purpose
The Preferences & Policy Service distinguishes subjective preferences from objective guardrails, both enforced at runtime. It centralizes budget limits, risk tolerances, PII handling, and model safety constraints as enforceable policy that other services query at runtime.

### Service Boundaries
**Owns**:
- User preference management and versioning
- Policy and guardrail definition and enforcement
- Business rule engine and constraint validation
- Risk tolerance and compliance rule management
- Default configuration templates and industry benchmarks

**Depends On**:
- Event Bus for preference change events
- Knowledge & Retrieval Service for learning user behavior patterns
- Strategy Dashboard for preference interface

**Provides To**:
- Recommendation Service (preference constraints and guidelines)
- Strategy Intake Service (validation rules and defaults)
- All services (preferences.updated@1 events)
- Conversational Analytics Service (user display preferences)

### API Contract
```typescript
GET /api/v1/preferences/user/{user_id}
Response: {
  "strategic_preferences": {
    "risk_tolerance": "low|medium|high",
    "optimization_goals": ["string"],
    "priority_metrics": ["string"],
    "time_horizon": "short|medium|long"
  },
  "policy_constraints": {
    "budget_limits": "object",
    "compliance_rules": ["string"],
    "pii_handling": "object",
    "model_safety": "object"
  }
}

POST /api/v1/preferences/validate
{
  "preferences": "object",
  "context": "object"
}
Response: {
  "valid": "boolean",
  "violations": ["string"],
  "suggestions": ["string"]
}
```

### System Modes

#### Full Operation Mode (P1)
- Dynamic configuration interface with real-time validation
- Advanced preference learning from user behavior patterns
- Industry benchmark comparison and intelligent recommendations
- Custom constraint validation and business rule enforcement

#### Degraded Mode (P0 Fallback)
- Basic preference settings with static options
- Standard industry default configurations applied automatically
- Simple constraint checking without advanced validation
- Predefined configuration templates for common scenarios

#### Emergency Failbacks
- **Configuration System Failure**: Use hard-coded industry standard defaults
- **Preference Learning Failure**: Revert to manual configuration only
- **Validation System Down**: Accept configurations without advanced checking
- **Complete Configurator Failure**: Apply global default settings to all recommendations

### Configuration Priority Hierarchy
1. **User-Defined Preferences** (when Personal Configurator available)
2. **Learned Behavior Patterns** (from RAG Brain when available)
3. **Industry Defaults** (fallback when user preferences unavailable)
4. **System Defaults** (emergency fallback for all systems)

### Technical Components

#### 1. Preference Management System

**Configuration Categories**:
```typescript
interface PersonalConfiguration {
  strategicPreferences: {
    riskTolerance: RiskLevel;
    optimizationGoals: OptimizationGoal[];
    priorityMetrics: MetricPriority[];
    timeHorizon: TimeHorizon;
  };

  technicalConstraints: {
    implementationCapability: CapabilityLevel;
    resourceAvailability: ResourceLevel;
    platformLimitations: PlatformConstraint[];
    integrationRequirements: IntegrationSpec[];
  };

  businessContext: {
    industryVertical: Industry;
    companySize: CompanySize;
    marketPosition: MarketPosition;
    competitiveContext: CompetitiveAnalysis;
  };

  communicationPreferences: {
    reportingFrequency: ReportingFrequency;
    detailLevel: DetailLevel;
    preferredVisualizationTypes: VisualizationType[];
    notificationSettings: NotificationConfig;
  };
}
```

#### 2. Dynamic Configuration Engine

**Adaptive Preferences**:
- Learning from user behavior and feedback
- Automatic adjustment based on success patterns
- Industry benchmark comparison and recommendations
- Seasonal and contextual preference modifications

#### 3. Constraint Validation System

**Business Rule Engine**:
```typescript
class ConfigurationValidator {
  validateConfiguration(config: PersonalConfiguration): ValidationResult {
    // 1. Internal consistency checking
    // 2. Business logic validation
    // 3. Technical feasibility assessment
    // 4. Performance impact analysis
    // 5. Recommendation adjustment requirements
  }
}
```

### Configuration Impact Analysis

#### 1. Decision Layer Integration
- Weights and biases applied to recommendation algorithms
- Filtering of recommendations based on constraints
- Prioritization adjustments based on preferences
- Custom scoring models for recommendation ranking

#### 2. Real-Time Adaptation
- Dynamic adjustment of AI model parameters
- Personalized data visualization preferences
- Custom alert thresholds and notification triggers
- Adaptive user interface modifications

### Guidelines & Best Practices

#### Configuration Management
- Version control for configuration changes
- A/B testing for configuration optimizations
- Backup and rollback capabilities
- Impact analysis before configuration changes

#### User Guidance
- Smart defaults based on industry patterns
- Progressive configuration with growing sophistication
- Impact visualization for configuration changes
- Best practice recommendations and benchmarking

---

## Knowledge & Retrieval Service

**Service Name**: `knowledge-retrieval-service` (Internal Alias: **RAG Brain**)
**Priority Level**: 🔴 P0 (Mandatory - Foundation Layer)
**Deployment**: Vercel Serverless Functions
**Database**: `knowledge_db` (Supabase with pgvector extension)
**API Contract**: `/api/v1/knowledge/*`
**Failback Strategy**: Static knowledge base with cached insights

### Service Purpose
The Knowledge & Retrieval Service emphasizes vector/graph storage, retrieval, and governance. It serves as the foundational learning and knowledge layer that continuously absorbs information from all OSA services to build increasingly sophisticated understanding of optimization strategies and business patterns.

### Service Boundaries
**Owns**:
- Knowledge ingestion pipeline and data processing
- Vector embeddings generation and similarity search
- Knowledge graph construction and relationship mapping
- Semantic search and contextual retrieval
- Learning analytics and knowledge quality metrics

**Depends On**:
- Event Bus for knowledge update events from all services
- OpenAI API for embedding generation (Phase 2+)
- Supabase pgvector for vector similarity search

**Provides To**:
- Recommendation Service (contextual knowledge and patterns)
- Conversational Analytics Service (semantic search results)
- Strategy Intake Service (contextual defaults and suggestions)
- All services (knowledge.updated@1 events)

### API Contract
```typescript
POST /api/v1/knowledge/retrieve
{
  "query": "string",
  "context": "object",
  "limit": "number",
  "threshold": "number"
}
Response: {
  "results": [
    {
      "content": "string",
      "relevance_score": "number (0-1)",
      "source": "string",
      "metadata": "object",
      "embeddings": "number[]"
    }
  ]
}

POST /api/v1/knowledge/upsert
{
  "content": "string",
  "source": "string",
  "metadata": "object",
  "tags": ["string"]
}
```

### Phased Implementation

#### Phase 1 (Today) - Simple Knowledge Base
- **Supabase full-text search** using tsvector and tsquery
- **Basic pattern matching** for insights and recommendations
- **Manual knowledge curation** from OPAL agent results
- **Static recommendation templates** with rule-based matching

#### Phase 2 (Future Sprint) - Vector Search
- **pgvector extension** for Supabase semantic search
- **OpenAI embeddings** for content vectorization
- **Similarity search** for contextual knowledge retrieval
- **Basic learning** from user feedback and success patterns

#### Phase 3 (Future Month) - Advanced Learning
- **Learning pipeline** with outcome correlation analysis
- **Cross-customer insights** (privacy-preserved aggregation)
- **Predictive analytics** for recommendation confidence scoring
- **Automated knowledge graph** evolution and relationship discovery

### System Modes

#### Full Operation Mode (P0)
- Real-time knowledge ingestion from all OSA subsystems
- Advanced pattern recognition and relationship mapping
- Continuous learning with outcome-based feedback loops
- Dynamic knowledge graph evolution and optimization

#### Degraded Mode (P0 Minimum)
- Static knowledge base with pre-trained patterns
- Basic pattern matching without dynamic learning
- Cached knowledge retrieval without real-time updates
- Simplified recommendation logic using stored patterns

#### Emergency Failbacks
- **Learning System Failure**: Use static knowledge base only
- **Vector Database Unavailable**: Revert to simple rule-based matching
- **Knowledge Ingestion Failure**: Continue with existing knowledge, no new learning
- **Complete RAG Failure**: Use hardcoded recommendation templates

### Critical Dependencies
The RAG Brain is foundational to all other systems:
- **Decision Layer**: Requires RAG Brain for intelligent recommendations
- **Personal Configurator**: Uses RAG Brain for preference learning
- **TTYD**: Relies on RAG Brain for contextual understanding
- **Opal Connector**: Feeds data to RAG Brain for continuous learning
- **Engine Form**: Enhanced by RAG Brain's business context understanding

### Resilience Strategy
Since RAG Brain is P0 critical, it has multiple resilience layers:
1. **Primary**: Full vector database with real-time learning
2. **Secondary**: Cached knowledge with periodic updates
3. **Tertiary**: Static knowledge base with predefined patterns
4. **Emergency**: Hardcoded recommendation logic

### Technical Components

#### 1. Knowledge Ingestion Pipeline

**Multi-Source Learning**:
```typescript
interface KnowledgeSource {
  opalInsights: OpalAgentResult[];
  userInteractions: UserBehaviorPattern[];
  engineFormInputs: BusinessContextPattern[];
  ttydQueries: QueryPattern[];
  configurationChanges: PreferenceEvolution[];
  outcomeData: SuccessMetric[];
}

class KnowledgeIngestion {
  async processKnowledgeSource(source: KnowledgeSource): Promise<void> {
    // 1. Data extraction and normalization
    // 2. Pattern recognition and feature extraction
    // 3. Relationship mapping and graph construction
    // 4. Knowledge vector generation and embedding
    // 5. Integration with existing knowledge base
  }
}
```

#### 2. Vector Database Architecture

**Knowledge Representation**:
- High-dimensional embeddings for all knowledge entities
- Graph-based relationship modeling
- Temporal knowledge evolution tracking
- Multi-modal knowledge representation (text, metrics, patterns)

**Storage & Retrieval**:
```typescript
interface KnowledgeVector {
  id: string;
  embedding: Float32Array;
  metadata: {
    source: KnowledgeSource;
    timestamp: Date;
    relevanceScore: number;
    businessContext: BusinessContext;
    successMetrics: PerformanceIndicator[];
  };
  relationships: KnowledgeRelationship[];
}
```

#### 3. Contextual Retrieval Engine

**Smart Knowledge Retrieval**:
- Context-aware similarity search
- Multi-hop reasoning across knowledge graphs
- Temporal relevance weighting
- Business context filtering
- Success pattern prioritization

#### 4. Continuous Learning Framework

**Learning Mechanisms**:
- **Outcome-Based Learning**: Learns from recommendation success/failure rates
- **Pattern Recognition**: Identifies emerging patterns across multiple data sources
- **Contextual Adaptation**: Adjusts knowledge relevance based on business context changes
- **Cross-Customer Learning**: Aggregates insights across multiple OSA instances (privacy-preserved)

### Knowledge Categories

#### 1. Strategic Knowledge
- Optimization strategy effectiveness patterns
- Industry-specific best practices
- Seasonal and temporal optimization patterns
- Competitive strategy insights
- Market trend correlations

#### 2. Technical Knowledge
- Implementation success patterns
- Platform-specific optimization techniques
- Integration best practices
- Performance optimization strategies
- Troubleshooting and debugging patterns

#### 3. Behavioral Knowledge
- User interaction patterns and preferences
- Query evolution and sophistication patterns
- Configuration optimization pathways
- Learning curve and adoption patterns
- Success metric correlation patterns

### Integration Architecture

#### 1. Real-Time Learning Loop
```typescript
class RealTimeLearning {
  async onUserInteraction(interaction: UserInteraction): Promise<void> {
    // 1. Extract learning signals from interaction
    // 2. Update knowledge vectors in real-time
    // 3. Adjust recommendation algorithms
    // 4. Update user-specific knowledge patterns
  }

  async onOutcomeObservation(outcome: OutcomeData): Promise<void> {
    // 1. Correlate outcome with previous recommendations
    // 2. Update success probability models
    // 3. Adjust knowledge relevance weights
    // 4. Propagate learning across similar contexts
  }
}
```

#### 2. Knowledge Graph Evolution
- Dynamic relationship discovery and strengthening
- Automatic concept emergence and classification
- Knowledge deprecation and relevance decay
- Cross-domain knowledge transfer and adaptation

### Guidelines & Best Practices

#### Learning Quality
- Multi-source validation of learned patterns
- Confidence scoring for knowledge elements
- Continuous validation against real-world outcomes
- Bias detection and mitigation strategies

#### Privacy & Security
- Privacy-preserving learning techniques
- Knowledge anonymization and aggregation
- Secure knowledge sharing protocols
- User control over knowledge contribution

#### Performance Optimization
- Efficient vector similarity search algorithms
- Intelligent knowledge caching strategies
- Incremental learning to minimize computational overhead
- Knowledge compression and optimization techniques

---

## Platform Services

### API Gateway

**Service Name**: `api-gateway`
**Priority Level**: 🌐 P0 (Platform Infrastructure)
**Deployment**: Vercel Edge Functions
**API Contract**: `/api/gateway/*` - Routes to all services

#### Service Purpose
Centralized API management, authentication, rate limiting, request routing, and circuit breakers for all OSA services.

#### Responsibilities
- **Authentication & Authorization**: JWT token validation, API key management
- **Rate Limiting**: Per-user, per-service, and per-endpoint throttling
- **Request Routing**: Intelligent routing to appropriate service functions
- **Circuit Breakers**: Automatic failure detection and traffic routing
- **Request/Response Transformation**: Protocol adaptation and data formatting
- **Metrics Collection**: API usage analytics and performance monitoring

### Event Bus

**Service Name**: `event-bus`
**Priority Level**: 🌐 P0 (Platform Infrastructure)
**Implementation**: Supabase Realtime + Custom Event Router
**API Contract**: `/api/events/*` - Event publishing and subscription

#### Service Purpose
Asynchronous message routing and event streaming for decoupled service communication.

#### Responsibilities
- **Event Publishing**: Accept events from all services with schema validation
- **Event Routing**: Route events to subscribed services based on event types
- **Event Persistence**: Store events for replay, debugging, and audit
- **Schema Registry**: Manage event schema versions and compatibility
- **Dead Letter Queues**: Handle failed event processing with retry policies

### Monitoring Service

**Service Name**: `monitoring-service`
**Priority Level**: 🌐 P0 (Platform Infrastructure)
**Deployment**: Vercel Functions + External APM
**API Contract**: `/api/monitoring/*` - Health and metrics endpoints

#### Service Purpose
Health checks, metrics collection, distributed tracing, and alerting across all OSA services.

#### Responsibilities
- **Health Checks**: Monitor service availability and performance
- **Metrics Collection**: Gather business and technical metrics from all services
- **Distributed Tracing**: Track requests across service boundaries
- **Alerting**: Proactive notifications for service degradation
- **Dashboard Management**: Real-time observability and analytics

---

## Event Schemas & Communication

### Core Event Types

#### 1. Intake Events
```typescript
// Strategy context submission
interface IntakeSubmittedEvent {
  event_type: "intake.submitted@1";
  timestamp: string;
  intake_id: string;
  user_id: string;
  context: {
    business_objectives: string[];
    technical_constraints: object;
    timeline: string;
    budget_range: string;
  };
  metadata: {
    session_id: string;
    source: "dashboard" | "api";
  };
}
```

#### 2. Orchestration Events
```typescript
// Workflow trigger
interface WorkflowTriggeredEvent {
  event_type: "orchestration.workflow.triggered@1";
  timestamp: string;
  workflow_id: string;
  trigger_source: "force_sync" | "scheduled" | "api";
  agents_scheduled: string[];
  metadata: {
    session_id: string;
    user_id: string;
    estimated_duration_ms: number;
  };
}

// Agent completion
interface AgentCompletedEvent {
  event_type: "orchestration.agent.completed@1";
  timestamp: string;
  workflow_id: string;
  agent_id: string;
  agent_name: string;
  success: boolean;
  results: object;
  execution_time_ms: number;
  metadata: {
    session_id: string;
    error_message?: string;
  };
}

// Workflow completion
interface WorkflowCompletedEvent {
  event_type: "orchestration.workflow.completed@1";
  timestamp: string;
  workflow_id: string;
  success: boolean;
  agent_results: AgentResult[];
  total_execution_time_ms: number;
  metadata: {
    session_id: string;
    failed_agents?: string[];
  };
}
```

#### 3. Knowledge Events
```typescript
// Knowledge update
interface KnowledgeUpsertedEvent {
  event_type: "knowledge.upserted@1";
  timestamp: string;
  knowledge_id: string;
  content_type: "agent_result" | "user_feedback" | "external_data";
  source: string;
  metadata: {
    workflow_id?: string;
    relevance_score?: number;
  };
}

// Knowledge retrieval
interface KnowledgeRetrievedEvent {
  event_type: "knowledge.retrieved@1";
  timestamp: string;
  query: string;
  results_count: number;
  avg_relevance_score: number;
  metadata: {
    user_id: string;
    session_id: string;
    response_time_ms: number;
  };
}
```

#### 4. Recommendation Events
```typescript
// Recommendations generated
interface RecommendationsGeneratedEvent {
  event_type: "recommendations.generated@1";
  timestamp: string;
  recommendation_set_id: string;
  workflow_id: string;
  intake_id: string;
  recommendations: Recommendation[];
  avg_confidence_score: number;
  metadata: {
    user_id: string;
    session_id: string;
    generation_time_ms: number;
    fallback_mode: boolean;
  };
}
```

#### 5. Preferences Events
```typescript
// Preferences updated
interface PreferencesUpdatedEvent {
  event_type: "preferences.updated@1";
  timestamp: string;
  user_id: string;
  preference_category: "strategic" | "policy" | "display";
  changes: object;
  metadata: {
    session_id: string;
    source: "user_action" | "learning_algorithm";
  };
}
```

#### 6. System Health Events
```typescript
// Service health degraded
interface ServiceHealthDegradedEvent {
  event_type: "system.service.degraded@1";
  timestamp: string;
  service_name: string;
  health_status: "degraded" | "down" | "recovering";
  affected_endpoints: string[];
  metadata: {
    error_rate: number;
    response_time_p95: number;
    estimated_recovery_time?: string;
  };
}
```

### Event Flow Patterns

#### Happy Path Flow
```
1. User submits intake → intake.submitted@1
2. Force Sync triggered → orchestration.workflow.triggered@1
3. Agents execute → orchestration.agent.completed@1 (×5)
4. Knowledge stored → knowledge.upserted@1
5. Workflow completes → orchestration.workflow.completed@1
6. Recommendations generated → recommendations.generated@1
7. UI updates → User sees results
```

#### Degraded Mode Flow
```
1. OPAL service down → system.service.degraded@1
2. Workflow fails → orchestration.workflow.failed@1
3. Fallback triggered → knowledge.retrieved@1 (cached data)
4. Degraded recommendations → recommendations.generated@1 (fallback_mode: true)
5. User notified of degraded mode
```


## UX Design Service (Artist)

**Service Name**: `ux-design-service` (Internal Alias: **Artist**)
**Priority Level**: 🟡 P1 (Enhanced Experience)
**Deployment**: Vercel Serverless Functions + Static Assets (CDN)
**Database**: Component Library & Design Tokens (Static Files + Cache)
**API Contract**: `/api/v1/ux-design/*`
**Failback Strategy**: Static fallback components with basic styling

### Service Purpose
The UX Design Service (Artist) owns the complete frontend experience layer, ensuring consistent, accessible, and performant user interfaces across all OSA applications. It decouples presentation logic from business logic, enabling independent UI evolution and optimization.

### Service Boundaries
**Owns**:
- Component library and design system management
- Data visualization engine (charts, graphs, interactive dashboards)
- Responsive design and cross-browser compatibility
- Accessibility compliance (WCAG 2.1 AA) and testing
- Theme management (light/dark mode, high-contrast)
- Performance optimization (lazy loading, code splitting)
- Error boundaries and graceful UI degradation
- Print-friendly layouts and export functionality
- Role-based navigation and personalization logic

**Depends On**:
- Recommendation Service (data for visualizations)
- Knowledge & Retrieval Service (content for displays)
- Preferences & Policy Service (user display preferences)
- Event Bus for real-time UI updates

**Provides To**:
- All frontend applications (component library and themes)
- Dashboard interfaces (visualizations and layouts)
- Export services (formatted reports and charts)
- Mobile applications (responsive components)

### API Contract
```typescript
GET /api/v1/ux-design/components
Response: {
  "components": [
    {
      "name": "string",
      "category": "inputs|layout|navigation|display",
      "variants": ["string"],
      "accessibility_features": ["string"],
      "responsive": "boolean",
      "code_example": "string"
    }
  ],
  "library_version": "string"
}

POST /api/v1/ux-design/visualization
{
  "chart_type": "bar|line|pie|scatter|heatmap|treemap|sankey|gauge",
  "data_source": "array",
  "configuration": "object",
  "styling": "object",
  "accessibility": "object"
}
Response: {
  "visualization_id": "string",
  "configuration": "object",
  "accessibility_features": ["string"],
  "responsive_breakpoints": "object",
  "performance_optimizations": "object"
}

GET /api/v1/ux-design/themes
Response: {
  "themes": [
    {
      "name": "string",
      "display_name": "string",
      "primary_color": "string",
      "design_tokens": "object"
    }
  ],
  "supported_modes": ["light", "dark", "auto", "high-contrast"]
}
```

### System Modes

#### Full Operation Mode (P1)
- Dynamic component library with real-time updates
- Advanced data visualization with interactive features
- Personalized themes based on user preferences
- Performance monitoring and automatic optimization
- Complete accessibility compliance testing

#### Degraded Mode (P0 Fallback)
- Static component library with cached assets
- Basic chart generation without advanced interactivity
- Standard light/dark theme switching
- Essential accessibility features (keyboard navigation, screen reader support)
- Simple responsive layouts

#### Emergency Failbacks
- **Component Library Failure**: Use inline CSS and basic HTML elements
- **Visualization Engine Down**: Display data in accessible tables with basic styling
- **Theme System Failure**: Apply browser default styling with OSA branding
- **Performance Tools Down**: Serve non-optimized assets with standard loading

### Technical Components

#### 1. Component Library System

**Design System Architecture**:
```typescript
interface ComponentLibraryConfig {
  theme: 'light' | 'dark' | 'auto';
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  components: {
    buttons: ComponentVariant[];
    forms: ComponentVariant[];
    cards: ComponentVariant[];
    navigation: ComponentVariant[];
  };
}

interface ComponentVariant {
  name: string;
  variant: string;
  accessibility_features: string[];
  responsive_breakpoints: string[];
}
```

**Component Categories**:
- **Input Components**: Forms, buttons, selectors, file uploads
- **Layout Components**: Grids, containers, spacing, responsive wrappers
- **Navigation Components**: Menus, breadcrumbs, pagination, tabs
- **Display Components**: Cards, modals, tooltips, notifications
- **Data Components**: Tables, lists, tree views, status indicators

#### 2. Data Visualization Engine

**Chart Types Supported**:
- **Statistical Charts**: Bar, line, scatter, histogram, box plots
- **Hierarchical Visualizations**: Treemap, sunburst, network diagrams
- **Specialized Charts**: Sankey diagrams, gauge charts, heat maps
- **Interactive Dashboards**: Multi-chart layouts with cross-filtering
- **Real-time Charts**: Live updating visualizations for workflow status

**Accessibility Features**:
```typescript
interface VisualizationAccessibility {
  alt_text: string;
  data_table_fallback: boolean;
  high_contrast: boolean;
  keyboard_navigation: boolean;
  screen_reader_support: boolean;
  color_blind_safe_palette: boolean;
}
```

#### 3. Performance Optimization System

**Core Performance Features**:
- **Code Splitting**: Dynamic imports for component libraries
- **Lazy Loading**: Progressive component and image loading
- **Asset Optimization**: WebP images, minified CSS/JS, CDN delivery
- **Caching Strategies**: Component library versioning and browser caching
- **Bundle Analysis**: Automatic performance monitoring and optimization suggestions

**Performance Targets**:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

#### 4. Accessibility Compliance Engine

**WCAG 2.1 AA Compliance**:
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Focus Management**: Visible focus indicators and logical tab ordering
- **Alternative Content**: Alt text for images, captions for videos
- **Responsive Design**: Content accessible on all device sizes and orientations

**Testing Integration**:
```typescript
interface AccessibilityAudit {
  compliance_level: 'A' | 'AA' | 'AAA';
  automated_tests: AccessibilityTest[];
  manual_review_required: string[];
  recommendations: string[];
}
```

#### 5. Theme and Branding System

**Multi-Theme Support**:
- **Light Mode**: Standard OSA branding with light backgrounds
- **Dark Mode**: Dark theme with appropriate contrast adjustments
- **High Contrast**: Enhanced contrast for accessibility compliance
- **Print Mode**: Print-friendly layouts with optimized typography
- **Custom Themes**: Branded themes for white-label implementations

**Design Token Architecture**:
```css
:root {
  /* Color Tokens */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;

  /* Spacing Tokens */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography Tokens */
  --font-family-sans: 'Inter', system-ui;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}
```

### Integration with Other Services

#### Event Subscriptions
- `recommendations.generated@1` → Update visualization data
- `workflow.completed@1` → Refresh dashboard status
- `preferences.updated@1` → Apply theme and display changes
- `knowledge.retrieved@1` → Update search result displays

#### Service Dependencies
- **Real-time Updates**: WebSocket connections for live dashboard updates
- **Data Integration**: API calls to retrieve data for visualizations
- **Preference Integration**: Theme and layout preferences from Preferences Service
- **Performance Monitoring**: Integration with observability tools for UX metrics

---

## System Integration & Data Flow

### Overall Architecture Pattern

```mermaid
graph TB
    A[Optimizely Platform] --> B[Opal Connector]
    B --> C[RAG Brain]
    D[Engine Form] --> C
    E[Personal Configurator] --> C
    C --> F[Decision Layer]
    F --> G[User Interface]
    H[TTYD] --> C
    H --> G
    F --> I[Recommendations]
    I --> G
```

### Data Flow Patterns

#### 1. Ingestion Flow (Opal Connector → RAG Brain)
```typescript
// Primary data ingestion pathway
OptimizelyData → OpalAgents → ProcessedInsights → RAGBrain → EnhancedKnowledge
```

#### 2. Enhancement Flow (Engine Form → Decision Layer)
```typescript
// Business context enhancement pathway
UserInput → BusinessContext → DecisionParameters → PersonalizedRecommendations
```

#### 3. Personalization Flow (Personal Configurator → All Systems)
```typescript
// Personalization configuration pathway
UserPreferences → SystemConfiguration → PersonalizedExperience
```

#### 4. Query Flow (TTYD → RAG Brain → Response)
```typescript
// Interactive query pathway
NaturalLanguageQuery → QueryUnderstanding → DataRetrieval → InsightGeneration → Response
```

#### 5. Learning Flow (All Systems → RAG Brain)
```typescript
// Continuous learning pathway
UserInteractions → PatternExtraction → KnowledgeUpdate → ImprovedRecommendations
```

### Inter-System Communication Protocols

#### 1. Event-Driven Architecture
- Asynchronous event publication for system decoupling
- Event sourcing for complete audit trails
- Real-time event streaming for live updates
- Event replay capabilities for system recovery

#### 2. API Gateway Pattern
- Centralized API management and routing
- Authentication and authorization enforcement
- Rate limiting and throttling
- Request/response transformation and validation

#### 3. Circuit Breaker Pattern
- Automatic failure detection and isolation
- Graceful degradation when subsystems fail
- Automatic recovery and health checking
- Fallback mechanisms for critical functionality

---

## Technical Stack & Infrastructure

### Core Technologies

#### Frontend
- **Framework**: Next.js 16.0.1 with Turbopack
- **UI Library**: shadcn/ui with Tailwind CSS
- **State Management**: React hooks with context patterns
- **Real-time Communication**: Server-Sent Events (SSE)
- **Form Management**: React Hook Form with Zod validation

#### Backend
- **Runtime**: Node.js with TypeScript
- **API Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

#### AI & ML
- **Language Models**: OpenAI GPT models
- **Vector Database**: Supabase pgvector
- **Embedding Generation**: OpenAI text-embedding models
- **Pattern Recognition**: Custom algorithms with scikit-learn

#### Infrastructure
- **Hosting**: Vercel Platform
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in analytics and logging
- **CI/CD**: GitHub Actions with Vercel integration

### Deployment Architecture

#### Production Environment
```yaml
# Vercel deployment configuration
- Frontend: Vercel Edge Functions
- API Routes: Vercel Serverless Functions
- Database: Supabase Multi-Region
- CDN: Global Edge Network
- SSL: Automatic HTTPS with custom domains
```

#### Development Environment
```yaml
# Local development setup
- Frontend: Next.js Dev Server with Turbopack
- Database: Local Supabase instance
- API Testing: Built-in API route testing
- Hot Reload: Fast Refresh for instant updates
```

### Data Storage Architecture

#### Database Schema
```sql
-- Core execution tracking
opal_workflow_executions
opal_agent_executions
opal_webhook_events

-- Insights storage
opal_odp_insights
opal_content_insights

-- User configuration
personal_configurations
engine_form_submissions

-- Knowledge base
knowledge_vectors
knowledge_relationships
learning_outcomes
```

#### File Storage
```
/uploads/
  /execution-data/     # Raw execution data files
  /insights/           # Generated insight reports
  /configurations/     # Exported configurations
  /knowledge-base/     # RAG brain knowledge exports
```

---

## Security & Performance

### Security Framework

#### 1. Authentication & Authorization
- **Multi-factor Authentication**: Required for all administrative functions
- **Role-Based Access Control**: Granular permissions for different user types
- **API Key Management**: Secure generation, rotation, and revocation
- **Session Management**: Secure token handling with automatic expiration

#### 2. Data Protection
- **Encryption at Rest**: AES-256 encryption for all stored data
- **Encryption in Transit**: TLS 1.3 for all API communications
- **Data Anonymization**: PII removal and pseudonymization
- **Access Logging**: Comprehensive audit trails for all data access

#### 3. Webhook Security
```typescript
// HMAC signature verification
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};
```

#### 4. Input Validation
- **Schema Validation**: Zod schemas for all API inputs
- **Sanitization**: XSS prevention and SQL injection protection
- **Rate Limiting**: API endpoint throttling and abuse prevention
- **Content Security Policy**: Strict CSP headers for XSS mitigation

### Performance Optimization

#### 1. Frontend Performance
- **Code Splitting**: Dynamic imports for reduced bundle size
- **Image Optimization**: Next.js automatic image optimization
- **Caching Strategy**: Intelligent caching with stale-while-revalidate
- **Lazy Loading**: Component and route-based lazy loading

#### 2. Backend Performance
- **Database Optimization**: Query optimization with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Caching Layers**: Redis caching for frequently accessed data
- **Response Compression**: Gzip compression for API responses

#### 3. Real-time Performance
```typescript
// Optimized SSE implementation
const createOptimizedEventStream = () => {
  const encoder = new TextEncoder();
  let lastEventTime = Date.now();

  return new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        // Only send updates when data actually changes
        if (hasDataChanged(lastEventTime)) {
          const data = getLatestData();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          lastEventTime = Date.now();
        }
      }, 2000); // 2-second polling interval

      // Cleanup on client disconnect
      return () => clearInterval(interval);
    }
  });
};
```

#### 4. Scalability Considerations
- **Horizontal Scaling**: Stateless architecture for easy scaling
- **Load Balancing**: Automatic load distribution across instances
- **Database Scaling**: Read replicas and connection pooling
- **CDN Integration**: Global content distribution for optimal performance

### Monitoring & Observability

#### 1. Application Monitoring
- Real-time performance metrics
- Error tracking and alerting
- User session recording and analysis
- Custom business metric tracking

#### 2. Infrastructure Monitoring
- Server performance and resource utilization
- Database performance and query analysis
- Network latency and throughput monitoring
- Security event detection and alerting

#### 3. Business Intelligence
- User engagement and adoption metrics
- Recommendation success rate tracking
- System usage patterns and trends
- ROI and business impact measurement

---

## Future Enhancements & Roadmap

### Planned Features

#### 1. Advanced AI Capabilities
- **Multi-modal AI**: Support for image and video content analysis
- **Predictive Analytics**: Advanced forecasting and trend prediction
- **Automated A/B Testing**: AI-driven experiment design and execution
- **Natural Language Reporting**: Automated insight generation and reporting

#### 2. Enterprise Features
- **Multi-tenant Architecture**: Support for multiple organizations
- **Advanced Permissions**: Granular role-based access control
- **API Ecosystem**: Public APIs for third-party integrations
- **White-label Solutions**: Customizable branding and deployment

#### 3. Integration Expansions
- **Additional Platforms**: Support for Google Optimize, Adobe Target, etc.
- **Marketing Automation**: Integration with HubSpot, Marketo, Salesforce
- **Analytics Platforms**: Deep integration with Google Analytics, Adobe Analytics
- **Business Intelligence**: Integration with Tableau, Power BI, Looker

### Technical Debt & Improvements

#### 1. Architecture Enhancements
- **Microservices Migration**: Gradual decomposition into microservices
- **Event Sourcing**: Implementation of comprehensive event sourcing
- **CQRS Pattern**: Command-Query Responsibility Segregation for better scalability
- **GraphQL API**: More efficient API layer with GraphQL

#### 2. Performance Optimizations
- **Edge Computing**: Move processing closer to users
- **Advanced Caching**: Implement sophisticated caching strategies
- **Database Optimization**: Advanced query optimization and indexing
- **Real-time Processing**: Stream processing for instant insights

---

## Documentation Maintenance Protocol

### 📋 Living Architecture Document
This OSA_ARCHITECTURE.md document is a **living technical specification** that must be updated whenever changes are made to any of the six core systems. The document serves as the single source of truth for understanding how OSA systems work together.

### 🔄 Update Requirements
**MANDATORY**: All developers must update this document when making changes to:
- System priorities (P0/P1/P2 classifications)
- Failback mechanisms and emergency procedures
- Inter-system dependencies and data flows
- API endpoints and integration patterns
- Database schemas and data structures
- Security frameworks and authentication methods

### 📝 Update Process
1. **Before Implementation**: Review current architecture documentation
2. **During Development**: Note all architectural impacts of changes
3. **Before Commit**: Update relevant sections in OSA_ARCHITECTURE.md
4. **After Deployment**: Validate documentation accuracy against live system

### 🚨 Critical Update Scenarios
- **Immediate**: P0 system failures requiring architecture changes
- **Within 24 hours**: New features or significant modifications
- **Within 1 week**: Performance optimizations and code refactoring

### 🔧 Automation Support
Use `.claude/commands/update-architecture-docs.md` for detailed procedures and automated validation tools.

### 📊 Success Metrics
- **Accuracy**: Documentation matches implementation (Target: >95%)
- **Freshness**: Time between changes and documentation updates (Target: <24 hours)
- **Completeness**: All systems fully documented (Target: 100%)

---

*Last Updated: November 9, 2024*
*Document Version: 1.1*
*Next Review: December 9, 2024*
*Maintenance Protocol: Active - See .claude/commands/update-architecture-docs.md*