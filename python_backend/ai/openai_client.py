"""OpenAI client for generating JSON responses."""
import os
import json
from typing import TypeVar, Dict, Any
import httpx
from openai import OpenAI

T = TypeVar('T')

# Check if using OpenRouter
raw_key = (os.getenv('OPENAI_API_KEY') or '').strip()
is_openrouter = raw_key.startswith('sk-or-') if raw_key else False
site_url = (os.getenv('OPENROUTER_SITE_URL') or '').strip()
site_title = (os.getenv('OPENROUTER_SITE_TITLE') or '').strip()

# Only create OpenAI client if we have a key and it's not OpenRouter
openai_client = None
if raw_key and not is_openrouter:
    try:
        openai_client = OpenAI(api_key=raw_key)
    except Exception:
        openai_client = None


def default_model() -> str:
    """Get the default model name."""
    return 'openai/gpt-4o' if is_openrouter else 'gpt-4o-mini'


async def generate_json(
    system: str,
    user: str,
    model: str = None,
    temperature: float = 0.6
) -> Dict[str, Any]:
    """
    Generate JSON response from OpenAI or OpenRouter.
    
    Args:
        system: System prompt
        user: User prompt
        model: Model name (optional)
        temperature: Temperature for generation
    
    Returns:
        Parsed JSON response
    """
    model = model or default_model()
    
    if is_openrouter:
        # Use OpenRouter API
        headers = {
            'Authorization': f'Bearer {raw_key}',
            'Content-Type': 'application/json',
        }
        if site_url:
            headers['HTTP-Referer'] = site_url
        if site_title:
            headers['X-Title'] = site_title
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json={
                    'model': model,
                    'messages': [
                        {'role': 'system', 'content': system},
                        {'role': 'user', 'content': user}
                    ],
                    'temperature': temperature,
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            content = data.get('choices', [{}])[0].get('message', {}).get('content', '{}')
            return json.loads(content if isinstance(content, str) else json.dumps(content))
    else:
        # Use OpenAI API (run in thread pool for async compatibility)
        if not openai_client:
            raise ValueError('OPENAI_API_KEY is not set. Add it to your environment.')
        
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        completion = await loop.run_in_executor(
            None,
            lambda: openai_client.chat.completions.create(
                model=model,
                messages=[
                    {'role': 'system', 'content': system},
                    {'role': 'user', 'content': user}
                ],
                response_format={'type': 'json_object'},
                temperature=temperature
            )
        )
        content = completion.choices[0].message.content or '{}'
        return json.loads(content)

