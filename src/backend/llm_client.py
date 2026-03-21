"""Thin async wrapper around the Anthropic Python SDK."""

import asyncio
import logging
import os

from anthropic import AsyncAnthropic, APIError, RateLimitError

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-5")
DEFAULT_MODEL_CHEAP = os.getenv("LLM_MODEL_CHEAP", "claude-haiku-4-5")

MAX_RETRIES = 3
BACKOFF_BASE = 1.0  # seconds


class LLMClient:
    def __init__(self, api_key: str | None = None):
        self.client = AsyncAnthropic(api_key=api_key)
        self.total_usage = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_input_tokens": 0,
            "cache_creation_input_tokens": 0,
        }

    async def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
        max_tokens: int = 250,
        use_cache: bool = True,
    ) -> tuple[str, dict]:
        """
        Call the Anthropic API with optional prompt caching.

        Returns (response_text, usage_dict).
        """
        model = model or DEFAULT_MODEL

        if use_cache:
            system = [
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ]
        else:
            system = system_prompt

        messages = [{"role": "user", "content": user_message}]

        retries = 0
        while True:
            try:
                response = await self.client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    system=system,
                    messages=messages,
                )
                break
            except RateLimitError as e:
                retries += 1
                if retries > MAX_RETRIES:
                    raise
                retry_after = float(
                    getattr(e, "response", None)
                    and e.response.headers.get("retry-after", BACKOFF_BASE * (2 ** (retries - 1)))
                    or BACKOFF_BASE * (2 ** (retries - 1))
                )
                logger.warning(f"Rate limited, retrying in {retry_after}s (attempt {retries}/{MAX_RETRIES})")
                await asyncio.sleep(retry_after)
            except APIError as e:
                if getattr(e, "status_code", None) == 529:
                    # Overloaded — backoff without counting against retry limit
                    wait = BACKOFF_BASE * (2 ** retries)
                    logger.warning(f"API overloaded, backing off {wait}s")
                    await asyncio.sleep(wait)
                    continue
                retries += 1
                if retries > MAX_RETRIES:
                    raise
                wait = BACKOFF_BASE * (2 ** (retries - 1))
                logger.warning(f"API error {e.status_code}, retrying in {wait}s")
                await asyncio.sleep(wait)

        # Extract text
        text = response.content[0].text if response.content else ""

        # Track usage
        usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0) or 0,
            "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
        }
        for key in usage:
            self.total_usage[key] += usage[key]

        logger.debug(
            f"LLM call: model={model} "
            f"in={usage['input_tokens']} out={usage['output_tokens']} "
            f"cache_read={usage['cache_read_input_tokens']} "
            f"cache_write={usage['cache_creation_input_tokens']}"
        )

        return text, usage

    def get_total_usage(self) -> dict:
        return dict(self.total_usage)
