# Environment Variables

This document lists all environment variables used in the SurfSense application.

## Docker Compose Variables

### Database (PostgreSQL with pgvector)
- `POSTGRES_PORT` - PostgreSQL port (default: 5432)
- `POSTGRES_USER` - Database user (default: postgres)
- `POSTGRES_PASSWORD` - Database password (default: postgres)
- `POSTGRES_DB` - Database name (default: surfsense)

### PgAdmin
- `PGADMIN_PORT` - PgAdmin web interface port (default: 5050)
- `PGADMIN_DEFAULT_EMAIL` - Admin email (default: admin@surfsense.com)
- `PGADMIN_DEFAULT_PASSWORD` - Admin password (default: surfsense)

### Redis
- `REDIS_PORT` - Redis port (default: 6379)

### Backend
- `BACKEND_PORT` - Backend API port (default: 8000)
- `DATABASE_URL` - Full database connection URL (auto-generated from POSTGRES_* vars)
- `CELERY_BROKER_URL` - Celery message broker URL (auto-generated from REDIS_PORT)
- `CELERY_RESULT_BACKEND` - Celery results backend URL (auto-generated from REDIS_PORT)
- `EMBEDDING_MODEL` - Sentence transformer model for embeddings (required)
- `LANGCHAIN_TRACING_V2` - Enable LangChain tracing (default: false)
- `LANGSMITH_TRACING` - Enable LangSmith tracing (default: false)

### Frontend
- `FRONTEND_PORT` - Frontend web port (default: 3000)
- `NEXT_PUBLIC_FASTAPI_BACKEND_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_FASTAPI_BACKEND_AUTH_TYPE` - Authentication type (default: LOCAL)
- `NEXT_PUBLIC_ETL_SERVICE` - Document processing service (default: DOCLING)

### Celery Services (Optional - commented out by default)
- `FLOWER_PORT` - Flower monitoring UI port (default: 5555)

## Backend .env File

See `surfsense_backend/.env.example` for backend-specific variables including:
- OAuth credentials (Google, GitHub, Slack, etc.)
- LLM API keys (OpenAI, Anthropic, etc.)
- Document processing settings
- Security settings

## Frontend .env File

See `surfsense_web/.env.example` for frontend-specific variables including:
- Public API URLs
- Feature flags
- Analytics keys
