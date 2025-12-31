"""Meta-scheduler task that checks for connectors needing periodic indexing."""

import logging

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.celery_app import celery_app
from app.config import config
from app.services.connector import ScheduleCheckerService

logger = logging.getLogger(__name__)


def get_celery_session_maker():
    """Create async session maker for Celery tasks."""
    engine = create_async_engine(
        config.DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )
    return async_sessionmaker(engine, expire_on_commit=False)


@celery_app.task(name="check_periodic_schedules")
def check_periodic_schedules_task():
    """
    Check all connectors for periodic indexing that's due.
    This task runs every minute and triggers indexing for any connector
    whose next_scheduled_at time has passed.
    """
    import asyncio

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(_check_and_trigger_schedules())
    finally:
        loop.close()


async def _check_and_trigger_schedules():
    """Check database for connectors that need indexing and trigger their tasks."""
    async with get_celery_session_maker()() as session:
        await ScheduleCheckerService.check_and_trigger_schedules(session)
