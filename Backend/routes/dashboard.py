from fastapi import APIRouter
from typing import Dict, Any

from core.groq_manager import manager

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_metrics() -> Dict[str, Any]:
    """Exposes real-time metrics for the Groq Key Manager."""
    return manager.get_dashboard_metrics()
