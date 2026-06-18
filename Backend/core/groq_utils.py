import logging
from core.groq_manager import manager

logger = logging.getLogger(__name__)

def get_groq_clients(*indices):
    """
    Initializes Groq clients in the manager based on the requested 1-based indices.
    Returns True if at least one key was successfully added.
    """
    manager.add_keys(*indices)
    return len(manager.keys) > 0

async def execute_with_groq_fallback(clients=None, model=None, messages=None, **kwargs):
    """
    Executes a Groq chat completion asynchronously using the GroqKeyManager.
    'clients' argument is ignored but kept for backwards compatibility in function signature
    during the migration.
    """
    if len(manager.keys) == 0:
        raise Exception("No Groq clients available for this operation. Initialize them first.")
        
    return await manager.execute(model=model, messages=messages, **kwargs)
