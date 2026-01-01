"""Redis cache configuration for query result caching."""
from __future__ import annotations

import logging
from functools import wraps
from typing import Any, Callable

from app.utils.redis_client import get_redis_client

logger = logging.getLogger(__name__)

# Cache TTL configurations (in seconds)
CACHE_TTL_SEARCH_RESULTS = 300  # 5 minutes
CACHE_TTL_PERMISSIONS = 600  # 10 minutes
CACHE_TTL_LLM_CONFIGS = 1800  # 30 minutes
CACHE_TTL_USER_PROFILE = 900  # 15 minutes


def cache_result(key_prefix: str, ttl: int = 300):
    """Decorator to cache function results in Redis.
    
    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Generate cache key from function args
            cache_key = f"{key_prefix}:{str(args)}:{str(kwargs)}"
            
            try:
                client = get_redis_client()
                cached = client.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit: {cache_key}")
                    return cached
            except Exception as e:
                logger.warning(f"Cache read failed: {e}")
            
            # Execute function
            result = await func(*args, **kwargs)
            
            try:
                client = get_redis_client()
                client.setex(cache_key, ttl, result)
                logger.debug(f"Cache set: {cache_key}")
            except Exception as e:
                logger.warning(f"Cache write failed: {e}")
            
            return result
        return wrapper
    return decorator


def invalidate_cache(key_pattern: str) -> None:
    """Invalidate cache keys matching pattern.
    
    Args:
        key_pattern: Pattern to match keys (e.g., 'search:123:*')
    """
    try:
        client = get_redis_client()
        keys = client.keys(key_pattern)
        if keys:
            client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys")
    except Exception as e:
        logger.error(f"Cache invalidation failed: {e}")
