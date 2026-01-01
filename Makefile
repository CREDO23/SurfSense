.PHONY: help install dev-install test lint format clean docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install       - Install backend and frontend dependencies"
	@echo "  make dev-install   - Install development dependencies"
	@echo "  make test          - Run all tests"
	@echo "  make lint          - Run linters"
	@echo "  make format        - Format code"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make docker-up     - Start Docker services"
	@echo "  make docker-down   - Stop Docker services"

install:
	@echo "Installing backend dependencies..."
	cd surfsense_backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd surfsense_web && pnpm install

dev-install: install
	@echo "Installing development dependencies..."
	cd surfsense_backend && pip install pytest pytest-asyncio ruff mypy
	cd surfsense_web && pnpm add -D vitest @testing-library/react

test:
	@echo "Running backend tests..."
	cd surfsense_backend && pytest
	@echo "Running frontend tests..."
	cd surfsense_web && pnpm test

lint:
	@echo "Linting backend..."
	cd surfsense_backend && ruff check .
	@echo "Linting frontend..."
	cd surfsense_web && pnpm lint

format:
	@echo "Formatting backend..."
	cd surfsense_backend && ruff format .
	@echo "Formatting frontend..."
	cd surfsense_web && pnpm format

clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	cd surfsense_web && rm -rf .next node_modules/.cache

docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down
