"""Enums used throughout the application."""

from enum import Enum


class DocumentType(str, Enum):
    EXTENSION = "EXTENSION"
    CRAWLED_URL = "CRAWLED_URL"
    FILE = "FILE"
    SLACK_CONNECTOR = "SLACK_CONNECTOR"
    NOTION_CONNECTOR = "NOTION_CONNECTOR"
    YOUTUBE_VIDEO = "YOUTUBE_VIDEO"
    GITHUB_CONNECTOR = "GITHUB_CONNECTOR"
    LINEAR_CONNECTOR = "LINEAR_CONNECTOR"
    DISCORD_CONNECTOR = "DISCORD_CONNECTOR"
    JIRA_CONNECTOR = "JIRA_CONNECTOR"
    CONFLUENCE_CONNECTOR = "CONFLUENCE_CONNECTOR"
    CLICKUP_CONNECTOR = "CLICKUP_CONNECTOR"
    GOOGLE_CALENDAR_CONNECTOR = "GOOGLE_CALENDAR_CONNECTOR"
    GOOGLE_GMAIL_CONNECTOR = "GOOGLE_GMAIL_CONNECTOR"
    AIRTABLE_CONNECTOR = "AIRTABLE_CONNECTOR"
    LUMA_CONNECTOR = "LUMA_CONNECTOR"
    ELASTICSEARCH_CONNECTOR = "ELASTICSEARCH_CONNECTOR"
    BOOKSTACK_CONNECTOR = "BOOKSTACK_CONNECTOR"
    NOTE = "NOTE"


class SearchSourceConnectorType(str, Enum):
    SERPER_API = "SERPER_API"  # NOT IMPLEMENTED YET : DON'T REMEMBER WHY : MOST PROBABLY BECAUSE WE NEED TO CRAWL THE RESULTS RETURNED BY IT
    TAVILY_API = "TAVILY_API"
    SEARXNG_API = "SEARXNG_API"
    LINKUP_API = "LINKUP_API"
    BAIDU_SEARCH_API = "BAIDU_SEARCH_API"  # Baidu AI Search API for Chinese web search
    SLACK_CONNECTOR = "SLACK_CONNECTOR"
    NOTION_CONNECTOR = "NOTION_CONNECTOR"
    GITHUB_CONNECTOR = "GITHUB_CONNECTOR"
    LINEAR_CONNECTOR = "LINEAR_CONNECTOR"
    DISCORD_CONNECTOR = "DISCORD_CONNECTOR"
    JIRA_CONNECTOR = "JIRA_CONNECTOR"
    CONFLUENCE_CONNECTOR = "CONFLUENCE_CONNECTOR"
    CLICKUP_CONNECTOR = "CLICKUP_CONNECTOR"
    GOOGLE_CALENDAR_CONNECTOR = "GOOGLE_CALENDAR_CONNECTOR"
    GOOGLE_GMAIL_CONNECTOR = "GOOGLE_GMAIL_CONNECTOR"
    AIRTABLE_CONNECTOR = "AIRTABLE_CONNECTOR"
    LUMA_CONNECTOR = "LUMA_CONNECTOR"
    ELASTICSEARCH_CONNECTOR = "ELASTICSEARCH_CONNECTOR"
    WEBCRAWLER_CONNECTOR = "WEBCRAWLER_CONNECTOR"
    BOOKSTACK_CONNECTOR = "BOOKSTACK_CONNECTOR"


class LiteLLMProvider(str, Enum):
    """Enum for LLM providers supported by LiteLLM."""

    OPENAI = "OPENAI"
    ANTHROPIC = "ANTHROPIC"
    GOOGLE = "GOOGLE"
    AZURE_OPENAI = "AZURE_OPENAI"
    BEDROCK = "BEDROCK"
    VERTEX_AI = "VERTEX_AI"
    GROQ = "GROQ"
    COHERE = "COHERE"
    MISTRAL = "MISTRAL"
    DEEPSEEK = "DEEPSEEK"
    XAI = "XAI"
    OPENROUTER = "OPENROUTER"
    TOGETHER_AI = "TOGETHER_AI"
    FIREWORKS_AI = "FIREWORKS_AI"
    REPLICATE = "REPLICATE"
    PERPLEXITY = "PERPLEXITY"
    OLLAMA = "OLLAMA"
    ALIBABA_QWEN = "ALIBABA_QWEN"
    MOONSHOT = "MOONSHOT"
    ZHIPU = "ZHIPU"
    ANYSCALE = "ANYSCALE"
    DEEPINFRA = "DEEPINFRA"
    CEREBRAS = "CEREBRAS"
    SAMBANOVA = "SAMBANOVA"
    AI21 = "AI21"
    CLOUDFLARE = "CLOUDFLARE"
    DATABRICKS = "DATABRICKS"
    COMETAPI = "COMETAPI"
    HUGGINGFACE = "HUGGINGFACE"
    CUSTOM = "CUSTOM"


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class NewChatMessageRole(str, Enum):
    """Role enum for new chat messages."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Permission(str, Enum):
    """Granular permissions for search space resources.
    Use '*' (FULL_ACCESS) to grant all permissions."""

    # Documents
    DOCUMENTS_CREATE = "documents:create"
    DOCUMENTS_READ = "documents:read"
    DOCUMENTS_UPDATE = "documents:update"
    DOCUMENTS_DELETE = "documents:delete"

    # Chats
    CHATS_CREATE = "chats:create"
    CHATS_READ = "chats:read"
    CHATS_UPDATE = "chats:update"
    CHATS_DELETE = "chats:delete"

    # LLM Configs
    LLM_CONFIGS_CREATE = "llm_configs:create"
    LLM_CONFIGS_READ = "llm_configs:read"
    LLM_CONFIGS_UPDATE = "llm_configs:update"
    LLM_CONFIGS_DELETE = "llm_configs:delete"

    # Podcasts
    PODCASTS_CREATE = "podcasts:create"
    PODCASTS_READ = "podcasts:read"
    PODCASTS_UPDATE = "podcasts:update"
    PODCASTS_DELETE = "podcasts:delete"

    # Connectors
    CONNECTORS_CREATE = "connectors:create"
    CONNECTORS_READ = "connectors:read"
    CONNECTORS_UPDATE = "connectors:update"
    CONNECTORS_DELETE = "connectors:delete"

    # Logs
    LOGS_READ = "logs:read"
    LOGS_DELETE = "logs:delete"

    # Members
    MEMBERS_INVITE = "members:invite"
    MEMBERS_VIEW = "members:view"
    MEMBERS_REMOVE = "members:remove"
    MEMBERS_MANAGE_ROLES = "members:manage_roles"

    # Roles
    ROLES_CREATE = "roles:create"
    ROLES_READ = "roles:read"
    ROLES_UPDATE = "roles:update"
    ROLES_DELETE = "roles:delete"

    # Search Space Settings
    SETTINGS_VIEW = "settings:view"
    SETTINGS_UPDATE = "settings:update"
    SETTINGS_DELETE = "settings:delete"  # Delete the entire search space

    # Full access wildcard
    FULL_ACCESS = "*"


# Predefined role permission sets for convenience
DEFAULT_ROLE_PERMISSIONS = {
    "Owner": [Permission.FULL_ACCESS.value],
    "Admin": [
        # Documents
        Permission.DOCUMENTS_CREATE.value,
        Permission.DOCUMENTS_READ.value,
        Permission.DOCUMENTS_UPDATE.value,
        Permission.DOCUMENTS_DELETE.value,
        # Chats
        Permission.CHATS_CREATE.value,
        Permission.CHATS_READ.value,
        Permission.CHATS_UPDATE.value,
        Permission.CHATS_DELETE.value,
        # LLM Configs
        Permission.LLM_CONFIGS_CREATE.value,
        Permission.LLM_CONFIGS_READ.value,
        Permission.LLM_CONFIGS_UPDATE.value,
        Permission.LLM_CONFIGS_DELETE.value,
        # Podcasts
        Permission.PODCASTS_CREATE.value,
        Permission.PODCASTS_READ.value,
        Permission.PODCASTS_UPDATE.value,
        Permission.PODCASTS_DELETE.value,
        # Connectors
        Permission.CONNECTORS_CREATE.value,
        Permission.CONNECTORS_READ.value,
        Permission.CONNECTORS_UPDATE.value,
        Permission.CONNECTORS_DELETE.value,
        # Logs
        Permission.LOGS_READ.value,
        Permission.LOGS_DELETE.value,
        # Members
        Permission.MEMBERS_INVITE.value,
        Permission.MEMBERS_VIEW.value,
        Permission.MEMBERS_REMOVE.value,
        Permission.MEMBERS_MANAGE_ROLES.value,
        # Roles
        Permission.ROLES_CREATE.value,
        Permission.ROLES_READ.value,
        Permission.ROLES_UPDATE.value,
        Permission.ROLES_DELETE.value,
        # Settings (no delete)
        Permission.SETTINGS_VIEW.value,
        Permission.SETTINGS_UPDATE.value,
    ],
    "Editor": [
        # Documents
        Permission.DOCUMENTS_CREATE.value,
        Permission.DOCUMENTS_READ.value,
        Permission.DOCUMENTS_UPDATE.value,
        Permission.DOCUMENTS_DELETE.value,
        # Chats
        Permission.CHATS_CREATE.value,
        Permission.CHATS_READ.value,
        Permission.CHATS_UPDATE.value,
        Permission.CHATS_DELETE.value,
        # LLM Configs (read only)
        Permission.LLM_CONFIGS_READ.value,
        Permission.LLM_CONFIGS_CREATE.value,
        Permission.LLM_CONFIGS_UPDATE.value,
        # Podcasts
        Permission.PODCASTS_CREATE.value,
        Permission.PODCASTS_READ.value,
        Permission.PODCASTS_UPDATE.value,
        Permission.PODCASTS_DELETE.value,
        # Connectors (full access for editors)
        Permission.CONNECTORS_CREATE.value,
        Permission.CONNECTORS_READ.value,
        Permission.CONNECTORS_UPDATE.value,
        # Logs
        Permission.LOGS_READ.value,
        # Members (view only)
        Permission.MEMBERS_VIEW.value,
        # Roles (read only)
        Permission.ROLES_READ.value,
        # Settings (view only)
        Permission.SETTINGS_VIEW.value,
    ],
    "Viewer": [
        # Documents (read only)
        Permission.DOCUMENTS_READ.value,
        # Chats (read only)
        Permission.CHATS_READ.value,
        # LLM Configs (read only)
        Permission.LLM_CONFIGS_READ.value,
        # Podcasts (read only)
        Permission.PODCASTS_READ.value,
        # Connectors (read only)
        Permission.CONNECTORS_READ.value,
        # Logs (read only)
        Permission.LOGS_READ.value,
        # Members (view only)
        Permission.MEMBERS_VIEW.value,
        # Roles (read only)
        Permission.ROLES_READ.value,
        # Settings (view only)
        Permission.SETTINGS_VIEW.value,
    ],
}


def has_permission(user_permissions: list[str], required_permission: str) -> bool:
    """Check if the user has a specific permission.

    Args:
        user_permissions: List of permission strings the user has
        required_permission: The permission string to check for

    Returns:
        True if user has the permission, False otherwise
    """
    if not user_permissions:
        return False

    # Full access wildcard grants all permissions
    if Permission.FULL_ACCESS.value in user_permissions:
        return True

    return required_permission in user_permissions


def has_any_permission(
    user_permissions: list[str], required_permissions: list[str]
) -> bool:
    """Check if the user has any of the required permissions.

    Args:
        user_permissions: List of permission strings the user has
        required_permissions: List of permission strings to check for (any match)

    Returns:
        True if user has at least one of the permissions, False otherwise
    """
    if not user_permissions:
        return False

    if Permission.FULL_ACCESS.value in user_permissions:
        return True

    return any(perm in user_permissions for perm in required_permissions)


def has_all_permissions(
    user_permissions: list[str], required_permissions: list[str]
) -> bool:
    """Check if the user has all of the required permissions.

    Args:
        user_permissions: List of permission strings the user has
        required_permissions: List of permission strings to check for (all must match)

    Returns:
        True if user has all of the permissions, False otherwise
    """
    if not user_permissions:
        return False

    if Permission.FULL_ACCESS.value in user_permissions:
        return True

    return all(perm in user_permissions for perm in required_permissions)


def get_default_roles_config() -> list[dict]:
    """Get the configuration for default system roles.

    These roles are created automatically when a search space is created.

    Returns:
        List of role configurations with name, description, permissions, and flags
    """
    return [
        {
            "name": "Owner",
            "description": "Full access to all search space resources and settings",
            "permissions": DEFAULT_ROLE_PERMISSIONS["Owner"],
            "is_default": False,
            "is_system_role": True,
        },
        {
            "name": "Admin",
            "description": "Can manage most resources except deleting the search space",
            "permissions": DEFAULT_ROLE_PERMISSIONS["Admin"],
            "is_default": False,
            "is_system_role": True,
        },
        {
            "name": "Editor",
            "description": "Can create and edit documents, chats, and podcasts",
            "permissions": DEFAULT_ROLE_PERMISSIONS["Editor"],
            "is_default": True,  # Default role for new members via invite
            "is_system_role": True,
        },
        {
            "name": "Viewer",
            "description": "Read-only access to search space resources",
            "permissions": DEFAULT_ROLE_PERMISSIONS["Viewer"],
            "is_default": False,
            "is_system_role": True,
        },
    ]
