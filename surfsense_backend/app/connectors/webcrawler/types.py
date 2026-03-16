"""Shared types for the webcrawler module."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class PageMetadata:
    source: str
    title: str = ""
    description: str = ""
    author: str = ""
    date: str = ""
    language: str = ""
    image: str = ""

    def to_dict(self) -> dict[str, str]:
        result: dict[str, str] = {"source": self.source}
        if self.title:
            result["title"] = self.title
        if self.description:
            result["description"] = self.description
        if self.author:
            result["author"] = self.author
        if self.date:
            result["date"] = self.date
        if self.language:
            result["language"] = self.language
        if self.image:
            result["image"] = self.image
        result.setdefault("title", self.source)
        return result


@dataclass
class FetchResult:
    content: str
    metadata: PageMetadata
    crawler_type: str
    raw_html: str = ""
    extra_metadata: dict[str, Any] = field(default_factory=dict)

    def to_legacy_dict(self) -> dict[str, Any]:
        meta = self.metadata.to_dict()
        meta.update(self.extra_metadata)
        return {
            "content": self.content,
            "metadata": meta,
            "crawler_type": self.crawler_type,
        }
