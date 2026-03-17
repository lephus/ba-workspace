"""Payload CMS REST API client.

Handles communication with any Payload CMS instance via its REST API.
Supports both Payload CMS v2 and v3 (Next.js based).
Docs: https://payloadcms.com/docs/rest-api/overview
"""
import logging
from typing import Any, Optional

import requests

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 15  # seconds

# Common/default Payload CMS collection slugs to probe for discovery
_COMMON_SLUGS = [
    "users", "media", "pages", "posts", "categories", "tags",
    "products", "orders", "customers", "forms", "form-submissions",
    "nav", "navigation", "menus", "settings", "globals",
    # Vietnamese / custom common slugs
    "articles", "news", "blogs", "comments", "projects",
]


class PayloadCMSError(Exception):
    """Base error for Payload CMS operations."""
    pass


class PayloadCMSAuthError(PayloadCMSError):
    """Authentication / authorization error (401/403)."""
    pass


class PayloadCMSClient:
    """HTTP client for a Payload CMS instance."""

    def __init__(self, base_url: str, api_key: str = ""):
        self.base_url = base_url.rstrip("/")
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self.session.headers.update(headers)

    # ── helpers ──────────────────────────────────────────────────────────

    def _raw_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Make an HTTP request and return the raw Response object."""
        kwargs.setdefault("timeout", _DEFAULT_TIMEOUT)
        try:
            return self.session.request(method, url, **kwargs)
        except requests.ConnectionError as exc:
            raise PayloadCMSError(f"Không thể kết nối đến {self.base_url}: {exc}") from exc
        except requests.Timeout as exc:
            raise PayloadCMSError(f"Hết thời gian kết nối đến {self.base_url}") from exc

    def _request(self, method: str, url: str, **kwargs) -> dict:
        """Make an HTTP request and return parsed JSON."""
        resp = self._raw_request(method, url, **kwargs)

        if resp.status_code in (401, 403):
            raise PayloadCMSAuthError(
                f"Xác thực thất bại ({resp.status_code}). Kiểm tra lại API key."
            )
        if resp.status_code >= 400:
            detail = resp.text[:300] if resp.text else ""
            raise PayloadCMSError(
                f"Payload CMS trả về lỗi {resp.status_code}: {detail}"
            )

        try:
            return resp.json()
        except ValueError:
            return {"raw": resp.text[:500]}

    def _is_json_response(self, resp: requests.Response) -> bool:
        """Check if the response has a JSON content type."""
        ct = resp.headers.get("Content-Type", "")
        return "application/json" in ct or "text/json" in ct

    # ── public API ───────────────────────────────────────────────────────

    def test_connection(self) -> dict:
        """
        Verify connectivity to the Payload CMS instance.

        Strategy for Payload CMS v3 (Next.js based):
        - GET /api returns an HTML 404 page, so we cannot use it.
        - Instead, we probe GET /api/users?limit=0 which is a default
          collection in every Payload CMS project.
        - If /api/users fails with 404, we try other common endpoints.

        Returns {"ok": True, "collections": [...]} or {"ok": False, "error": "..."}.
        """
        # Strategy 1: try GET /api first (works for Payload v2)
        try:
            resp = self._raw_request("GET", self.api_url)
            if resp.status_code == 200 and self._is_json_response(resp):
                return {"ok": True}
        except PayloadCMSError:
            # Connection failed entirely
            pass

        # Strategy 2: try GET /api/users?limit=0 (default collection in Payload v2 & v3)
        probe_slugs = ["users", "media"]
        for slug in probe_slugs:
            try:
                url = f"{self.api_url}/{slug}"
                resp = self._raw_request("GET", url, params={"limit": 0})

                if resp.status_code in (401, 403):
                    # We reached the CMS but need auth — connection itself works
                    return {
                        "ok": True,
                        "message": f"Kết nối thành công nhưng cần xác thực để truy cập /{slug}.",
                    }

                if resp.status_code == 200 and self._is_json_response(resp):
                    return {"ok": True}

            except PayloadCMSError:
                continue

        # Strategy 3: try the base URL itself to see if the server is reachable
        try:
            resp = self._raw_request("GET", self.base_url)
            if resp.status_code < 500:
                return {
                    "ok": True,
                    "message": (
                        "Server phản hồi nhưng không tìm thấy REST API endpoint mặc định. "
                        "Hãy kiểm tra lại base URL hoặc cấu hình API route của Payload CMS."
                    ),
                }
        except PayloadCMSError as exc:
            return {"ok": False, "error": str(exc)}

        return {
            "ok": False,
            "error": f"Không thể kết nối đến Payload CMS tại {self.base_url}",
        }

    def list_collections(self) -> list[dict]:
        """
        Discover available collections from the Payload CMS instance.

        Strategy:
        1. Try GET /api (works for Payload v2 which returns collection info).
        2. If that returns HTML/404 (Payload v3), probe common collection slugs
           by calling GET /api/{slug}?limit=0 and checking for valid JSON responses.

        Returns a list of {"slug": str, "label": str, "totalDocs": int}.
        """
        collections = []

        # Strategy 1: Try GET /api (Payload v2 style)
        try:
            resp = self._raw_request("GET", self.api_url)
            if resp.status_code == 200 and self._is_json_response(resp):
                try:
                    data = resp.json()
                except ValueError:
                    data = {}

                meta_keys = {"initialized", "user", "message", "errors"}
                if isinstance(data, dict):
                    for key, val in data.items():
                        if key in meta_keys:
                            continue
                        if isinstance(val, dict) and "docs" in val:
                            collections.append({
                                "slug": key,
                                "label": key.replace("-", " ").replace("_", " ").title(),
                                "totalDocs": val.get("totalDocs", 0),
                            })

                    if not collections:
                        for key in data.keys():
                            if key not in meta_keys and isinstance(key, str) and not key.startswith("_"):
                                collections.append({
                                    "slug": key,
                                    "label": key.replace("-", " ").replace("_", " ").title(),
                                })

                if collections:
                    return collections
        except PayloadCMSError:
            pass

        # Strategy 2: Probe common collection slugs (Payload v3)
        logger.info("Probing common collection slugs for Payload CMS v3 discovery...")
        for slug in _COMMON_SLUGS:
            try:
                url = f"{self.api_url}/{slug}"
                resp = self._raw_request("GET", url, params={"limit": 0})

                if resp.status_code == 200 and self._is_json_response(resp):
                    try:
                        data = resp.json()
                    except ValueError:
                        continue

                    if isinstance(data, dict) and "docs" in data:
                        collections.append({
                            "slug": slug,
                            "label": slug.replace("-", " ").replace("_", " ").title(),
                            "totalDocs": data.get("totalDocs", 0),
                        })
                elif resp.status_code in (401, 403):
                    # Collection exists but requires authentication
                    collections.append({
                        "slug": slug,
                        "label": slug.replace("-", " ").replace("_", " ").title(),
                        "totalDocs": -1,  # unknown, needs auth
                    })
            except PayloadCMSError:
                continue

        return collections

    def fetch_collection(
        self,
        slug: str,
        limit: int = 100,
        page: int = 1,
        where: Optional[dict] = None,
    ) -> dict:
        """
        Fetch documents from a collection.

        Calls GET /api/{slug}?limit=N&page=P
        Returns the raw Payload response: { docs: [...], totalDocs, totalPages, ... }
        """
        url = f"{self.api_url}/{slug}"
        params: dict[str, Any] = {"limit": limit, "page": page}
        if where:
            # Payload uses a specific query syntax; pass as-is for flexibility
            params["where"] = where

        return self._request("GET", url, params=params)
