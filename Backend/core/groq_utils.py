import os
import logging
from groq import Groq

logger = logging.getLogger(__name__)

def get_groq_clients(*indices):
    """
    Returns a list of Groq clients based on the requested 1-based indices.
    For example, get_groq_clients(1, 2) returns clients for GROQ_API_KEY_1 and GROQ_API_KEY_2.
    """
    clients = []
    for idx in indices:
        key = os.getenv(f"GROQ_API_KEY_{idx}")
        if key and key.strip():
            try:
                clients.append(Groq(api_key=key.strip()))
            except Exception as e:
                logger.error(f"[GroqUtils] Failed to initialize client for key {idx}: {e}")
    return clients

def execute_with_groq_fallback(clients, model, messages, **kwargs):
    """
    Executes a Groq chat completion with automatic fallback across the provided clients.
    """
    if not clients:
        raise Exception("No Groq clients available for this operation.")
        
    last_error = None
    for i, client in enumerate(clients):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )
            return response
        except Exception as e:
            last_error = e
            logger.warning(f"[GroqUtils] Client {i+1} failed. Error: {e}")
            if i < len(clients) - 1:
                logger.info(f"[GroqUtils] Failing over to backup client...")
                
    raise last_error or Exception("All configured Groq clients failed.")
