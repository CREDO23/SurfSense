# SurfSense Backend Performance Optimization TODOs

## 🔴 CRITICAL - High Impact Performance Issues

### 1. Database Query Optimization

#### 1.1 N+1 Query Problems
**Location**: `app/routes/search_spaces_routes.py`, `app/routes/documents_routes.py`, `app/routes/new_chat_routes.py`
**Issue**: Multiple endpoints make sequential database queries in loops instead of batch operations
**Impact**: High latency on list endpoints, especially with many records
**TODO**:
- [ ] Add `selectinload()` or `joinedload()` for all relationship queries in search spaces list endpoint
- [ ] Implement eager loading for `SearchSpace` relationships (memberships, roles, LLM configs)
- [ ] Review all document list queries for missing relationship preloading
- [ ] Add database query logging to identify remaining N+1 patterns

**Example Fix Needed**:
```python
# Bad (N+1)
search_spaces = await session.execute(select(SearchSpace))
for space in search_spaces:
    members = await session.execute(select(Member).filter(space_id=space.id))

# Good (Single query)
search_spaces = await session.execute(
    select(SearchSpace).options(selectinload(SearchSpace.memberships))
)
```

#### 1.2 Missing Database Indexes
**Location**: `app/db.py`
**Issue**: Critical columns used in WHERE clauses and JOINs lack proper indexes
**Impact**: Slow queries on filtered endpoints, especially with large datasets
**TODO**:
- [ ] Add composite index on `(search_space_id, document_type)` for Document table
- [ ] Add index on `document_id` for Chunk table (foreign key index)
- [ ] Add composite index on `(search_space_id, archived)` for NewChatThread table
- [ ] Add index on `user_id` for SearchSpaceMembership table
- [ ] Add index on `search_space_id, role_id` composite for SearchSpaceMembership
- [ ] Analyze query patterns and add covering indexes for hot paths

**SQL to Add**:
```sql
CREATE INDEX idx_documents_space_type ON documents(search_space_id, document_type);
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chat_threads_space_archived ON new_chat_threads(search_space_id, archived);
CREATE INDEX idx_membership_user ON search_space_memberships(user_id);
CREATE INDEX idx_membership_space_role ON search_space_memberships(search_space_id, role_id);
```

#### 1.3 Inefficient Full-Text Search
**Location**: `app/retriever/chunks_hybrid_search.py`
**Issue**: Full-text search uses `plainto_tsquery` which doesn't support phrase search or weights
**Impact**: Lower quality search results, slower query execution
**TODO**:
- [ ] Upgrade to `websearch_to_tsquery` for better query parsing
- [ ] Add GIN index with custom configuration for better performance
- [ ] Implement document/chunk ranking weights (title vs content)
- [ ] Add query result caching for common searches
- [ ] Consider using trigram indexes for fuzzy matching

#### 1.4 Large Result Sets Without Pagination
**Location**: `app/routes/search_spaces_routes.py:read_search_spaces()`
**Issue**: Default limit of 200 search spaces loads all memberships and stats
**Impact**: Slow response times for users with many search spaces
**TODO**:
- [ ] Implement cursor-based pagination for search spaces list
- [ ] Add lazy loading option for stats (optional query parameter)
- [ ] Cache member counts in SearchSpace table (denormalized counter)
- [ ] Implement virtual scrolling support in frontend

### 2. Connection Pool Management

#### 2.1 No Connection Pooling Configuration
**Location**: `app/db.py`
**Issue**: Default SQLAlchemy connection pool settings used, no optimization for async workloads
**Impact**: Connection exhaustion under load, slow connection establishment
**TODO**:
- [ ] Configure `pool_size` based on expected concurrent users (start with 20)
- [ ] Set `max_overflow` to handle traffic spikes (suggest 10)
- [ ] Add `pool_pre_ping=True` to handle stale connections
- [ ] Set appropriate `pool_recycle` time (1800 seconds)
- [ ] Monitor connection pool metrics in production

**Example Configuration**:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,
    echo=False
)
```

#### 2.2 NullPool in Celery Tasks
**Location**: `app/tasks/celery_tasks/*.py`
**Issue**: Each Celery task creates a new connection, no connection reuse
**Impact**: High database connection overhead for background tasks
**TODO**:
- [ ] Implement a shared connection pool for Celery workers
- [ ] Use `QueuePool` with limited size instead of `NullPool`
- [ ] Add connection lifecycle management in Celery task base class
- [ ] Monitor database connection count during heavy task processing

### 3. Vector Search Optimization

#### 3.1 Inefficient Hybrid Search Implementation
**Location**: `app/retriever/chunks_hybrid_search.py:hybrid_search_with_rrf()`
**Issue**: Performs 3 separate database queries (semantic, keyword, final join) for each search
**Impact**: 3x database round-trips per search request
**TODO**:
- [ ] Implement hybrid search in a single CTE-based query
- [ ] Use PostgreSQL's native RRF function if available
- [ ] Add query result caching layer (Redis)
- [ ] Consider pre-computing document embeddings for faster similarity search
- [ ] Optimize HNSW index parameters for search space size

#### 3.2 Large Top-K Values
**Location**: `app/agents/new_chat/tools/knowledge_base.py`
**Issue**: Default `top_k=10` per connector, can retrieve 100+ documents
**Impact**: Excessive data transfer, slow reranking, large LLM context
**TODO**:
- [ ] Implement adaptive top_k based on query complexity
- [ ] Add early stopping for RRF when scores drop significantly
- [ ] Limit total documents sent to LLM (max 20-30)
- [ ] Implement document deduplication before reranking

### 4. Caching Strategy

#### 4.1 No Caching Layer
**Location**: Entire backend
**Issue**: No Redis cache for frequent queries (search spaces, user permissions, LLM configs)
**Impact**: Repeated database queries for same data
**TODO**:
- [ ] Implement Redis caching for user permissions (TTL: 5 minutes)
- [ ] Cache search space configurations (TTL: 10 minutes)
- [ ] Cache LLM configurations (TTL: 30 minutes)
- [ ] Add cache invalidation on updates
- [ ] Implement request-level cache for permission checks within same request
- [ ] Cache embedding results for common queries (TTL: 1 hour)

**Example Implementation**:
```python
# Add to app/services/cache_service.py
class CacheService:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def get_user_permissions(self, user_id, search_space_id):
        cache_key = f"permissions:{user_id}:{search_space_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        # ... fetch from DB and cache
```

## 🟡 MEDIUM - Moderate Impact Issues

### 5. API Route Optimization

#### 5.1 Synchronous File Processing
**Location**: `app/routes/documents_routes.py:create_documents_file_upload()`
**Issue**: File validation and initial processing done synchronously before Celery task
**Impact**: Slow API response for large file uploads
**TODO**:
- [ ] Move file validation to Celery task
- [ ] Stream file uploads directly to object storage
- [ ] Return immediate response with task ID for tracking
- [ ] Implement WebSocket notifications for task completion

#### 5.2 Multiple Permission Checks
**Location**: All route handlers
**Issue**: Permission checking makes database queries even with RBAC middleware
**Impact**: Multiple DB round-trips per request
**TODO**:
- [ ] Implement middleware-level permission caching
- [ ] Add request context for permission results
- [ ] Batch permission checks when operating on multiple resources
- [ ] Consider JWT-embedded permissions for read operations

### 6. Service Layer Optimization

#### 6.1 Connector Service Inefficiency
**Location**: `app/services/connector_service.py`
**Issue**: Sequential connector searches instead of parallel execution
**Impact**: Search latency proportional to number of connectors
**TODO**:
- [ ] Use `asyncio.gather()` to search all connectors in parallel
- [ ] Implement timeout per connector (5 seconds)
- [ ] Add circuit breaker for failing connectors
- [ ] Cache connector configurations

**Example Fix**:
```python
# Bad (Sequential)
for connector in connectors:
    results.append(await search_connector(connector))

# Good (Parallel)
tasks = [search_connector(c) for c in connectors]
results = await asyncio.gather(*tasks, return_exceptions=True)
```

#### 6.2 LLM Service Query Reformulation
**Location**: `app/services/query_service.py:reformulate_query_with_chat_history()`
**Issue**: LLM call made for every search, adds 200-500ms latency
**Impact**: Slower search experience, higher LLM costs
**TODO**:
- [ ] Make query reformulation optional (query parameter)
- [ ] Cache reformulated queries (hash of query + history)
- [ ] Implement async processing (reformulate while searching)
- [ ] Add user preference to disable reformulation
- [ ] Consider local small model for query expansion

### 7. Celery Task Optimization

#### 7.1 Event Loop Creation Overhead
**Location**: All Celery tasks in `app/tasks/celery_tasks/`
**Issue**: New event loop created for every task execution
**Impact**: Unnecessary overhead, slower task startup
**TODO**:
- [ ] Reuse event loop in Celery worker processes
- [ ] Implement async task execution pattern
- [ ] Consider using Celery's native async support (Celery 5.3+)
- [ ] Add task result caching for idempotent operations

#### 7.2 No Task Prioritization
**Location**: `app/celery_app.py`
**Issue**: All tasks treated equally, no priority queues
**Impact**: User-facing tasks delayed by bulk operations
**TODO**:
- [ ] Create separate queues: `high_priority`, `default`, `low_priority`
- [ ] Route user-initiated tasks to high priority queue
- [ ] Route bulk indexing to low priority queue
- [ ] Configure worker concurrency per queue

### 8. Embedding Generation

#### 8.1 Synchronous Embedding Model
**Location**: `app/config/__init__.py`
**Issue**: Embedding model not wrapped for async execution
**Impact**: Blocks event loop during embedding generation
**TODO**:
- [ ] Wrap embedding calls with `asyncio.to_thread()`
- [ ] Implement batch embedding for documents with multiple chunks
- [ ] Cache embeddings for unchanged content
- [ ] Consider using dedicated embedding service (separate workers)

## 🟢 LOW - Minor Optimizations

### 9. Memory Management

#### 9.1 Large Payload Serialization
**Location**: `app/routes/new_chat_routes.py`
**Issue**: Large message histories serialized multiple times
**Impact**: High memory usage during chat operations
**TODO**:
- [ ] Implement streaming responses for large chat histories
- [ ] Paginate message history (load on-demand)
- [ ] Compress old messages in storage
- [ ] Add message history pruning (keep last 50 messages)

#### 9.2 Document Content in Memory
**Location**: `app/tasks/document_processors/`
**Issue**: Full document content loaded into memory during processing
**Impact**: High memory usage for large documents (PDFs, videos)
**TODO**:
- [ ] Implement streaming document processing
- [ ] Process documents in chunks rather than all at once
- [ ] Use temporary files for large documents instead of memory
- [ ] Add memory limits per Celery worker

### 10. Monitoring and Observability

#### 10.1 No Performance Metrics
**Location**: Entire application
**Issue**: No instrumentation for query performance, task duration, etc.
**Impact**: Cannot identify performance regressions or bottlenecks
**TODO**:
- [ ] Add OpenTelemetry instrumentation
- [ ] Track database query duration per endpoint
- [ ] Monitor Celery task execution times
- [ ] Add custom metrics for search latency, embedding time
- [ ] Implement request tracing (distributed tracing)
- [ ] Set up performance dashboards (Grafana)

#### 10.2 No Query Performance Logging
**Location**: `app/db.py`
**Issue**: Slow queries not logged or tracked
**Impact**: Performance issues go unnoticed
**TODO**:
- [ ] Enable SQLAlchemy query logging in development
- [ ] Add slow query logging (>1 second)
- [ ] Implement query performance profiling decorator
- [ ] Track P50, P95, P99 latencies per endpoint

## 📋 Implementation Priority

### Phase 1 (Week 1-2): Critical Fixes
1. Add missing database indexes
2. Fix N+1 queries in list endpoints
3. Configure connection pooling
4. Implement basic Redis caching for permissions

### Phase 2 (Week 3-4): Search Optimization
1. Optimize hybrid search to single query
2. Implement parallel connector searches
3. Add embedding result caching
4. Optimize vector index parameters

### Phase 3 (Week 5-6): Task Optimization
1. Add Celery task prioritization
2. Optimize event loop usage in tasks
3. Implement async embedding generation
4. Add task result caching

### Phase 4 (Week 7-8): Monitoring & Refinement
1. Add performance monitoring
2. Implement query performance tracking
3. Set up alerting for slow endpoints
4. Optimize based on production metrics

## 🔧 Quick Wins (Can implement immediately)

1. **Add composite indexes** (5 min): Run SQL migrations for indexes
2. **Enable connection pool pre-ping** (2 min): Add to engine config
3. **Increase default page size limits** (2 min): Reduce to 50 from 200
4. **Add selectinload to search spaces** (15 min): Fix most obvious N+1
5. **Parallel connector search** (30 min): Use asyncio.gather()
6. **Cache LLM configs** (1 hour): Add Redis caching layer

## 📊 Expected Performance Improvements

After implementing all optimizations:
- **List endpoints**: 80-90% faster (500ms → 50-100ms)
- **Search queries**: 60-70% faster (1500ms → 450-600ms)
- **Document upload**: 50% faster (2000ms → 1000ms)
- **Database connections**: 70% reduction (100 → 30 concurrent)
- **Memory usage**: 40% reduction (500MB → 300MB per worker)
- **Cache hit rate**: 60%+ for common queries

## 🧪 Testing Requirements

Before deploying optimizations:
- [ ] Load test with 100+ concurrent users
- [ ] Benchmark search with 10,000+ documents
- [ ] Profile memory usage with large file uploads
- [ ] Test connection pool under sustained load
- [ ] Verify cache invalidation works correctly
- [ ] Test Celery task prioritization under heavy load

