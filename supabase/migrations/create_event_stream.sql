-- ===============================
-- OSA Event Stream Tables
-- Create event streaming infrastructure for microservices communication
-- ===============================

-- Event stream table for storing all OSA events
CREATE TABLE IF NOT EXISTS osa_event_stream (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    dead_letter BOOLEAN DEFAULT FALSE,
    correlation_id VARCHAR(255) NOT NULL,
    causation_id VARCHAR(255),
    trace_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_event_type ON osa_event_stream(event_type);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_published_at ON osa_event_stream(published_at);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_processed ON osa_event_stream(processed);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_correlation_id ON osa_event_stream(correlation_id);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_trace_id ON osa_event_stream(trace_id);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_retry_count ON osa_event_stream(retry_count);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_unprocessed ON osa_event_stream(processed, dead_letter, retry_count) WHERE processed = FALSE AND dead_letter = FALSE;

-- Event subscriptions table for tracking service subscriptions
CREATE TABLE IF NOT EXISTS osa_event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    event_type_pattern VARCHAR(100) NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    max_retries INTEGER DEFAULT 3,
    retry_delay_ms INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_osa_event_subscriptions_service ON osa_event_subscriptions(service_name);
CREATE INDEX IF NOT EXISTS idx_osa_event_subscriptions_pattern ON osa_event_subscriptions(event_type_pattern);
CREATE INDEX IF NOT EXISTS idx_osa_event_subscriptions_active ON osa_event_subscriptions(active);

-- Event metrics table for monitoring and analytics
CREATE TABLE IF NOT EXISTS osa_event_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimensions JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for metrics
CREATE INDEX IF NOT EXISTS idx_osa_event_metrics_type_service ON osa_event_metrics(event_type, service_name);
CREATE INDEX IF NOT EXISTS idx_osa_event_metrics_recorded_at ON osa_event_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_osa_event_metrics_name ON osa_event_metrics(metric_name);

-- Circuit breaker state table
CREATE TABLE IF NOT EXISTS osa_circuit_breakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL UNIQUE,
    circuit_name VARCHAR(100) NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'closed', -- closed, open, half_open
    failure_count INTEGER DEFAULT 0,
    failure_threshold INTEGER DEFAULT 5,
    timeout_ms INTEGER DEFAULT 60000,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for circuit breakers
CREATE INDEX IF NOT EXISTS idx_osa_circuit_breakers_service ON osa_circuit_breakers(service_name);
CREATE INDEX IF NOT EXISTS idx_osa_circuit_breakers_state ON osa_circuit_breakers(state);

-- Service health checks table
CREATE TABLE IF NOT EXISTS osa_service_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    health_status VARCHAR(20) NOT NULL, -- healthy, degraded, down, recovering
    check_name VARCHAR(100) NOT NULL,
    check_status VARCHAR(20) NOT NULL, -- pass, fail, warn
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for health checks
CREATE INDEX IF NOT EXISTS idx_osa_service_health_service ON osa_service_health(service_name);
CREATE INDEX IF NOT EXISTS idx_osa_service_health_status ON osa_service_health(health_status);
CREATE INDEX IF NOT EXISTS idx_osa_service_health_checked_at ON osa_service_health(checked_at);

-- ===============================
-- FUNCTIONS AND TRIGGERS
-- ===============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_osa_event_stream_updated_at BEFORE UPDATE ON osa_event_stream FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_osa_event_subscriptions_updated_at BEFORE UPDATE ON osa_event_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_osa_circuit_breakers_updated_at BEFORE UPDATE ON osa_circuit_breakers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically cleanup old events
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete processed events older than 30 days
    DELETE FROM osa_event_stream
    WHERE processed = TRUE
    AND published_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete old health check records (keep only last 7 days)
    DELETE FROM osa_service_health
    WHERE checked_at < NOW() - INTERVAL '7 days';

    -- Delete old event metrics (keep only last 90 days)
    DELETE FROM osa_event_metrics
    WHERE recorded_at < NOW() - INTERVAL '90 days';

    RETURN deleted_count;
END;
$$ LANGUAGE 'plpgsql';

-- Function to get event processing statistics
CREATE OR REPLACE FUNCTION get_event_stats(
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    total_events BIGINT,
    processed_events BIGINT,
    failed_events BIGINT,
    dead_letter_events BIGINT,
    avg_processing_time_ms NUMERIC,
    events_per_hour NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE processed = TRUE AND dead_letter = FALSE) as processed_events,
        COUNT(*) FILTER (WHERE processed = FALSE AND retry_count > 0) as failed_events,
        COUNT(*) FILTER (WHERE dead_letter = TRUE) as dead_letter_events,
        AVG(EXTRACT(EPOCH FROM (updated_at - published_at)) * 1000) as avg_processing_time_ms,
        COUNT(*)::NUMERIC / GREATEST(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600, 1) as events_per_hour
    FROM osa_event_stream
    WHERE published_at BETWEEN start_time AND end_time;
END;
$$ LANGUAGE 'plpgsql';

-- Function to get service health summary
CREATE OR REPLACE FUNCTION get_service_health_summary()
RETURNS TABLE(
    service_name VARCHAR(100),
    current_status VARCHAR(20),
    last_check TIMESTAMP WITH TIME ZONE,
    avg_response_time_ms NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_checks AS (
        SELECT DISTINCT ON (h.service_name)
            h.service_name,
            h.health_status,
            h.checked_at,
            h.response_time_ms,
            h.check_status
        FROM osa_service_health h
        ORDER BY h.service_name, h.checked_at DESC
    ),
    health_stats AS (
        SELECT
            h.service_name,
            AVG(h.response_time_ms) as avg_response_time,
            COUNT(*) FILTER (WHERE h.check_status = 'pass')::NUMERIC / COUNT(*)::NUMERIC as success_rate
        FROM osa_service_health h
        WHERE h.checked_at > NOW() - INTERVAL '1 hour'
        GROUP BY h.service_name
    )
    SELECT
        lc.service_name,
        lc.health_status as current_status,
        lc.checked_at as last_check,
        hs.avg_response_time as avg_response_time_ms,
        COALESCE(hs.success_rate, 0) as success_rate
    FROM latest_checks lc
    LEFT JOIN health_stats hs ON lc.service_name = hs.service_name
    ORDER BY lc.service_name;
END;
$$ LANGUAGE 'plpgsql';

-- ===============================
-- ROW LEVEL SECURITY (RLS)
-- ===============================

-- Enable RLS on all tables
ALTER TABLE osa_event_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE osa_event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE osa_event_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE osa_circuit_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE osa_service_health ENABLE ROW LEVEL SECURITY;

-- Create policies for service access
-- Note: In production, you would create more restrictive policies based on service authentication

-- Allow all operations for authenticated users (services)
CREATE POLICY "Services can manage events" ON osa_event_stream
    FOR ALL USING (true);

CREATE POLICY "Services can manage subscriptions" ON osa_event_subscriptions
    FOR ALL USING (true);

CREATE POLICY "Services can record metrics" ON osa_event_metrics
    FOR ALL USING (true);

CREATE POLICY "Services can manage circuit breakers" ON osa_circuit_breakers
    FOR ALL USING (true);

CREATE POLICY "Services can record health checks" ON osa_service_health
    FOR ALL USING (true);

-- ===============================
-- REALTIME SUBSCRIPTIONS
-- ===============================

-- Enable realtime for event stream table
ALTER PUBLICATION supabase_realtime ADD TABLE osa_event_stream;
ALTER PUBLICATION supabase_realtime ADD TABLE osa_service_health;
ALTER PUBLICATION supabase_realtime ADD TABLE osa_circuit_breakers;

-- ===============================
-- INITIAL DATA
-- ===============================

-- Insert default circuit breakers for each service
INSERT INTO osa_circuit_breakers (service_name, circuit_name, state, failure_threshold, timeout_ms) VALUES
    ('ingestion-orchestration', 'opal-api', 'closed', 5, 60000),
    ('strategy-intake', 'form-validation', 'closed', 3, 30000),
    ('recommendation', 'ai-generation', 'closed', 5, 120000),
    ('knowledge-retrieval', 'vector-search', 'closed', 5, 60000),
    ('preferences-policy', 'policy-validation', 'closed', 3, 30000),
    ('conversational-analytics', 'nlp-processing', 'closed', 5, 90000)
ON CONFLICT (service_name) DO NOTHING;

-- Create scheduled job to cleanup old events (if pg_cron is available)
-- SELECT cron.schedule('cleanup-old-events', '0 2 * * *', 'SELECT cleanup_old_events();');

COMMENT ON TABLE osa_event_stream IS 'Central event store for OSA microservices communication';
COMMENT ON TABLE osa_event_subscriptions IS 'Service subscriptions to event types';
COMMENT ON TABLE osa_event_metrics IS 'Event processing metrics and analytics';
COMMENT ON TABLE osa_circuit_breakers IS 'Circuit breaker state for service resilience';
COMMENT ON TABLE osa_service_health IS 'Service health check results and monitoring';