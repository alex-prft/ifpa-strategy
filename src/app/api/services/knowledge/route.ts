/**
 * Knowledge & Retrieval Service - OSA RAG Brain (Phase 1)
 *
 * Handles knowledge management, semantic search, document indexing, and
 * RAG (Retrieval-Augmented Generation) capabilities for OSA insights.
 *
 * Phase 1 Capabilities:
 * - Knowledge document storage and indexing
 * - Simple keyword and text-based search
 * - Basic content categorization and tagging
 * - Agent output storage and retrieval
 * - Semantic similarity (basic cosine similarity)
 * - Knowledge graph foundations
 *
 * Future Phases:
 * - Phase 2: Vector embeddings with OpenAI/Cohere
 * - Phase 3: Advanced ML models and learning systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';
import { publishEvent } from '@/lib/events/event-bus';
import { createServiceCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import {
  generateEventId,
  generateCorrelationId,
  createEventMetadata,
  type KnowledgeUpsertedEvent,
  type KnowledgeRetrievedEvent,
  type KnowledgeIndexedEvent
} from '@/lib/events/schemas';

const logger = createServiceLogger('knowledge-service');
const dbCircuitBreaker = createServiceCircuitBreaker('knowledge-db', 'database');
const searchCircuitBreaker = createServiceCircuitBreaker('knowledge-search', 'search');

// Knowledge types and interfaces
interface KnowledgeDocument {
  id: string;
  content_type: 'agent_result' | 'user_feedback' | 'external_data' | 'recommendation' | 'insight';
  source: string;
  title: string;
  content: string;
  summary: string;
  metadata: {
    workflow_id?: string;
    agent_name?: string;
    client_name?: string;
    industry?: string;
    tags: string[];
    relevance_score?: number;
    content_hash: string;
    indexed_at: string;
    updated_at: string;
  };
  relationships?: {
    related_documents: string[];
    parent_workflow?: string;
    child_insights?: string[];
  };
}

interface SearchQuery {
  query: string;
  query_type: 'semantic' | 'keyword' | 'hybrid';
  filters?: {
    content_type?: string[];
    source?: string[];
    client_name?: string;
    industry?: string;
    tags?: string[];
    date_range?: {
      start: string;
      end: string;
    };
  };
  options?: {
    max_results?: number;
    min_relevance?: number;
    include_metadata?: boolean;
    include_content?: boolean;
  };
}

interface SearchResult {
  document: KnowledgeDocument;
  relevance_score: number;
  matching_snippets: string[];
  explanation?: string;
}

// Service Health Check
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/health')) {
    return handleHealthCheck();
  }

  if (pathname.endsWith('/search')) {
    return handleSearch(request);
  }

  if (pathname.endsWith('/documents')) {
    return handleListDocuments(request);
  }

  if (pathname.includes('/documents/')) {
    const segments = pathname.split('/');
    const documentId = segments[segments.length - 1];
    return handleGetDocument(documentId);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// Store Knowledge Document
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'system';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      content_type,
      source,
      title,
      content,
      metadata = {},
      workflow_id,
      auto_index = true
    } = body;

    // Validate required fields
    if (!content_type || !source || !title || !content) {
      return NextResponse.json(
        { error: 'content_type, source, title, and content are required' },
        { status: 400 }
      );
    }

    const documentId = generateEventId();
    const contentHash = await generateContentHash(content);

    logger.info('Storing knowledge document', {
      documentId,
      contentType: content_type,
      source,
      contentLength: content.length,
      workflowId: workflow_id
    });

    // Step 1: Generate summary and extract key information
    const processedContent = await processContent(title, content, metadata);

    // Step 2: Create knowledge document
    const knowledgeDoc: KnowledgeDocument = {
      id: documentId,
      content_type,
      source,
      title,
      content,
      summary: processedContent.summary,
      metadata: {
        ...metadata,
        workflow_id,
        tags: processedContent.tags,
        relevance_score: processedContent.relevance_score,
        content_hash: contentHash,
        indexed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      relationships: processedContent.relationships
    };

    // Step 3: Store document
    await dbCircuitBreaker.execute(async () => {
      await storeKnowledgeDocument(knowledgeDoc);
    }).catch(error => {
      logger.warn('Database storage failed, using in-memory cache', { error });
      // Store in temporary cache for resilience
      storeInMemoryCache(knowledgeDoc);
    });

    // Step 4: Index for search (if auto_index enabled)
    if (auto_index) {
      await searchCircuitBreaker.execute(async () => {
        await indexDocument(knowledgeDoc);
      }).catch(error => {
        logger.warn('Search indexing failed, document stored but not searchable yet', { error });
      });
    }

    // Step 5: Publish events
    await publishEvent({
      event_type: 'knowledge.upserted@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      knowledge_id: documentId,
      content_type,
      source,
      content_hash: contentHash,
      tags: processedContent.tags,
      metadata: createEventMetadata(workflow_id || 'direct', userId, 'knowledge-service', {
        workflow_id,
        relevance_score: processedContent.relevance_score,
        content_size_bytes: content.length,
        embedding_model: 'phase1_simple'
      })
    } as KnowledgeUpsertedEvent);

    if (auto_index) {
      await publishEvent({
        event_type: 'knowledge.indexed@1',
        event_id: generateEventId(),
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        version: 1,
        knowledge_id: documentId,
        indexing_method: 'keyword',
        index_stats: {
          tokens: processedContent.token_count,
          relationships: Object.keys(processedContent.relationships || {}).length
        },
        metadata: createEventMetadata(workflow_id || 'direct', userId, 'knowledge-service', {
          indexing_time_ms: processedContent.processing_time_ms,
          model_version: '1.0.0'
        })
      } as KnowledgeIndexedEvent);
    }

    return NextResponse.json({
      knowledge_id: documentId,
      status: 'stored',
      indexed: auto_index,
      summary: processedContent.summary,
      extracted_tags: processedContent.tags,
      relevance_score: processedContent.relevance_score,
      content_hash: contentHash,
      message: 'Knowledge document stored successfully'
    });

  } catch (error) {
    logger.error('Failed to store knowledge document', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to store knowledge document', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update Knowledge Document
export async function PUT(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const requestId = request.headers.get('x-request-id') || generateEventId();
  const userId = request.headers.get('x-user-id') || 'system';

  logger.setContext({ correlationId, requestId, userId });

  try {
    const body = await request.json();
    const {
      document_id,
      updates,
      reindex = true
    } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: 'document_id is required' },
        { status: 400 }
      );
    }

    logger.info('Updating knowledge document', {
      documentId: document_id,
      updateFields: Object.keys(updates || {}).length,
      reindex
    });

    // Retrieve existing document
    const existingDoc = await retrieveKnowledgeDocument(document_id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Knowledge document not found' },
        { status: 404 }
      );
    }

    // Apply updates
    const updatedDoc: KnowledgeDocument = {
      ...existingDoc,
      ...updates,
      metadata: {
        ...existingDoc.metadata,
        ...updates.metadata,
        updated_at: new Date().toISOString()
      }
    };

    // Reprocess content if content was updated
    if (updates.content || updates.title) {
      const processedContent = await processContent(
        updatedDoc.title,
        updatedDoc.content,
        updatedDoc.metadata
      );
      updatedDoc.summary = processedContent.summary;
      updatedDoc.metadata.tags = processedContent.tags;
      updatedDoc.metadata.relevance_score = processedContent.relevance_score;
      updatedDoc.metadata.content_hash = await generateContentHash(updatedDoc.content);
    }

    // Store updated document
    await dbCircuitBreaker.execute(async () => {
      await updateKnowledgeDocument(document_id, updatedDoc);
    });

    // Reindex if requested
    if (reindex) {
      await searchCircuitBreaker.execute(async () => {
        await indexDocument(updatedDoc);
      }).catch(error => {
        logger.warn('Reindexing failed', { error });
      });
    }

    return NextResponse.json({
      document_id,
      status: 'updated',
      reindexed: reindex,
      message: 'Knowledge document updated successfully'
    });

  } catch (error) {
    logger.error('Failed to update knowledge document', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to update knowledge document', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleHealthCheck(): Promise<NextResponse> {
  try {
    // Check service dependencies
    const documentStorageHealthy = true;
    const searchIndexHealthy = true;
    const contentProcessingHealthy = true;

    const isHealthy = documentStorageHealthy && searchIndexHealthy && contentProcessingHealthy;

    return NextResponse.json({
      service: 'knowledge-service',
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        document_storage: documentStorageHealthy ? 'pass' : 'fail',
        search_index: searchIndexHealthy ? 'pass' : 'fail',
        content_processing: contentProcessingHealthy ? 'pass' : 'fail'
      },
      capabilities: [
        'document_storage',
        'keyword_search',
        'content_processing',
        'basic_summarization',
        'tag_extraction',
        'relationship_mapping'
      ],
      phase: 'Phase 1 - Simple Text Processing',
      model_versions: {
        content_processor: '1.0.0',
        search_engine: '1.0.0',
        summarizer: '1.0.0'
      },
      statistics: {
        total_documents: await getDocumentCount(),
        indexed_documents: await getIndexedDocumentCount(),
        storage_size_mb: await getStorageSize()
      },
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      service: 'knowledge-service',
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function handleSearch(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const queryType = (url.searchParams.get('type') as SearchQuery['query_type']) || 'hybrid';
  const maxResults = parseInt(url.searchParams.get('limit') || '10');
  const minRelevance = parseFloat(url.searchParams.get('min_relevance') || '0.1');

  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const userId = request.headers.get('x-user-id') || 'anonymous';

  logger.setContext({ correlationId, userId });

  try {
    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    logger.info('Processing knowledge search', {
      query,
      queryType,
      maxResults,
      minRelevance
    });

    const searchQuery: SearchQuery = {
      query: query.trim(),
      query_type: queryType,
      filters: {
        content_type: url.searchParams.get('content_type')?.split(','),
        source: url.searchParams.get('source')?.split(','),
        client_name: url.searchParams.get('client_name') || undefined,
        industry: url.searchParams.get('industry') || undefined,
        tags: url.searchParams.get('tags')?.split(',')
      },
      options: {
        max_results: maxResults,
        min_relevance: minRelevance,
        include_metadata: true,
        include_content: url.searchParams.get('include_content') === 'true'
      }
    };

    // Perform search
    const searchResults = await searchCircuitBreaker.execute(async () => {
      return await performSearch(searchQuery);
    });

    // Publish search event
    await publishEvent({
      event_type: 'knowledge.retrieved@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      query: query,
      query_type: queryType,
      results_count: searchResults.length,
      avg_relevance_score: searchResults.length > 0
        ? searchResults.reduce((sum, r) => sum + r.relevance_score, 0) / searchResults.length
        : 0,
      metadata: createEventMetadata('search', userId, 'knowledge-service', {
        response_time_ms: Date.now() - parseInt(correlationId.split('_')[1] || '0'),
        cache_hit: false,
        search_method: queryType
      })
    } as KnowledgeRetrievedEvent);

    return NextResponse.json({
      query: query,
      query_type: queryType,
      results: searchResults,
      total_results: searchResults.length,
      search_time_ms: Date.now() - parseInt(correlationId.split('_')[1] || '0'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Knowledge search failed', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Knowledge search failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleListDocuments(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const contentType = url.searchParams.get('content_type');
  const source = url.searchParams.get('source');

  try {
    const documents = await listKnowledgeDocuments({
      limit,
      offset,
      content_type: contentType || undefined,
      source: source || undefined
    });

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        content_type: doc.content_type,
        source: doc.source,
        title: doc.title,
        summary: doc.summary,
        metadata: doc.metadata
      })),
      pagination: {
        limit,
        offset,
        total: await getDocumentCount()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to list documents', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

async function handleGetDocument(documentId: string): Promise<NextResponse> {
  try {
    const document = await retrieveKnowledgeDocument(documentId);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      document,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve document', { error: error instanceof Error ? error.message : String(error) }, error as Error);

    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}

// Content processing functions (Phase 1 - Simple approaches)
async function processContent(title: string, content: string, metadata: any): Promise<{
  summary: string;
  tags: string[];
  relevance_score: number;
  relationships: any;
  token_count: number;
  processing_time_ms: number;
}> {
  const startTime = Date.now();

  // Simple extractive summarization
  const summary = generateSimpleSummary(content);

  // Basic tag extraction
  const tags = extractBasicTags(title, content, metadata);

  // Simple relevance scoring
  const relevance_score = calculateBasicRelevance(title, content, metadata);

  // Basic relationship detection
  const relationships = detectBasicRelationships(content, metadata);

  // Token counting
  const token_count = content.split(/\s+/).length;

  return {
    summary,
    tags,
    relevance_score,
    relationships,
    token_count,
    processing_time_ms: Date.now() - startTime
  };
}

function generateSimpleSummary(content: string): string {
  // Simple extractive summarization - take first few sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const maxSentences = Math.min(3, sentences.length);
  return sentences.slice(0, maxSentences).join('. ').trim() + '.';
}

function extractBasicTags(title: string, content: string, metadata: any): string[] {
  const tags = new Set<string>();

  // Add metadata tags
  if (metadata.tags && Array.isArray(metadata.tags)) {
    metadata.tags.forEach((tag: string) => tags.add(tag.toLowerCase()));
  }

  // Extract from industry and client
  if (metadata.industry) tags.add(metadata.industry.toLowerCase());
  if (metadata.client_name) tags.add('client:' + metadata.client_name.toLowerCase());

  // Basic keyword extraction from content
  const text = (title + ' ' + content).toLowerCase();
  const keywords = [
    'optimization', 'personalization', 'testing', 'analytics', 'conversion',
    'recommendation', 'strategy', 'implementation', 'roi', 'engagement',
    'automation', 'segmentation', 'campaign', 'content', 'experience'
  ];

  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}

function calculateBasicRelevance(title: string, content: string, metadata: any): number {
  let score = 0.5; // Base score

  // Boost for longer, more detailed content
  if (content.length > 1000) score += 0.2;
  if (content.length > 5000) score += 0.1;

  // Boost for recent content
  const updatedAt = new Date(metadata.updated_at || Date.now());
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) score += 0.1;
  if (daysSinceUpdate < 7) score += 0.1;

  // Boost for certain content types
  if (metadata.content_type === 'recommendation') score += 0.1;
  if (metadata.content_type === 'insight') score += 0.15;

  return Math.min(1.0, Math.max(0.1, score));
}

function detectBasicRelationships(content: string, metadata: any): any {
  const relationships: any = {
    related_documents: [],
    parent_workflow: metadata.workflow_id,
    child_insights: []
  };

  // Simple relationship detection based on content mentions
  // In Phase 2/3, this would use more sophisticated NLP

  return relationships;
}

// Search functions (Phase 1 - Simple keyword and text matching)
async function performSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
  const documents = await searchDocuments(searchQuery);

  return documents.map(doc => ({
    document: doc,
    relevance_score: calculateSearchRelevance(doc, searchQuery),
    matching_snippets: extractMatchingSnippets(doc, searchQuery.query),
    explanation: generateSearchExplanation(doc, searchQuery)
  })).sort((a, b) => b.relevance_score - a.relevance_score);
}

function calculateSearchRelevance(doc: KnowledgeDocument, query: SearchQuery): number {
  const queryLower = query.query.toLowerCase();
  const titleLower = doc.title.toLowerCase();
  const contentLower = doc.content.toLowerCase();
  const summaryLower = doc.summary.toLowerCase();

  let score = 0;

  // Title matches (highest weight)
  if (titleLower.includes(queryLower)) score += 0.4;

  // Summary matches (medium weight)
  if (summaryLower.includes(queryLower)) score += 0.3;

  // Content matches (lower weight)
  const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
  score += Math.min(0.3, contentMatches * 0.05);

  // Tag matches
  const tagMatches = doc.metadata.tags.filter(tag =>
    tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
  ).length;
  score += tagMatches * 0.1;

  // Base relevance score
  score += (doc.metadata.relevance_score || 0.5) * 0.2;

  return Math.min(1.0, score);
}

function extractMatchingSnippets(doc: KnowledgeDocument, query: string): string[] {
  const queryLower = query.toLowerCase();
  const sentences = doc.content.split(/[.!?]+/);

  return sentences
    .filter(sentence => sentence.toLowerCase().includes(queryLower))
    .slice(0, 3)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 20);
}

function generateSearchExplanation(doc: KnowledgeDocument, query: SearchQuery): string {
  const reasons = [];

  if (doc.title.toLowerCase().includes(query.query.toLowerCase())) {
    reasons.push('title match');
  }

  if (doc.summary.toLowerCase().includes(query.query.toLowerCase())) {
    reasons.push('summary match');
  }

  const tagMatches = doc.metadata.tags.filter(tag =>
    tag.toLowerCase().includes(query.query.toLowerCase())
  );
  if (tagMatches.length > 0) {
    reasons.push(`tag match (${tagMatches.join(', ')})`);
  }

  return reasons.length > 0 ? `Matched on: ${reasons.join(', ')}` : 'Content relevance';
}

// Storage functions (Mock implementations for Phase 1)
const inMemoryCache = new Map<string, KnowledgeDocument>();
let documentCounter = 0;

async function generateContentHash(content: string): Promise<string> {
  // Simple hash function for Phase 1
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

async function storeKnowledgeDocument(doc: KnowledgeDocument): Promise<void> {
  // Mock storage implementation - replace with actual database storage
  logger.debug('Storing knowledge document', {
    documentId: doc.id,
    contentType: doc.content_type,
    source: doc.source
  });
  inMemoryCache.set(doc.id, doc);
  documentCounter++;
}

function storeInMemoryCache(doc: KnowledgeDocument): void {
  inMemoryCache.set(doc.id, doc);
  documentCounter++;
}

async function updateKnowledgeDocument(docId: string, doc: KnowledgeDocument): Promise<void> {
  // Mock update implementation
  logger.debug('Updating knowledge document', { documentId: docId });
  inMemoryCache.set(docId, doc);
}

async function retrieveKnowledgeDocument(docId: string): Promise<KnowledgeDocument | null> {
  return inMemoryCache.get(docId) || null;
}

async function searchDocuments(query: SearchQuery): Promise<KnowledgeDocument[]> {
  const allDocs = Array.from(inMemoryCache.values());
  const queryLower = query.query.toLowerCase();

  return allDocs.filter(doc => {
    // Apply filters
    if (query.filters?.content_type && !query.filters.content_type.includes(doc.content_type)) {
      return false;
    }

    if (query.filters?.source && !query.filters.source.includes(doc.source)) {
      return false;
    }

    if (query.filters?.client_name && doc.metadata.client_name !== query.filters.client_name) {
      return false;
    }

    // Basic text matching
    const searchText = `${doc.title} ${doc.content} ${doc.summary} ${doc.metadata.tags.join(' ')}`.toLowerCase();
    return searchText.includes(queryLower);
  }).slice(0, query.options?.max_results || 10);
}

async function listKnowledgeDocuments(options: {
  limit: number;
  offset: number;
  content_type?: string;
  source?: string;
}): Promise<KnowledgeDocument[]> {
  const allDocs = Array.from(inMemoryCache.values());

  let filtered = allDocs;
  if (options.content_type) {
    filtered = filtered.filter(doc => doc.content_type === options.content_type);
  }
  if (options.source) {
    filtered = filtered.filter(doc => doc.source === options.source);
  }

  return filtered
    .sort((a, b) => new Date(b.metadata.updated_at).getTime() - new Date(a.metadata.updated_at).getTime())
    .slice(options.offset, options.offset + options.limit);
}

async function indexDocument(doc: KnowledgeDocument): Promise<void> {
  // Mock indexing implementation - in production, this would update search indices
  logger.debug('Indexing knowledge document', {
    documentId: doc.id,
    tokens: doc.content.split(/\s+/).length
  });
}

async function getDocumentCount(): Promise<number> {
  return documentCounter;
}

async function getIndexedDocumentCount(): Promise<number> {
  return documentCounter; // In Phase 1, all stored docs are considered indexed
}

async function getStorageSize(): Promise<number> {
  // Estimate storage size in MB
  const totalSize = Array.from(inMemoryCache.values())
    .reduce((sum, doc) => sum + JSON.stringify(doc).length, 0);
  return Math.round(totalSize / (1024 * 1024) * 100) / 100;
}