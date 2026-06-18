import os
import time
import asyncio
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from collections import OrderedDict
from groq import AsyncGroq

logger = logging.getLogger(__name__)

@dataclass
class KeyStats:
    key_id: int
    client: AsyncGroq
    usage_count: int = 0
    failure_count: int = 0
    active_requests: int = 0
    is_healthy: bool = True
    cooldown_until: float = 0.0
    consecutive_failures: int = 0

class QueueFullException(Exception):
    pass

class GroqKeyManager:
    def __init__(self, max_queue_size: int = 200, cache_ttl_seconds: int = 3600):
        self.keys: Dict[int, KeyStats] = {}
        self.max_queue_size = max_queue_size
        self.semaphore = asyncio.Semaphore(1) # Strict concurrency to model dual-key processing
        self.request_queue = asyncio.Queue(maxsize=max_queue_size)
        
        # Cache: OrderedDict mapping cache_key (str) -> (timestamp, response_data)
        self.cache: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self.max_cache_size = 1000
        self.cache_ttl = cache_ttl_seconds
        
        # Cache Stampede Protection
        self.in_flight: Dict[str, asyncio.Event] = {}
        self.in_flight_results: Dict[str, Any] = {}
        
        # Global Metrics
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_response_time_ms": 0.0,
            "start_time": time.time(),
            "cache_hits": 0,
            "cache_misses": 0,
            "queue_dropped": 0,
            "peak_queue_size": 0,
            "rate_limits_hit": 0
        }
        
        self._lock = asyncio.Lock()
        
    def add_keys(self, *indices: int):
        """Initializes AsyncGroq clients from env variables."""
        for idx in indices:
            key_val = os.getenv(f"GROQ_API_KEY_{idx}")
            if key_val and key_val.strip():
                try:
                    client = AsyncGroq(api_key=key_val.strip())
                    self.keys[idx] = KeyStats(key_id=idx, client=client)
                    logger.info(f"[GroqManager] Added Key {idx} successfully.")
                except Exception as e:
                    logger.error(f"[GroqManager] Failed to init Key {idx}: {e}")

    async def get_healthy_key(self) -> Optional[KeyStats]:
        """Finds the healthy key with the fewest active requests."""
        async with self._lock:
            now = time.time()
            best_key = None
            min_active = float('inf')
            
            for ks in self.keys.values():
                # Recover keys from cooldown if time passed
                if not ks.is_healthy and now > ks.cooldown_until:
                    ks.is_healthy = True
                    logger.info(f"[GroqManager] Key {ks.key_id} recovered from cooldown.")

                if ks.is_healthy:
                    if ks.active_requests < min_active:
                        min_active = ks.active_requests
                        best_key = ks
                        
            return best_key

    def _mark_key_unhealthy(self, ks: KeyStats, base_cooldown: float = 10.0):
        ks.is_healthy = False
        ks.failure_count += 1
        ks.consecutive_failures += 1
        
        # Exponential backoff: base_cooldown * 2^(consecutive_failures - 1), max 300s
        cooldown_seconds = min(300.0, base_cooldown * (2 ** (ks.consecutive_failures - 1)))
        ks.cooldown_until = time.time() + cooldown_seconds
        
        logger.warning(f"[GroqManager] Key {ks.key_id} marked UNHEALTHY. Cooldown for {cooldown_seconds}s (failure #{ks.consecutive_failures}).")

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Returns metrics for the monitoring dashboard."""
        now = time.time()
        elapsed = now - self.metrics["start_time"]
        total = self.metrics["total_requests"]
        rps = total / elapsed if elapsed > 0 else 0.0
        avg_rt = self.metrics["total_response_time_ms"] / total if total > 0 else 0.0
        
        key_status = []
        for ks in self.keys.values():
            key_status.append({
                "key_id": ks.key_id,
                "healthy": ks.is_healthy,
                "active_requests": ks.active_requests,
                "usage_count": ks.usage_count,
                "failure_count": ks.failure_count,
                "cooldown_remaining": max(0.0, ks.cooldown_until - now) if not ks.is_healthy else 0.0
            })
            
        return {
            "global": {
                "total_requests": total,
                "successful_requests": self.metrics["successful_requests"],
                "failed_requests": self.metrics["failed_requests"],
                "rate_limits_hit": self.metrics["rate_limits_hit"],
                "cache_hits": self.metrics["cache_hits"],
                "cache_misses": self.metrics["cache_misses"],
                "queue_size": self.request_queue.qsize(),
                "peak_queue_size": self.metrics["peak_queue_size"],
                "queue_dropped": self.metrics["queue_dropped"],
                "rps": round(rps, 2),
                "avg_response_time_ms": round(avg_rt, 2)
            },
            "keys": key_status
        }

    def _generate_cache_key(self, model: str, messages: List[Dict[str, str]], **kwargs) -> str:
        """Simple string representation for caching."""
        import json
        key_data = {
            "model": model,
            "messages": messages,
            "kwargs": {k: v for k, v in kwargs.items() if k not in ["clients"]}
        }
        return json.dumps(key_data, sort_keys=True)

    async def execute(self, model: str, messages: List[Dict[str, str]], bypass_cache: bool = False, **kwargs) -> Any:
        """Executes a Groq call with queueing, caching, and smart load balancing."""
        self.metrics["total_requests"] += 1
        start_time = time.time()
        
        # 1. Check Cache
        cache_key = self._generate_cache_key(model, messages, **kwargs)
        if not bypass_cache:
            if cache_key in self.cache:
                timestamp, response = self.cache[cache_key]
                if time.time() - timestamp < self.cache_ttl:
                    self.cache.move_to_end(cache_key)
                    self.metrics["cache_hits"] += 1
                    self.metrics["successful_requests"] += 1
                    self.metrics["total_response_time_ms"] += (time.time() - start_time) * 1000
                    return response
                else:
                    del self.cache[cache_key] # Expired
            
            # Cache Stampede Protection: Wait if someone else is already fetching this exact request
            async with self._lock:
                if cache_key in self.in_flight:
                    event = self.in_flight[cache_key]
                    wait_for_flight = True
                else:
                    event = asyncio.Event()
                    self.in_flight[cache_key] = event
                    wait_for_flight = False

            if wait_for_flight:
                await event.wait()
                self.metrics["cache_hits"] += 1
                self.metrics["successful_requests"] += 1
                self.metrics["total_response_time_ms"] += (time.time() - start_time) * 1000
                return self.in_flight_results.get(cache_key)

            self.metrics["cache_misses"] += 1
                    
        # 2. Queueing (Wait for a slot if under high load)
        if self.request_queue.full():
            self.metrics["failed_requests"] += 1
            self.metrics["queue_dropped"] += 1
            raise QueueFullException("Server is currently overloaded. Request queue is full.")
            
        await self.request_queue.put(1) # Add to queue
        self.metrics["peak_queue_size"] = max(self.metrics["peak_queue_size"], self.request_queue.qsize())
        
        try:
            # 3. Semaphore limit & Execution
            async with self.semaphore:
                # Retry logic for failover
                max_retries = len(self.keys)
                last_error = None
                
                for attempt in range(max_retries):
                    ks = await self.get_healthy_key()
                    if not ks:
                        # Wait briefly and try again if all keys are in cooldown
                        await asyncio.sleep(1.0 * (attempt + 1))
                        continue
                        
                    async with self._lock:
                        ks.active_requests += 1
                        
                    try:
                        response = await ks.client.chat.completions.create(
                            model=model,
                            messages=messages,
                            **kwargs
                        )
                        
                        # Success
                        async with self._lock:
                            ks.active_requests -= 1
                            ks.usage_count += 1
                            ks.consecutive_failures = 0
                            
                        self.metrics["successful_requests"] += 1
                        self.metrics["total_response_time_ms"] += (time.time() - start_time) * 1000
                        
                        # Update cache
                        if not bypass_cache:
                            self.cache[cache_key] = (time.time(), response)
                            self.cache.move_to_end(cache_key)
                            if len(self.cache) > self.max_cache_size:
                                self.cache.popitem(last=False)
                            self.in_flight_results[cache_key] = response
                            async with self._lock:
                                if cache_key in self.in_flight:
                                    self.in_flight[cache_key].set()
                                    del self.in_flight[cache_key]
                            
                        return response
                        
                    except Exception as e:
                        # Failure (e.g. Rate Limit 429)
                        async with self._lock:
                            ks.active_requests -= 1
                            
                        error_msg = str(e).lower()
                        if "429" in error_msg or "rate limit" in error_msg:
                            self.metrics["rate_limits_hit"] += 1
                            self._mark_key_unhealthy(ks, base_cooldown=5.0) # Start with 5s for 429
                        else:
                            self._mark_key_unhealthy(ks, base_cooldown=10.0)
                            
                        last_error = e
                        logger.warning(f"[GroqManager] Key {ks.key_id} failed on attempt {attempt+1}. Error: {e}")
                        
                # If we exit the loop, all retries failed
                self.metrics["failed_requests"] += 1
                if not bypass_cache:
                    async with self._lock:
                        if cache_key in self.in_flight:
                            self.in_flight_results[cache_key] = None
                            self.in_flight[cache_key].set()
                            del self.in_flight[cache_key]
                raise last_error or Exception("All available Groq keys failed or are in cooldown.")
                
        finally:
            self.request_queue.get_nowait()
            self.request_queue.task_done()

# Singleton instance
manager = GroqKeyManager(max_queue_size=200)
