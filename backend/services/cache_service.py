import redis
import json
import os
from functools import wraps
from flask import request, jsonify

class CacheService:
    def __init__(self):
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        try:
            self.client = redis.from_url(redis_url)
            self.client.ping()
            self.enabled = True
        except Exception as e:
            print(f"Redis not available: {e}. Caching disabled.")
            self.enabled = False

    def get(self, key: str):
        if not self.enabled: return None
        data = self.client.get(key)
        return json.loads(data) if data else None

    def set(self, key: str, value: Any, timeout: int = 3600):
        if not self.enabled: return
        self.client.setex(key, timeout, json.dumps(value))

def cached_stock_data(timeout=3600):
    cache = CacheService()
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not cache.enabled:
                return f(*args, **kwargs)
            
            # Use symbol as cache key
            symbol = kwargs.get('symbol', '').upper()
            if not symbol:
                return f(*args, **kwargs)

            # Check for nocache bypass
            if request.args.get('nocache') == 'true':
                return f(*args, **kwargs)

            # Determine dynamic timeout based on request path
            current_timeout = timeout
            if "benchmarks" in request.path:
                current_timeout = 86400  # 24 hours
            
            cache_key = f"stock_analysis:{symbol}:{current_timeout}"
            cached_val = cache.get(cache_key)
            
            if cached_val:
                return jsonify(cached_val), 200
            
            response = f(*args, **kwargs)
            
            if isinstance(response, tuple):
                data, status = response
                if status == 200:
                    cache.set(cache_key, data, current_timeout)
            
            return response
        return decorated_function
    return decorator
