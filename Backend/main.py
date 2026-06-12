import os
import re
import logging
from typing import Dict, Any, Optional

from dotenv import load_dotenv
load_dotenv()

import matplotlib
matplotlib.use("Agg")  # Must be set before importing pyplot — required for headless Linux servers

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.ratelimit import limiter
from services.datasets import DatasetService
from services.auth import get_current_user

# Import all routers
from routes import paraphrase_router, analytics_router, llm_router, support_router

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── Environment detection ────────────────────────────────────────────────────
_env = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
IS_PRODUCTION = _env == "production"

# ── CORS origins ─────────────────────────────────────────────────────────────
# In production, restrict to known frontends.
# Set ALLOWED_ORIGINS env var as comma-separated list, e.g.:
#   ALLOWED_ORIGINS=https://app.researchmateai.com,https://researchmateai.vercel.app
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if IS_PRODUCTION and _allowed_origins_env:
    ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
else:
    # Development: allow everything. Production without ALLOWED_ORIGINS set
    # falls back to a warning + permissive list (intentional for initial deploy).
    if IS_PRODUCTION:
        logger.warning(
            "[CORS] Running in production without ALLOWED_ORIGINS set. "
            "Defaulting to permissive CORS. Set ALLOWED_ORIGINS to restrict."
        )
    ALLOWED_ORIGINS = ["*"]

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="ResearchMateAI Backend",
    version="1.0.0",
    # Disable Swagger / OpenAPI in production to reduce attack surface
    docs_url    =None if IS_PRODUCTION else "/docs",
    redoc_url   =None if IS_PRODUCTION else "/redoc",
    openapi_url =None if IS_PRODUCTION else "/openapi.json",
)

# ── Rate limiter (SlowAPI) ────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# ── CORS middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     =ALLOWED_ORIGINS,
    allow_credentials =True,
    allow_methods     =["*"],
    allow_headers     =["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(paraphrase_router, tags=["Paraphrase"])
app.include_router(analytics_router,  tags=["Analytics"])
app.include_router(llm_router,        tags=["LLM Tools"])
app.include_router(support_router,    tags=["Support"])

# ── Static routes ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "healthy", "service": "running"}


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "ResearchMateAI Backend is running"}


# ── Dataset Search ─────────────────────────────────────────────────────────────
dataset_service = DatasetService()

@app.get("/search-datasets")
@limiter.limit("10/minute")
def search_datasets(
    request: Request,
    query: Optional[str] = "ai",
    provider: Optional[str] = "kaggle",
    page: Optional[int] = 1,
    limit: Optional[int] = 20,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter cannot be empty.")

    # Basic sanitization: reject obviously malicious query strings
    if not re.match(r'^[\w\s\-\.]{1,100}$', query.strip()):
        raise HTTPException(status_code=400, detail="Invalid query format.")

    try:
        results = dataset_service.search_all(
            query    =query.strip(),
            provider =provider or "kaggle",
            page     =page or 1,
            limit    =limit or 20,
        )
        return results
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"[Backend] Error searching datasets: {e}")
        raise HTTPException(status_code=503, detail=f"Error searching datasets: {str(e)}")


# ── Startup event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    env_label = "PRODUCTION" if IS_PRODUCTION else "DEVELOPMENT"
    docs_info = "disabled" if IS_PRODUCTION else "enabled at /docs"
    logger.info(f"[Startup] Environment : {env_label}")
    logger.info(f"[Startup] Swagger UI  : {docs_info}")
    logger.info(f"[Startup] CORS origins: {ALLOWED_ORIGINS}")
    logger.info("[Startup] Application startup complete.")
