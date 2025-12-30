# 🧪 Comprehensive Test Analysis & Strategy

**Generated**: January 2025  
**Scope**: Complete test coverage plan for SurfSense (Backend + Frontend)  
**Current Coverage**: 0%  
**Target Coverage**: 60-70%  
**Total Tests Required**: ~620 tests

---

## 📊 EXECUTIVE SUMMARY

### Current State
- **Test Coverage**: 0% (No tests exist)
- **Risk Level**: CRITICAL - Refactoring without tests is extremely dangerous
- **Technical Debt**: High - 86,000+ lines of code with zero test coverage

### Recommended Approach
1. **Phase 1** (Weeks 1-2): Infrastructure setup + critical path tests (30% coverage)
2. **Phase 2** (Weeks 3-6): Core feature tests (50% coverage)
3. **Phase 3** (Weeks 7-10): Comprehensive coverage (60% coverage)
4. **Phase 4** (Weeks 11-12): Performance + security tests (70% coverage)

### Test Distribution
```
┌─────────────────────────────────────────┐
│ TEST PYRAMID                            │
├─────────────────────────────────────────┤
│          E2E Tests (5%)                 │
│        ~20 scenarios                    │
│      ╱────────────╲                     │
│     ╱ Integration ╲                     │
│    ╱  Tests (25%)  ╲                    │
│   ╱  ~150 tests     ╲                   │
│  ╱──────────────────╲                   │
│ ╱   Unit Tests (70%)  ╲                 │
│╱      ~450 tests       ╲                │
└─────────────────────────────────────────┘
```

---

## 📋 TABLE OF CONTENTS

1. [Backend Test Specifications](#backend-tests)
   - 1.1 [Unit Tests (250 tests)](#backend-unit)
   - 1.2 [Integration Tests (85 tests)](#backend-integration)
   - 1.3 [E2E Tests (10 scenarios)](#backend-e2e)

2. [Frontend Test Specifications](#frontend-tests)
   - 2.1 [Component Tests (80 tests)](#frontend-components)
   - 2.2 [Hook Tests (30 tests)](#frontend-hooks)
   - 2.3 [Integration Tests (45 tests)](#frontend-integration)
   - 2.4 [E2E Tests (10 scenarios)](#frontend-e2e)

3. [Specialized Tests](#specialized-tests)
   - 3.1 [Performance Tests (15 tests)](#performance-tests)
   - 3.2 [Security Tests (10 tests)](#security-tests)
   - 3.3 [Regression Tests (25 tests)](#regression-tests)

4. [Test Infrastructure](#test-infrastructure)
   - 4.1 [Setup & Configuration](#test-setup)
   - 4.2 [Fixtures & Mocks](#fixtures)
   - 4.3 [CI/CD Integration](#cicd)

---

<a name="backend-tests"></a>
## 🐍 BACKEND TEST SPECIFICATIONS

### Codebase Analysis
- **Total Files**: 124 Python files
- **Total Lines**: 38,253 lines
- **API Endpoints**: 84+ REST endpoints  
- **Services**: 10 service classes
- **Connectors**: 15 external integrations
- **Celery Tasks**: 6 task modules
- **Database Models**: 14 models

<a name="backend-unit"></a>
### 1.1 BACKEND UNIT TESTS (250 tests)

#### Services Layer (178 tests)

##### ConnectorService (app/services/connector_service.py - 2,508 lines)
**Priority**: P0 CRITICAL  
**Estimated Tests**: 65 tests  
**Complexity**: Very High - Giant god class with 40+ methods

**Test Structure**:
```python
# tests/unit/services/test_connector_service.py

import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.services.connector_service import ConnectorService

class TestConnectorServiceGitHub:
    """GitHub connector search functionality"""
    
    @pytest.mark.asyncio
    async def test_github_search_success(self, mock_github_client):
        """
        Test GitHub connector returns properly formatted results
        
        Given: Valid search query and authenticated connector
        When: search_github() is called
        Then: Returns list of SearchResult objects with correct fields
        """
        # Arrange
        mock_github_client.search_code.return_value = [
            {
                "path": "README.md",
                "content": "Test content",
                "repository": {"name": "test-repo", "full_name": "user/test-repo"},
                "html_url": "https://github.com/user/test-repo/blob/main/README.md"
            }
        ]
        service = ConnectorService()
        
        # Act  
        results = await service.search_github(
            query="test query",
            search_space_id=1,
            top_k=10,
            date_from=None,
            date_to=None
        )
        
        # Assert
        assert len(results) == 1
        assert results[0]["title"] == "README.md"
        assert results[0]["source"] == "github"
        assert results[0]["search_space_id"] == 1
        assert "test-repo" in results[0]["description"]
        assert results[0]["url"] == "https://github.com/user/test-repo/blob/main/README.md"
    
    @pytest.mark.asyncio
    async def test_github_search_empty_results(self, mock_github_client):
        """
        Test GitHub connector handles no results gracefully
        
        Given: Search query that returns no matches
        When: search_github() is called  
        Then: Returns empty list without errors
        """
        mock_github_client.search_code.return_value = []
        service = ConnectorService()
        
        results = await service.search_github(
            query="nonexistent_term_12345",
            search_space_id=1,
            top_k=10
        )
        
        assert results == []
        assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_github_search_api_error(self, mock_github_client):
        """
        Test GitHub connector handles API errors
        
        Given: GitHub API throws exception (rate limit, timeout, etc.)
        When: search_github() is called
        Then: Returns empty list and logs error (doesn't propagate exception)
        """
        mock_github_client.search_code.side_effect = Exception("API rate limit exceeded")
        service = ConnectorService()
        
        results = await service.search_github(
            query="test",
            search_space_id=1,
            top_k=10
        )
        
        # Should return empty list on error, not raise
        assert results == []
    
    @pytest.mark.asyncio
    async def test_github_search_date_filtering(self, mock_github_client):
        """
        Test GitHub search respects date range filters
        
        Given: Date range filters (date_from, date_to)
        When: search_github() is called
        Then: Only returns results within date range
        """
        from datetime import datetime, timedelta
        
        date_from = datetime.now() - timedelta(days=30)
        date_to = datetime.now()
        
        mock_github_client.search_code.return_value = [
            {
                "path": "recent.md",
                "updated_at": (datetime.now() - timedelta(days=10)).isoformat(),
                "repository": {"name": "repo"},
                "html_url": "https://github.com/user/repo/blob/main/recent.md"
            }
        ]
        
        service = ConnectorService()
        results = await service.search_github(
            query="test",
            search_space_id=1,
            top_k=10,
            date_from=date_from,
            date_to=date_to
        )
        
        assert len(results) == 1
        # Verify date filtering was applied in API call
        mock_github_client.search_code.assert_called_once()
        call_kwargs = mock_github_client.search_code.call_args[1]
        assert 'created' in call_kwargs or 'pushed' in call_kwargs
```

**All Connector Search Methods to Test** (15 connectors × 4 scenarios = 60 tests):

1. **GitHub** (`search_github`) - 4 tests
   - Success with results
   - Empty results
   - API error handling  
   - Date filtering

2. **Notion** (`search_notion`) - 4 tests
   - Success with pages
   - Success with databases
   - Empty results
   - OAuth token refresh

3. **Slack** (`search_slack`) - 4 tests  
   - Search messages
   - Search files
   - Channel filtering
   - Rate limit handling

4. **Google Drive** (`search_google_drive`) - 4 tests
   - Search documents
   - MIME type filtering
   - Shared drive support
   - Permission checks

5. **Confluence** (`search_confluence`) - 4 tests
6. **Jira** (`search_jira`) - 4 tests
7. **Linear** (`search_linear`) - 4 tests
8. **Airtable** (`search_airtable`) - 4 tests
9. **ClickUp** (`search_clickup`) - 4 tests
10. **Google Calendar** (`search_google_calendar`) - 4 tests
11. **Google Gmail** (`search_google_gmail`) - 4 tests
12. **Luma** (`search_luma`) - 4 tests
13. **Bookstack** (`search_bookstack`) - 4 tests
14. **Figma** (`search_figma`) - 4 tests
15. **Custom Documents** (`search_custom_documents`) - 4 tests

**RRF (Reciprocal Rank Fusion) Tests** (8 tests):
```python
class TestConnectorServiceRRF:
    def test_rrf_single_source(self):
        """
        Test RRF with results from one source
        
        Given: Search results from single connector
        When: apply_rrf() is called
        Then: Returns same results with RRF scores
        """
        pass
    
    def test_rrf_multiple_sources(self):
        """
        Test RRF merges and ranks results from multiple sources
        
        Given: Results from GitHub (3 items) + Notion (2 items)
        When: apply_rrf() is called
        Then: Returns merged list of 5 items ranked by RRF score
        """
        pass
    
    def test_rrf_duplicate_handling(self):
        """
        Test RRF handles duplicate documents across sources
        
        Given: Same document appears in GitHub and Slack
        When: apply_rrf() is called
        Then: Returns single entry with combined score
        """
        pass
    
    def test_rrf_score_calculation(self):
        """
        Test RRF score formula: 1 / (rank + 60)
        
        Given: Results with known ranks
        When: apply_rrf() calculates scores
        Then: Scores match expected formula
        """
        pass
    
    def test_rrf_top_k_limiting(self):
        """
        Test RRF respects top_k parameter
        
        Given: 100 results across connectors, top_k=10
        When: apply_rrf() is called
        Then: Returns only top 10 results
        """
        pass
    
    def test_rrf_empty_results(self):
        """
        Test RRF with no results from any source
        """
        pass
    
    def test_rrf_source_id_counter(self):
        """
        Test source_id increments correctly per source
        
        Given: Results from multiple sources
        When: apply_rrf() assigns source_ids
        Then: Each source gets unique incremental IDs
        """
        pass
    
    def test_rrf_date_filtering(self):
        """
        Test RRF applies date filters before scoring
        
        Given: Results with timestamps, date_from/date_to filters
        When: apply_rrf() is called
        Then: Only results within date range are scored
        """
        pass
```

##### LLMService (app/services/llm_service.py - 14KB)
**Priority**: P0 CRITICAL  
**Estimated Tests**: 18 tests

```python
# tests/unit/services/test_llm_service.py

class TestLLMService:
    @pytest.mark.asyncio
    async def test_get_completion_openai(self, mock_openai_client):
        """
        Test OpenAI completion generation
        
        Given: Valid prompt and OpenAI model config
        When: get_completion() is called
        Then: Returns generated text from OpenAI API
        """
        mock_openai_client.chat.completions.create.return_value = Mock(
            choices=[Mock(message=Mock(content="Test response"))]
        )
        
        service = LLMService()
        result = await service.get_completion(
            prompt="What is AI?",
            model="gpt-4",
            temperature=0.7
        )
        
        assert result == "Test response"
        mock_openai_client.chat.completions.create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_completion_anthropic(self, mock_anthropic_client):
        """Test Anthropic (Claude) completion generation"""
        pass
    
    @pytest.mark.asyncio 
    async def test_get_completion_with_tools(self, mock_openai_client):
        """
        Test completion with function calling/tools
        
        Given: Prompt with available tools
        When: get_completion() is called
        Then: Model can invoke tools and return structured response
        """
        pass
    
    @pytest.mark.asyncio
    async def test_get_completion_streaming(self, mock_openai_client):
        """
        Test streaming completions
        
        Given: Streaming enabled
        When: get_completion() is called
        Then: Yields chunks as they arrive
        """
        pass
    
    @pytest.mark.asyncio
    async def test_get_completion_rate_limit(self, mock_openai_client):
        """
        Test rate limit handling
        
        Given: API returns rate limit error
        When: get_completion() is called
        Then: Retries with exponential backoff
        """
        pass
    
    @pytest.mark.asyncio
    async def test_get_completion_token_limit(self, mock_openai_client):
        """
        Test token limit handling
        
        Given: Prompt exceeds model token limit
        When: get_completion() is called
        Then: Truncates prompt or raises clear error
        """
        pass
    
    @pytest.mark.asyncio
    async def test_get_embedding_openai(self, mock_openai_client):
        """
        Test OpenAI embedding generation
        
        Given: Text input
        When: get_embedding() is called
        Then: Returns vector embedding
        """
        mock_openai_client.embeddings.create.return_value = Mock(
            data=[Mock(embedding=[0.1, 0.2, 0.3, ...])]
        )
        
        service = LLMService()
        result = await service.get_embedding("test text")
        
        assert isinstance(result, list)
        assert len(result) == 1536  # OpenAI embedding dimension
    
    @pytest.mark.asyncio
    async def test_model_fallback(self, mock_openai_client):
        """
        Test fallback to alternative model on failure
        
        Given: Primary model fails
        When: get_completion() is called
        Then: Automatically tries fallback model
        """
        pass
    
    async def test_cost_calculation(self):
        """
        Test token cost calculation
        
        Given: Completion with known token counts
        When: calculate_cost() is called
        Then: Returns accurate cost based on model pricing
        """
        pass
```

##### PageLimitService (app/services/page_limit_service.py - 13KB)
**Priority**: P1  
**Estimated Tests**: 25 tests

```python
# tests/unit/services/test_page_limit_service.py

class TestPageLimitService:
    def test_estimate_pages_pdf(self, sample_pdf_file):
        """
        Test page estimation for PDF files
        
        Given: PDF file with known page count
        When: estimate_pages() is called
        Then: Returns accurate page count
        """
        service = PageLimitService()
        result = service.estimate_pages(sample_pdf_file)
        assert result == 10  # sample_pdf_file has 10 pages
    
    def test_estimate_pages_docx(self, sample_docx_file):
        """
        Test page estimation for Word documents
        
        Given: .docx file
        When: estimate_pages() is called  
        Then: Estimates pages based on word count
        """
        pass
    
    def test_estimate_pages_txt(self, sample_txt_file):
        """
        Test page estimation for text files
        
        Given: Plain text file
        When: estimate_pages() is called
        Then: Estimates pages assuming ~500 words per page
        """
        pass
    
    def test_check_limit_under(self, small_document):
        """
        Test document under page limit passes
        
        Given: Document with 5 pages, limit is 100
        When: check_limit() is called
        Then: Returns True, allows processing
        """
        pass
    
    def test_check_limit_over(self, large_document):
        """
        Test document over page limit is rejected
        
        Given: Document with 200 pages, limit is 100
        When: check_limit() is called
        Then: Returns False, blocks processing
        """
        pass
    
    def test_check_limit_exact(self, document_at_limit):
        """
        Test document exactly at limit
        
        Given: Document with 100 pages, limit is 100
        When: check_limit() is called
        Then: Returns True (inclusive limit)
        """
        pass
```

##### Other Services (70 tests)

**DoclingService** (app/services/docling_service.py - 15 tests):
- Document parsing: PDF, DOCX, PPTX, XLSX
- OCR functionality
- Format conversion
- Error handling for corrupted files

**QueryService** (app/services/query_service.py - 12 tests):
- Query parsing
- Query expansion (synonyms)
- Stop word removal
- Query optimization

**RerankerService** (app/services/reranker_service.py - 10 tests):
- Result reranking with cross-encoder
- Score normalization
- Top-k selection after reranking

**StreamingService** (app/services/new_streaming_service.py - 15 tests):
- SSE (Server-Sent Events) streaming
- Chunking logic
- Connection handling
- Error recovery

**TaskLoggingService** (app/services/task_logging_service.py - 10 tests):
- Log creation
- Log filtering by level
- Log pagination
- Log aggregation

**TTSService** (app/services/kokoro_tts_service.py - 8 tests):
- Text-to-speech generation
- Voice selection
- Audio format conversion

#### Connectors Tests (45 tests)

Each connector needs 3 core tests:

```python
# tests/unit/connectors/test_github_connector.py

class TestGitHubConnector:
    @pytest.mark.asyncio
    async def test_fetch_data_success(self, mock_github_api):
        """
        Test fetching data from GitHub API
        
        Given: Valid OAuth token and repository selection
        When: fetch_repositories() is called
        Then: Returns list of repository data
        """
        pass
    
    @pytest.mark.asyncio
    async def test_oauth_flow(self, mock_oauth_server):
        """
        Test OAuth authorization flow
        
        Given: User initiates GitHub OAuth
        When: Authorization code is exchanged
        Then: Receives and stores access token
        """
        pass
    
    @pytest.mark.asyncio
    async def test_error_handling(self, mock_github_api):
        """
        Test error handling for API failures
        
        Given: GitHub API returns 500 error
        When: fetch_repositories() is called
        Then: Handles gracefully with retry logic
        """
        pass
```

**All Connectors** (15 × 3 = 45 tests):
1. airtable_connector.py
2. bookstack_connector.py
3. clickup_connector.py
4. confluence_connector.py
5. figma_connector.py
6. github_connector.py
7. google_calendar_connector.py
8. google_drive_connector.py
9. google_gmail_connector.py
10. jira_connector.py
11. linear_connector.py
12. luma_connector.py
13. notion_connector.py
14. slack_connector.py
15. (custom document handling)

#### Utilities & Helpers (35 tests)

##### Validators (app/utils/validators.py - 25 tests)
```python
# tests/unit/utils/test_validators.py

def test_validate_connector_config_github_valid():
    """Test valid GitHub connector configuration"""
    config = {
        "type": "github",
        "access_token": "ghp_...",
        "repositories": ["user/repo"]
    }
    result = validate_connector_config(config)
    assert result.is_valid

def test_validate_connector_config_missing_token():
    """Test validation fails for missing access token"""
    config = {"type": "github", "repositories": []}
    result = validate_connector_config(config)
    assert not result.is_valid
    assert "access_token" in result.errors

def test_validate_email_format():
    """Test email validation"""
    assert validate_email("test@example.com") == True
    assert validate_email("invalid-email") == False

def test_validate_url_format():
    """Test URL validation"""
    assert validate_url("https://example.com") == True
    assert validate_url("not-a-url") == False
```

##### Document Converters (10 tests)
- PDF to text extraction
- DOCX to text extraction  
- HTML to Markdown conversion
- Image OCR

#### Database Models Tests (50 tests)

**14 models × ~3-5 tests each = 50 tests**

```python
# tests/unit/models/test_user.py

def test_user_creation(db_session):
    """Test User model creation"""
    user = User(email="test@example.com", hashed_password="hashed")
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.email == "test@example.com"

def test_user_password_hashing():
    """Test password is hashed on creation"""
    user = User(email="test@example.com")
    user.set_password("plaintext_password")
    
    assert user.hashed_password != "plaintext_password"
    assert user.verify_password("plaintext_password") == True

def test_user_email_uniqueness(db_session):
    """Test email constraint is enforced"""
    user1 = User(email="test@example.com", hashed_password="hash1")
    user2 = User(email="test@example.com", hashed_password="hash2")
    
    db_session.add(user1)
    db_session.commit()
    
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
```

**Models to test**:
1. User (5 tests)
2. SearchSpace (5 tests)  
3. Document (5 tests)
4. Chunk (3 tests)
5. SearchSourceConnector (5 tests)
6. ChatThread (4 tests)
7. ChatMessage (4 tests)
8. Membership (4 tests)
9. LLMConfig (4 tests)
10. TaskLog (3 tests)
11. EditorDocument (4 tests)
12. Podcast (3 tests)
13. Note (3 tests)
14. APIKey (3 tests)

#### Agent Tools Tests (40 tests)

##### Knowledge Base Tool (12 tests)
```python
# tests/unit/agents/test_knowledge_base_tool.py

@pytest.mark.asyncio
async def test_search_knowledge_base_with_results(mock_vector_db):
    """
    Test knowledge base search returns relevant documents
    
    Given: Query with matching documents in vector DB
    When: search_knowledge_base() is called
    Then: Returns top-k relevant documents
    """
    pass

@pytest.mark.asyncio
async def test_search_knowledge_base_empty():
    """Test knowledge base search with no results"""
    pass

@pytest.mark.asyncio
async def test_search_knowledge_base_permission_check(mock_rbac):
    """
    Test knowledge base search respects permissions
    
    Given: User without access to certain documents
    When: search_knowledge_base() is called
    Then: Only returns documents user can access
    """
    pass
```

##### Other Tools (28 tests)
- Link Preview Tool (10 tests)
- Scrape Webpage Tool (6 tests)
- Podcast Tool (6 tests)
- Display Image Tool (6 tests)


---

<a name="backend-integration"></a>
### 1.2 BACKEND INTEGRATION TESTS (85 tests)

Integration tests verify that components work together correctly with real database, API clients, and request/response cycles.

#### API Route Tests (60 tests)

**Test Structure**:
```python
# tests/integration/routes/test_search_spaces_routes.py

from fastapi.testclient import TestClient
import pytest

class TestSearchSpacesRoutes:
    def test_create_search_space_success(self, client, auth_headers):
        """
        Integration Test: Create search space
        
        Tests:
        - HTTP POST request handling
        - Request body validation
        - Database persistence
        - Response format
        - Authentication
        """
        response = client.post(
            "/api/v1/search-spaces",
            json={
                "name": "Test Space",
                "description": "Test description"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Space"
        assert "id" in data
        assert "created_at" in data
    
    def test_create_search_space_unauthorized(self, client):
        """Test creating search space without auth fails"""
        response = client.post(
            "/api/v1/search-spaces",
            json={"name": "Test Space"}
        )
        assert response.status_code == 401
    
    def test_create_search_space_invalid_data(self, client, auth_headers):
        """Test validation errors"""
        response = client.post(
            "/api/v1/search-spaces",
            json={"name": ""},  # Empty name
            headers=auth_headers
        )
        assert response.status_code == 422
        assert "name" in response.json()["detail"][0]["loc"]
    
    def test_list_search_spaces(self, client, auth_headers, test_search_spaces):
        """Test listing user's search spaces"""
        response = client.get(
            "/api/v1/search-spaces",
            headers=auth_headers
        )
        assert response.status_code == 200
        spaces = response.json()
        assert isinstance(spaces, list)
        assert len(spaces) >= 1
    
    def test_get_search_space_by_id(self, client, auth_headers, test_search_space):
        """Test retrieving specific search space"""
        response = client.get(
            f"/api/v1/search-spaces/{test_search_space.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_search_space.id
        assert data["name"] == test_search_space.name
    
    def test_update_search_space(self, client, auth_headers, test_search_space):
        """Test updating search space"""
        response = client.put(
            f"/api/v1/search-spaces/{test_search_space.id}",
            json={"name": "Updated Name"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
    
    def test_delete_search_space(self, client, auth_headers, test_search_space):
        """Test deleting search space"""
        response = client.delete(
            f"/api/v1/search-spaces/{test_search_space.id}",
            headers=auth_headers
        )
        assert response.status_code == 204
        
        # Verify deletion
        get_response = client.get(
            f"/api/v1/search-spaces/{test_search_space.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
```

**Complete Route Test Coverage** (84+ endpoints):

**1. search_spaces_routes.py** (8 tests)
- POST /search-spaces - Create
- GET /search-spaces - List  
- GET /search-spaces/{id} - Read
- PUT /search-spaces/{id} - Update
- DELETE /search-spaces/{id} - Delete
- GET /search-spaces/{id}/stats - Statistics
- POST /search-spaces/{id}/search - Search within
- GET /search-spaces/{id}/members - List members

**2. documents_routes.py** (12 tests)  
- POST /documents/upload - File upload (multipart/form-data)
- GET /documents - List with pagination & filters
- GET /documents/{id} - Retrieve single
- PUT /documents/{id} - Update metadata
- DELETE /documents/{id} - Delete
- POST /documents/{id}/reindex - Trigger reindex
- GET /documents/{id}/chunks - Get document chunks
- POST /documents/bulk-upload - Batch upload
- POST /documents/url-import - Import from URL
- GET /documents/{id}/preview - Preview
- GET /documents/stats - Statistics
- POST /documents/search - Search documents

**3. new_chat_routes.py** (10 tests)
- POST /chat/threads - Create thread
- GET /chat/threads - List threads
- GET /chat/threads/{id} - Get thread
- DELETE /chat/threads/{id} - Delete thread
- POST /chat/threads/{id}/messages - Send message
- GET /chat/threads/{id}/messages - List messages
- POST /chat/threads/{id}/stream - Streaming chat (SSE)
- POST /chat/threads/{id}/regenerate - Regenerate response
- PUT /chat/threads/{id}/archive - Archive thread
- GET /chat/threads/{id}/summary - Get summary

**4. rbac_routes.py** (15 tests)
- Team member management
- Role assignment
- Permission checks
- Invitation system

**5. search_source_connectors_routes.py** (20 tests)
- Connector CRUD operations
- OAuth flows for each connector
- Sync status and history

**6. Other Routes** (19 tests)
- logs_routes.py (5 tests)
- editor_routes.py (4 tests)
- podcasts_routes.py (3 tests)
- notes_routes.py (3 tests)
- new_llm_config_routes.py (4 tests)

#### Database Integration Tests (15 tests)

```python
# tests/integration/database/test_relationships.py

import pytest
from sqlalchemy.orm import selectinload

@pytest.mark.asyncio
async def test_user_search_space_relationship(db_session, test_user):
    """
    Test User -> SearchSpace one-to-many relationship
    
    Given: User with multiple search spaces
    When: User.search_spaces is accessed
    Then: All search spaces are loaded correctly
    """
    # Create search spaces
    spaces = [
        SearchSpace(name=f"Space {i}", owner_id=test_user.id)
        for i in range(3)
    ]
    db_session.add_all(spaces)
    db_session.commit()
    
    # Query with relationship loading
    user = db_session.query(User).filter_by(id=test_user.id).first()
    assert len(user.search_spaces) == 3

@pytest.mark.asyncio
async def test_search_space_documents_relationship(db_session, test_search_space):
    """
    Test SearchSpace -> Documents relationship with filters
    
    Given: Search space with documents of different types
    When: Filtering by document type
    Then: Only matching documents are returned
    """
    # Create mixed documents
    docs = [
        Document(title="PDF 1", type="pdf", search_space_id=test_search_space.id),
        Document(title="DOCX 1", type="docx", search_space_id=test_search_space.id),
        Document(title="PDF 2", type="pdf", search_space_id=test_search_space.id)
    ]
    db_session.add_all(docs)
    db_session.commit()
    
    # Query filtered documents
    pdf_docs = db_session.query(Document).filter(
        Document.search_space_id == test_search_space.id,
        Document.type == "pdf"
    ).all()
    
    assert len(pdf_docs) == 2

@pytest.mark.asyncio
async def test_document_chunks_relationship(db_session, test_document):
    """Test Document -> Chunks one-to-many relationship"""
    pass

@pytest.mark.asyncio
async def test_cascade_delete_search_space(db_session, test_search_space):
    """
    Test CASCADE delete behavior
    
    Given: Search space with related documents, connectors, threads
    When: Search space is deleted
    Then: All related entities are also deleted
    """
    # Create related entities
    doc = Document(title="Test", search_space_id=test_search_space.id)
    connector = SearchSourceConnector(
        type="github",
        search_space_id=test_search_space.id
    )
    db_session.add_all([doc, connector])
    db_session.commit()
    
    # Delete search space
    db_session.delete(test_search_space)
    db_session.commit()
    
    # Verify cascade deletion
    assert db_session.query(Document).filter_by(id=doc.id).first() is None
    assert db_session.query(SearchSourceConnector).filter_by(id=connector.id).first() is None

@pytest.mark.asyncio
async def test_membership_permissions(db_session, test_user, test_search_space):
    """
    Test membership role and permissions
    
    Given: User with specific role in search space
    When: Permission check is performed
    Then: Correct permissions are returned
    """
    pass
```

#### Celery Task Integration Tests (10 tests)

```python
# tests/integration/tasks/test_celery_tasks.py

import pytest
from app.tasks.celery_tasks.documents_tasks import index_document
from app.tasks.celery_tasks.connector_tasks import sync_connector

def test_index_document_task(celery_app, celery_worker, test_document):
    """
    Test document indexing Celery task
    
    Given: Uploaded document
    When: index_document task is triggered
    Then: Document is chunked and embedded
    """
    result = index_document.apply_async(args=[test_document.id])
    
    # Wait for task completion
    assert result.get(timeout=10) == "success"
    
    # Verify chunks were created
    chunks = db_session.query(Chunk).filter_by(document_id=test_document.id).all()
    assert len(chunks) > 0

def test_sync_connector_task(celery_app, celery_worker, test_connector):
    """
    Test connector sync Celery task
    
    Given: GitHub connector
    When: sync_connector task is triggered
    Then: Repositories are synced and indexed
    """
    pass

def test_generate_podcast_task(celery_app, celery_worker, test_thread):
    """Test podcast generation task"""
    pass

def test_task_retry_on_failure(celery_app, celery_worker, test_document):
    """
    Test task retry logic
    
    Given: Task that fails initially
    When: Task is executed
    Then: Retries with exponential backoff
    """
    pass
```

---

<a name="backend-e2e"></a>
### 1.3 BACKEND E2E TEST SCENARIOS (10 scenarios)

```python
# tests/e2e/test_document_lifecycle.py

import pytest
import time

@pytest.mark.e2e
@pytest.mark.slow
async def test_complete_document_lifecycle(client, auth_headers, db_session):
    """
    E2E Test: Complete Document Lifecycle
    
    Scenario:
    1. User creates search space
    2. User uploads PDF document  
    3. System indexes document (Celery task)
    4. System creates embeddings
    5. User searches for content
    6. System returns relevant chunks
    7. User views document details
    8. User deletes document
    
    This tests the entire document flow from upload to deletion.
    """
    # Step 1: Create search space
    response = client.post(
        "/api/v1/search-spaces",
        json={"name": "E2E Test Space"},
        headers=auth_headers
    )
    assert response.status_code == 201
    search_space_id = response.json()["id"]
    
    # Step 2: Upload document
    with open("tests/fixtures/test-document.pdf", "rb") as f:
        response = client.post(
            f"/api/v1/search-spaces/{search_space_id}/documents/upload",
            files={"file": ("test-document.pdf", f, "application/pdf")},
            headers=auth_headers
        )
    assert response.status_code == 201
    document_id = response.json()["id"]
    
    # Step 3-4: Wait for indexing (Celery task)
    max_wait = 30  # seconds
    start_time = time.time()
    indexed = False
    
    while time.time() - start_time < max_wait:
        response = client.get(
            f"/api/v1/documents/{document_id}",
            headers=auth_headers
        )
        if response.json()["status"] == "indexed":
            indexed = True
            break
        time.sleep(1)
    
    assert indexed, "Document indexing timed out"
    
    # Step 5: Search for content
    response = client.post(
        f"/api/v1/search-spaces/{search_space_id}/search",
        json={"query": "test content"},
        headers=auth_headers
    )
    assert response.status_code == 200
    search_results = response.json()
    
    # Step 6: Verify relevant chunks returned
    assert len(search_results["results"]) > 0
    assert any(r["document_id"] == document_id for r in search_results["results"])
    
    # Step 7: View document details
    response = client.get(
        f"/api/v1/documents/{document_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["id"] == document_id
    
    # Step 8: Delete document
    response = client.delete(
        f"/api/v1/documents/{document_id}",
        headers=auth_headers
    )
    assert response.status_code == 204


@pytest.mark.e2e
async def test_complete_chat_flow(client, auth_headers, test_search_space):
    """
    E2E Test: Chat Conversation Flow
    
    Scenario:
    1. User creates chat thread
    2. User sends message with question
    3. System searches knowledge base
    4. System generates AI response
    5. User receives streaming response
    6. System stores message history
    7. User sends follow-up message
    8. System uses conversation context
    """
    # Step 1: Create chat thread
    response = client.post(
        f"/api/v1/chat/threads",
        json={
            "search_space_id": test_search_space.id,
            "title": "Test Chat"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    thread_id = response.json()["id"]
    
    # Step 2-5: Send message and receive streaming response
    response = client.post(
        f"/api/v1/chat/threads/{thread_id}/stream",
        json={"content": "What is AI?"},
        headers=auth_headers,
        stream=True
    )
    assert response.status_code == 200
    
    # Collect streaming chunks
    chunks = []
    for line in response.iter_lines():
        if line:
            chunks.append(line.decode('utf-8'))
    
    assert len(chunks) > 0
    
    # Step 6: Verify message history
    response = client.get(
        f"/api/v1/chat/threads/{thread_id}/messages",
        headers=auth_headers
    )
    assert response.status_code == 200
    messages = response.json()
    assert len(messages) >= 2  # User message + AI response
    
    # Step 7-8: Send follow-up using context
    response = client.post(
        f"/api/v1/chat/threads/{thread_id}/messages",
        json={"content": "Can you explain more?"},
        headers=auth_headers
    )
    assert response.status_code == 201


@pytest.mark.e2e  
@pytest.mark.slow
async def test_connector_oauth_and_sync(client, auth_headers, test_search_space, mock_github_oauth):
    """
    E2E Test: Add GitHub Connector -> OAuth -> Sync Repos
    
    Scenario:
    1. User initiates GitHub connector
    2. User completes OAuth authorization
    3. System stores credentials securely
    4. User selects repositories to sync
    5. System syncs repository data (Celery task)
    6. User searches GitHub content
    7. Results include GitHub repositories
    """
    # Implementation depends on OAuth mock setup
    pass
```

**Complete E2E Scenarios List**:
1. ✅ Document upload lifecycle
2. ✅ Chat conversation flow
3. ✅ Connector OAuth and sync
4. Team invitation and collaboration
5. Search space management
6. Podcast generation
7. Document editor usage
8. Multi-connector search
9. Permission management
10. User registration to first search


---

<a name="frontend-tests"></a>
## 🎨 FRONTEND TEST SPECIFICATIONS

### Codebase Analysis  
- **Total Files**: 281 TypeScript/React files
- **Total Lines**: ~48,000 lines
- **Pages**: 48 Next.js pages
- **Components**: 150+ React components
- **Custom Hooks**: 9 hooks
- **API Services**: 13 service classes

<a name="frontend-components"></a>
### 2.1 FRONTEND COMPONENT TESTS (80 tests)

#### Test Infrastructure Setup

```typescript
// tests/setup.ts
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

#### Large Components Requiring Splitting + Testing

##### Team Management Page (Currently 1,472 lines - MUST SPLIT FIRST)
**Priority**: P0  
**After splitting into components, estimated**: 15 tests

```typescript
// After refactoring, test the split components:

// tests/components/team/MembersList.test.tsx
import { render, screen } from '@testing-library/react'
import { MembersList } from '@/components/team/MembersList'

describe('MembersList Component', () => {
  it('renders list of team members', () => {
    const members = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'member' }
    ]
    
    render(<MembersList members={members} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })
  
  it('displays member roles correctly', () => {
    const members = [
      { id: 1, name: 'John Doe', role: 'admin' }
    ]
    
    render(<MembersList members={members} />)
    
    expect(screen.getByText('admin')).toBeInTheDocument()
  })
  
  it('handles empty member list', () => {
    render(<MembersList members={[]} />)
    
    expect(screen.getByText(/no members/i)).toBeInTheDocument()
  })
  
  it('shows loading state', () => {
    render(<MembersList members={[]} loading={true} />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})


// tests/components/team/RoleManager.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoleManager } from '@/components/team/RoleManager'

describe('RoleManager Component', () => {
  it('allows admin to change member role', async () => {
    const mockOnRoleChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <RoleManager
        member={{ id: 1, name: 'John', role: 'member' }}
        currentUserRole="admin"
        onRoleChange={mockOnRoleChange}
      />
    )
    
    const roleSelect = screen.getByRole('combobox')
    await user.click(roleSelect)
    await user.click(screen.getByText('Admin'))
    
    await waitFor(() => {
      expect(mockOnRoleChange).toHaveBeenCalledWith(1, 'admin')
    })
  })
  
  it('prevents non-admin from changing roles', () => {
    render(
      <RoleManager
        member={{ id: 1, name: 'John', role: 'member' }}
        currentUserRole="member"
        onRoleChange={vi.fn()}
      />
    )
    
    const roleSelect = screen.queryByRole('combobox')
    expect(roleSelect).toBeDisabled()
  })
})


// tests/components/team/InvitesPanel.test.tsx
describe('InvitesPanel Component', () => {
  it('sends team invitation', async () => {
    // Test invitation flow
  })
  
  it('validates email format', async () => {
    // Test email validation
  })
  
  it('shows pending invitations', () => {
    // Test pending invites display
  })
})
```

##### Logs Page (Currently 1,231 lines - MUST SPLIT FIRST)
**Priority**: P0 (Has bug to fix)  
**After splitting, estimated**: 12 tests

```typescript
// tests/components/logs/LogsTable.test.tsx
import { render, screen } from '@testing-library/react'
import { LogsTable } from '@/components/logs/LogsTable'

describe('LogsTable Component', () => {
  it('renders logs data in table', () => {
    const logs = [
      { id: 1, message: 'Test log', level: 'info', timestamp: new Date() },
      { id: 2, message: 'Error log', level: 'error', timestamp: new Date() }
    ]
    
    render(<LogsTable logs={logs} />)
    
    expect(screen.getByText('Test log')).toBeInTheDocument()
    expect(screen.getByText('Error log')).toBeInTheDocument()
  })
  
  it('REGRESSION: handles pagination correctly with >5 items', async () => {
    // This test validates the bug fix for hardcoded limit: 5
    const logs = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      message: `Log ${i}`,
      level: 'info',
      timestamp: new Date()
    }))
    
    render(<LogsTable logs={logs} pageSize={20} />)
    
    // Should show all 20 logs (not just 5)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(21) // 20 data rows + 1 header row
  })
  
  it('filters logs by level', async () => {
    const user = userEvent.setup()
    const logs = [
      { id: 1, message: 'Info log', level: 'info', timestamp: new Date() },
      { id: 2, message: 'Error log', level: 'error', timestamp: new Date() }
    ]
    
    render(<LogsTable logs={logs} />)
    
    const levelFilter = screen.getByLabelText(/filter by level/i)
    await user.click(levelFilter)
    await user.click(screen.getByText('Error'))
    
    expect(screen.queryByText('Info log')).not.toBeInTheDocument()
    expect(screen.getByText('Error log')).toBeInTheDocument()
  })
  
  it('sorts logs by timestamp', async () => {
    // Test sorting functionality
  })
})


// tests/components/logs/LogsFilters.test.tsx
describe('LogsFilters Component', () => {
  it('applies date range filter', async () => {
    // Test date filtering
  })
  
  it('applies search filter', async () => {
    // Test search
  })
})


// tests/components/logs/LogDetailsModal.test.tsx
describe('LogDetailsModal Component', () => {
  it('displays full log details', () => {
    // Test modal content
  })
  
  it('closes on escape key', async () => {
    // Test keyboard interaction
  })
})
```

##### Chat Interface (Currently 923 lines)
**Priority**: P0  
**Estimated**: 10 tests

```typescript
// tests/components/chat/ChatInterface.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '@/app/dashboard/[search_space_id]/new-chat/[[...chat_id]]/page'

describe('ChatInterface Component', () => {
  it('renders message input', () => {
    render(<ChatInterface threadId={1} />)
    
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })
  
  it('sends message on submit', async () => {
    const mockSendMessage = vi.fn()
    const user = userEvent.setup()
    
    render(<ChatInterface threadId={1} onSendMessage={mockSendMessage} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello AI')
    await user.click(screen.getByRole('button', { name: /send/i }))
    
    expect(mockSendMessage).toHaveBeenCalledWith('Hello AI')
  })
  
  it('displays message history', () => {
    const messages = [
      { id: 1, role: 'user', content: 'Hello' },
      { id: 2, role: 'assistant', content: 'Hi there!' }
    ]
    
    render(<ChatInterface threadId={1} messages={messages} />)
    
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })
  
  it('displays streaming response', async () => {
    // Mock SSE streaming
    const mockEventSource = {
      addEventListener: vi.fn(),
      close: vi.fn()
    }
    global.EventSource = vi.fn(() => mockEventSource) as any
    
    render(<ChatInterface threadId={1} />)
    
    // Simulate streaming chunks
    const onMessage = mockEventSource.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    onMessage?.({ data: JSON.stringify({ content: 'Hello' }) })
    onMessage?.({ data: JSON.stringify({ content: ' world' }) })
    
    await waitFor(() => {
      expect(screen.getByText(/Hello world/)).toBeInTheDocument()
    })
  })
  
  it('disables input while waiting for response', async () => {
    const user = userEvent.setup()
    
    render(<ChatInterface threadId={1} isLoading={true} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })
})
```

#### Other Component Tests (43 tests)

**Connector Forms** (15 tests after refactoring to generic component):
```typescript
// tests/components/connectors/ConnectorFormWizard.test.tsx

describe('ConnectorFormWizard Component', () => {
  it('renders form for GitHub connector', () => {
    render(<ConnectorFormWizard type="github" />)
    expect(screen.getByLabelText(/repository/i)).toBeInTheDocument()
  })
  
  it('validates required fields', async () => {
    // Test validation
  })
  
  it('submits form successfully', async () => {
    // Test submission
  })
  
  it('handles OAuth flow', async () => {
    // Test OAuth redirect
  })
})
```

**Document Upload** (5 tests):
- File selection
- Upload progress
- Error handling
- File type validation
- Multi-file upload

**Search Interface** (5 tests):
- Query input
- Search results display
- Pagination
- Filters
- Empty state

**Navigation/Sidebar** (8 tests):
- Menu items
- Active state
- Collapse/expand
- User menu
- Search space switcher

**Modals/Dialogs** (10 tests):
- Open/close
- Form submission
- Keyboard navigation
- Click outside to close
- Confirmation dialogs

---

<a name="frontend-hooks"></a>
### 2.2 CUSTOM HOOKS TESTS (30 tests)

#### useConnectorEditPage Hook (Currently 672 lines - MUST SPLIT)
**Priority**: P0  
**After splitting, estimated**: 12 tests

```typescript
// After refactoring into focused hooks:

// tests/hooks/useConnectorForm.test.ts
import { renderHook, act } from '@testing-library/react'
import { useConnectorForm } from '@/hooks/use-connector-form'

describe('useConnectorForm Hook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useConnectorForm('github'))
    
    expect(result.current.formData).toEqual({
      name: '',
      type: 'github',
      config: {}
    })
  })
  
  it('validates form data', () => {
    const { result } = renderHook(() => useConnectorForm('github'))
    
    act(() => {
      result.current.setFormData({ name: '', type: 'github' })
    })
    
    expect(result.current.errors).toContain('Name is required')
  })
  
  it('submits form successfully', async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ success: true })
    const { result } = renderHook(() => 
      useConnectorForm('github', { onSubmit: mockSubmit })
    )
    
    act(() => {
      result.current.setFormData({
        name: 'My GitHub',
        type: 'github',
        config: { repositories: ['user/repo'] }
      })
    })
    
    await act(async () => {
      await result.current.submit()
    })
    
    expect(mockSubmit).toHaveBeenCalled()
    expect(result.current.isSubmitting).toBe(false)
  })
  
  it('handles submission errors', async () => {
    const mockSubmit = vi.fn().mockRejectedValue(new Error('API Error'))
    const { result } = renderHook(() => 
      useConnectorForm('github', { onSubmit: mockSubmit })
    )
    
    await act(async () => {
      try {
        await result.current.submit()
      } catch {}
    })
    
    expect(result.current.error).toBe('API Error')
  })
})
```

#### useLogs Hook (Currently 163 lines - HAS BUG)
**Priority**: P0 CRITICAL  
**Estimated**: 8 tests

```typescript
// tests/hooks/useLogs.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useLogs } from '@/hooks/use-logs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useLogs Hook', () => {
  it('fetches logs with default pagination', async () => {
    const { result } = renderHook(() => useLogs(1), { wrapper: createWrapper() })
    
    await waitFor(() => {
      expect(result.current.logs).toBeDefined()
      expect(result.current.logs.length).toBeGreaterThan(0)
    })
  })
  
  it('REGRESSION: fetches more than 5 logs', async () => {
    // This test validates the bug fix for hardcoded limit: 5
    const { result } = renderHook(
      () => useLogs(1, {}, { skip: 0, limit: 20 }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      // After bug fix, should be able to fetch 20 logs
      expect(result.current.logs.length).toBeGreaterThanOrEqual(5)
      expect(result.current.logs.length).toBeLessThanOrEqual(20)
    })
  })
  
  it('handles pagination correctly', async () => {
    const { result, rerender } = renderHook(
      ({ page }) => useLogs(1, {}, { skip: page * 20, limit: 20 }),
      { wrapper: createWrapper(), initialProps: { page: 0 } }
    )
    
    await waitFor(() => expect(result.current.logs).toBeDefined())
    const firstPageLogs = result.current.logs
    
    // Load second page
    rerender({ page: 1 })
    
    await waitFor(() => {
      expect(result.current.logs).not.toEqual(firstPageLogs)
    })
  })
  
  it('filters logs by level', async () => {
    const { result } = renderHook(
      () => useLogs(1, { level: 'error' }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      result.current.logs?.forEach(log => {
        expect(log.level).toBe('error')
      })
    })
  })
  
  it('filters logs by date range', async () => {
    const dateFrom = new Date('2024-01-01')
    const dateTo = new Date('2024-12-31')
    
    const { result } = renderHook(
      () => useLogs(1, { dateFrom, dateTo }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      result.current.logs?.forEach(log => {
        const logDate = new Date(log.timestamp)
        expect(logDate >= dateFrom && logDate <= dateTo).toBe(true)
      })
    })
  })
  
  it('handles loading state', () => {
    const { result } = renderHook(
      () => useLogs(1),
      { wrapper: createWrapper() }
    )
    
    expect(result.current.loading).toBe(true)
  })
  
  it('handles error state', async () => {
    // Mock API error
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    
    const { result } = renderHook(
      () => useLogs(1),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
  
  it('refreshes logs on demand', async () => {
    const { result } = renderHook(
      () => useLogs(1),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => expect(result.current.logs).toBeDefined())
    
    await act(async () => {
      await result.current.refreshLogs()
    })
    
    expect(result.current.logs).toBeDefined()
  })
})
```

#### Other Hooks (10 tests)

**useSearchSourceConnectors** (339 lines - 5 tests):
```typescript
describe('useSearchSourceConnectors Hook', () => {
  it('fetches connectors for search space', async () => {})  
  it('creates new connector', async () => {})
  it('updates connector', async () => {})
  it('deletes connector', async () => {})
  it('handles errors', async () => {})
})
```

**useChat** (5 tests):
- Send message
- Load history
- Streaming response
- Error handling
- Typing indicator

