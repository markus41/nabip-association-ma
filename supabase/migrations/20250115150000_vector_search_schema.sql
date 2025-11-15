-- =====================================================================================
-- Migration: Vector Search - Semantic Search with pgvector
-- Estimated Hours: 12 hours
-- Description: Enables semantic search across members, events, courses, and documents
--              using PostgreSQL pgvector extension for vector embeddings
-- =====================================================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- Table: embeddings
-- Purpose: Store vector embeddings for semantic search across all content types
-- =====================================================================================
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
    'member_profile', 'event', 'course', 'lesson', 'document', 'faq', 'article'
  )),
  content_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 dimension (1536), adjust based on model
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_content_embedding UNIQUE(content_type, content_id)
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_content_type ON embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_id ON embeddings(content_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100); -- Adjust lists parameter based on dataset size

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON embeddings USING GIN(metadata);

COMMENT ON TABLE embeddings IS 'Vector embeddings for semantic search using pgvector';
COMMENT ON COLUMN embeddings.content_type IS 'Type: member_profile, event, course, lesson, document, faq, article';
COMMENT ON COLUMN embeddings.content_id IS 'Foreign key to source table based on content_type';
COMMENT ON COLUMN embeddings.embedding IS 'Vector embedding (1536 dimensions for OpenAI ada-002)';
COMMENT ON COLUMN embeddings.metadata IS 'JSONB metadata: {title, author, tags, chapter_id, etc.}';

-- =====================================================================================
-- Table: search_queries
-- Purpose: Track user search queries for analytics and query optimization
-- =====================================================================================
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  query_text TEXT NOT NULL,
  query_type VARCHAR(30) NOT NULL CHECK (query_type IN ('keyword', 'semantic', 'hybrid')),
  filters JSONB DEFAULT '{}'::jsonb,
  result_count INTEGER,
  top_result_id UUID,
  top_result_score NUMERIC(5,4),
  search_time_ms INTEGER,
  clicked_result_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_search_queries_member ON search_queries(member_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_type ON search_queries(query_type);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at DESC);

COMMENT ON TABLE search_queries IS 'User search query tracking for analytics and optimization';
COMMENT ON COLUMN search_queries.query_type IS 'keyword (BM25), semantic (vector), hybrid (combined)';
COMMENT ON COLUMN search_queries.filters IS 'Applied filters: {content_type, date_range, chapter_id}';
COMMENT ON COLUMN search_queries.clicked_result_ids IS 'Track which results user clicked for relevance tuning';

-- =====================================================================================
-- Table: search_index
-- Purpose: Full-text search index for keyword-based search (BM25 ranking)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
    'member_profile', 'event', 'course', 'lesson', 'document', 'faq', 'article'
  )),
  content_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  body TEXT,
  tags TEXT[],
  search_vector TSVECTOR, -- PostgreSQL full-text search vector
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_search_index UNIQUE(content_type, content_id)
);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_index_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_index_content_id ON search_index(content_id);
CREATE INDEX IF NOT EXISTS idx_search_index_tags ON search_index USING GIN(tags);

COMMENT ON TABLE search_index IS 'Full-text search index using PostgreSQL tsvector for keyword search';
COMMENT ON COLUMN search_index.search_vector IS 'Tsvector for full-text search with BM25-like ranking';

-- =====================================================================================
-- Triggers: Auto-update search_vector on insert/update
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- =====================================================================================
-- Triggers: Auto-update timestamps
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_vector_search_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW EXECUTE FUNCTION update_vector_search_updated_at();

-- =====================================================================================
-- Helper Functions: Semantic search with vector similarity
-- =====================================================================================

CREATE OR REPLACE FUNCTION semantic_search(
  p_query_embedding VECTOR(1536),
  p_content_types TEXT[] DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold NUMERIC DEFAULT 0.7
)
RETURNS TABLE (
  content_type VARCHAR,
  content_id UUID,
  content_text TEXT,
  similarity_score NUMERIC,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.content_type,
    e.content_id,
    e.content_text,
    ROUND((1 - (e.embedding <=> p_query_embedding))::NUMERIC, 4) AS similarity_score,
    e.metadata
  FROM embeddings e
  WHERE
    (p_content_types IS NULL OR e.content_type = ANY(p_content_types))
    AND (1 - (e.embedding <=> p_query_embedding)) >= p_similarity_threshold
    AND (
      p_filters = '{}'::jsonb
      OR e.metadata @> p_filters -- Metadata must contain all filter keys
    )
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION semantic_search IS 'Vector similarity search using cosine distance (<=> operator)';

-- =====================================================================================
-- Helper Functions: Keyword search with BM25-like ranking
-- =====================================================================================

CREATE OR REPLACE FUNCTION keyword_search(
  p_query TEXT,
  p_content_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  content_type VARCHAR,
  content_id UUID,
  title TEXT,
  description TEXT,
  rank_score NUMERIC,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.content_type,
    si.content_id,
    si.title,
    si.description,
    ROUND(ts_rank_cd(si.search_vector, plainto_tsquery('english', p_query))::NUMERIC, 4) AS rank_score,
    si.metadata
  FROM search_index si
  WHERE
    si.search_vector @@ plainto_tsquery('english', p_query)
    AND (p_content_types IS NULL OR si.content_type = ANY(p_content_types))
  ORDER BY ts_rank_cd(si.search_vector, plainto_tsquery('english', p_query)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION keyword_search IS 'Full-text keyword search with BM25-like ranking using ts_rank_cd';

-- =====================================================================================
-- Helper Functions: Hybrid search (combine keyword + semantic)
-- =====================================================================================

CREATE OR REPLACE FUNCTION hybrid_search(
  p_query TEXT,
  p_query_embedding VECTOR(1536),
  p_content_types TEXT[] DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_limit INTEGER DEFAULT 10,
  p_keyword_weight NUMERIC DEFAULT 0.5,
  p_semantic_weight NUMERIC DEFAULT 0.5
)
RETURNS TABLE (
  content_type VARCHAR,
  content_id UUID,
  title TEXT,
  combined_score NUMERIC,
  keyword_rank NUMERIC,
  semantic_similarity NUMERIC,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH keyword_results AS (
    SELECT
      si.content_type,
      si.content_id,
      si.title,
      ts_rank_cd(si.search_vector, plainto_tsquery('english', p_query)) AS kw_score,
      si.metadata
    FROM search_index si
    WHERE
      si.search_vector @@ plainto_tsquery('english', p_query)
      AND (p_content_types IS NULL OR si.content_type = ANY(p_content_types))
  ),
  semantic_results AS (
    SELECT
      e.content_type,
      e.content_id,
      e.metadata->>'title' AS title,
      (1 - (e.embedding <=> p_query_embedding)) AS sem_score,
      e.metadata
    FROM embeddings e
    WHERE
      (p_content_types IS NULL OR e.content_type = ANY(p_content_types))
      AND (p_filters = '{}'::jsonb OR e.metadata @> p_filters)
  )
  SELECT
    COALESCE(k.content_type, s.content_type) AS content_type,
    COALESCE(k.content_id, s.content_id) AS content_id,
    COALESCE(k.title, s.title) AS title,
    ROUND(
      (COALESCE(k.kw_score, 0) * p_keyword_weight) +
      (COALESCE(s.sem_score, 0) * p_semantic_weight)
    , 4) AS combined_score,
    ROUND(COALESCE(k.kw_score, 0)::NUMERIC, 4) AS keyword_rank,
    ROUND(COALESCE(s.sem_score, 0)::NUMERIC, 4) AS semantic_similarity,
    COALESCE(k.metadata, s.metadata) AS metadata
  FROM keyword_results k
  FULL OUTER JOIN semantic_results s
    ON k.content_type = s.content_type AND k.content_id = s.content_id
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining keyword (BM25) and semantic (vector) scoring';

-- =====================================================================================
-- Helper Functions: Find similar content (recommendations)
-- =====================================================================================

CREATE OR REPLACE FUNCTION find_similar_content(
  p_content_type VARCHAR,
  p_content_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  similar_content_type VARCHAR,
  similar_content_id UUID,
  similarity_score NUMERIC,
  metadata JSONB
) AS $$
DECLARE
  v_embedding VECTOR(1536);
BEGIN
  -- Get embedding of source content
  SELECT embedding INTO v_embedding
  FROM embeddings
  WHERE content_type = p_content_type AND content_id = p_content_id;

  IF v_embedding IS NULL THEN
    RAISE EXCEPTION 'No embedding found for content_type=% content_id=%', p_content_type, p_content_id;
  END IF;

  RETURN QUERY
  SELECT
    e.content_type,
    e.content_id,
    ROUND((1 - (e.embedding <=> v_embedding))::NUMERIC, 4) AS similarity_score,
    e.metadata
  FROM embeddings e
  WHERE
    NOT (e.content_type = p_content_type AND e.content_id = p_content_id)
  ORDER BY e.embedding <=> v_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_similar_content IS 'Find similar content based on vector similarity (for recommendations)';

-- =====================================================================================
-- Helper Functions: Track search query
-- =====================================================================================

CREATE OR REPLACE FUNCTION track_search_query(
  p_member_id UUID,
  p_query_text TEXT,
  p_query_type VARCHAR,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_result_count INTEGER DEFAULT 0,
  p_search_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_query_id UUID;
BEGIN
  INSERT INTO search_queries (
    member_id,
    query_text,
    query_type,
    filters,
    result_count,
    search_time_ms
  ) VALUES (
    p_member_id,
    p_query_text,
    p_query_type,
    p_filters,
    p_result_count,
    p_search_time_ms
  ) RETURNING id INTO v_query_id;

  RETURN v_query_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_search_query IS 'Log search query for analytics and optimization';

-- =====================================================================================
-- RLS Policies: Enable Row Level Security
-- =====================================================================================

ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Embeddings: Readable by all authenticated users (search results)
CREATE POLICY embeddings_select_policy ON embeddings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY embeddings_insert_policy ON embeddings
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY embeddings_update_policy ON embeddings
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY embeddings_delete_policy ON embeddings
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- Search Queries: Members can view their own queries, admins can view all
CREATE POLICY search_queries_select_policy ON search_queries
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY search_queries_insert_policy ON search_queries
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id = auth.uid()::UUID
  );

-- Search Index: Readable by all authenticated users (search results)
CREATE POLICY search_index_select_policy ON search_index
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY search_index_insert_policy ON search_index
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY search_index_update_policy ON search_index
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY search_index_delete_policy ON search_index
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- =====================================================================================
-- Sample Embeddings for Testing (Placeholder - Replace with real embeddings)
-- =====================================================================================

-- Note: In production, embeddings should be generated via OpenAI API or similar
-- This is just a placeholder to demonstrate the structure

-- Example member profile embedding
INSERT INTO embeddings (content_type, content_id, content_text, metadata)
SELECT
  'member_profile',
  m.id,
  CONCAT_WS(' ',
    m.first_name,
    m.last_name,
    m.email,
    m.company,
    m.job_title,
    m.bio,
    ARRAY_TO_STRING(m.specialties, ' ')
  ),
  jsonb_build_object(
    'title', CONCAT(m.first_name, ' ', m.last_name),
    'chapter_id', m.chapter_id,
    'member_type', m.member_type,
    'status', m.status
  )
FROM members m
LIMIT 10
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Example event embedding
INSERT INTO embeddings (content_type, content_id, content_text, metadata)
SELECT
  'event',
  e.id,
  CONCAT_WS(' ',
    e.name,
    e.description,
    e.location,
    e.category
  ),
  jsonb_build_object(
    'title', e.name,
    'chapter_id', e.chapter_id,
    'start_date', e.start_date,
    'category', e.category
  )
FROM events e
LIMIT 10
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Example course embedding
INSERT INTO embeddings (content_type, content_id, content_text, metadata)
SELECT
  'course',
  c.id,
  CONCAT_WS(' ',
    c.title,
    c.description,
    c.category,
    c.instructor_name
  ),
  jsonb_build_object(
    'title', c.title,
    'category', c.category,
    'ce_credits', c.ce_credits,
    'difficulty_level', c.difficulty_level
  )
FROM courses c
LIMIT 10
ON CONFLICT (content_type, content_id) DO NOTHING;

-- =====================================================================================
-- Sample Search Index for Testing
-- =====================================================================================

-- Populate search index for members
INSERT INTO search_index (content_type, content_id, title, description, tags, metadata)
SELECT
  'member_profile',
  m.id,
  CONCAT(m.first_name, ' ', m.last_name),
  CONCAT_WS(' | ', m.company, m.job_title),
  m.specialties,
  jsonb_build_object(
    'chapter_id', m.chapter_id,
    'member_type', m.member_type,
    'status', m.status
  )
FROM members m
LIMIT 100
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Populate search index for events
INSERT INTO search_index (content_type, content_id, title, description, tags, metadata)
SELECT
  'event',
  e.id,
  e.name,
  e.description,
  ARRAY[e.category, e.event_type],
  jsonb_build_object(
    'chapter_id', e.chapter_id,
    'start_date', e.start_date,
    'category', e.category
  )
FROM events e
LIMIT 100
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Populate search index for courses
INSERT INTO search_index (content_type, content_id, title, description, tags, metadata)
SELECT
  'course',
  c.id,
  c.title,
  c.description,
  ARRAY[c.category, c.difficulty_level],
  jsonb_build_object(
    'category', c.category,
    'ce_credits', c.ce_credits,
    'difficulty_level', c.difficulty_level
  )
FROM courses c
LIMIT 100
ON CONFLICT (content_type, content_id) DO NOTHING;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Extension Enabled: vector (pgvector for vector similarity search)
-- Tables Created: 3 (embeddings, search_queries, search_index)
-- Helper Functions: 5 (semantic_search, keyword_search, hybrid_search,
--                      find_similar_content, track_search_query)
-- Triggers: 2 (update_search_vector, update_timestamps)
-- RLS Policies: 12 (content-based access control)
-- Sample Data: Initial embeddings and search index populated
-- =====================================================================================
