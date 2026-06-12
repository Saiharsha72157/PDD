import os
import json
import logging
import httpx
from typing import Optional

import jwt
from jwt import algorithms as jwt_algorithms
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# ── Supabase configuration ──────────────────────────────────────────────────
SUPABASE_URL         = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_JWT_SECRET  = os.getenv("SUPABASE_JWT_SECRET", "")

# JWKS cache — fetched once per process and refreshed on verification failure
_jwks_cache: Optional[dict] = None

# ── Security schemes ────────────────────────────────────────────────────────
security          = HTTPBearer(auto_error=True)   # used by protected routes
security_optional = HTTPBearer(auto_error=False)  # used by optional routes


def _fetch_jwks() -> dict:
    """Fetch the Supabase public JWKS and cache it in-process."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        resp = httpx.get(jwks_url, timeout=5)
        resp.raise_for_status()
        data: dict = resp.json()
        _jwks_cache = data
        logger.info("[AUTH] JWKS fetched and cached successfully.")
        return data
    except Exception as e:
        logger.warning(f"[AUTH] JWKS fetch failed ({e}). Will fall back to HS256.")
        return {}


def _verify_token(token: str) -> dict:
    """
    Verify a Supabase JWT.

    Strategy:
      1. Peek at the header to detect algorithm (HS256 or ES256/RS256).
      2. HS256 → verify with SUPABASE_JWT_SECRET directly (fast, no network).
      3. ES256/RS256 → fetch JWKS from Supabase and verify with the matching
         public key.  Retry once on key-miss (JWKS may have rotated).
      4. Reject any token whose algorithm is "none" or unknown.

    Raises HTTPException(401) for all invalid/expired/tampered tokens.
    Raises HTTPException(500) only if the server is misconfigured.
    """
    global _jwks_cache

    # ── Step 1: read header without verifying ──────────────────────────────
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token format.")

    alg = header.get("alg", "")
    kid = header.get("kid", "")

    if alg.lower() == "none":
        raise HTTPException(status_code=401, detail="Token algorithm 'none' is not accepted.")

    # ── Step 2: HS256 — symmetric, use shared secret ──────────────────────
    if alg == "HS256":
        if not SUPABASE_JWT_SECRET:
            logger.error("[AUTH] SUPABASE_JWT_SECRET is not configured.")
            raise HTTPException(status_code=500, detail="Server configuration error.")
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else None,
        )
        return payload

    # ── Step 3: ES256 / RS256 — asymmetric, verify via JWKS ───────────────
    if alg in ("ES256", "RS256"):
        if not SUPABASE_URL:
            logger.error("[AUTH] SUPABASE_URL is not configured; cannot fetch JWKS.")
            raise HTTPException(status_code=500, detail="Server configuration error.")

        def _decode_with_jwks() -> dict:
            global _jwks_cache
            jwks = _fetch_jwks()
            keys = jwks.get("keys", [])

            # Find the matching key by kid if available
            matching_keys = [k for k in keys if not kid or k.get("kid") == kid]
            if not matching_keys:
                matching_keys = keys  # try all keys if kid not found

            last_err: Exception = Exception("No matching public key found in JWKS.")
            for jwk in matching_keys:
                try:
                    # JWKS endpoints only serve public keys; ECAlgorithm.from_jwk() is typed
                    # as PrivateKey|PublicKey but will always be a public key here.
                    public_key = jwt_algorithms.ECAlgorithm.from_jwk(json.dumps(jwk))
                    return jwt.decode(
                        token,
                        public_key,  # type: ignore[arg-type]
                        algorithms=[alg],
                        audience="authenticated",
                        issuer=f"{SUPABASE_URL}/auth/v1",
                    )
                except jwt.InvalidSignatureError as e:
                    last_err = e
                except jwt.ExpiredSignatureError:
                    raise  # let the outer except handle this
                except Exception as e:
                    last_err = e
            raise last_err

        try:
            return _decode_with_jwks()
        except (jwt.InvalidSignatureError, jwt.DecodeError):
            # Key may have rotated — bust cache and retry once
            _jwks_cache = None
            try:
                return _decode_with_jwks()
            except Exception as e:
                logger.error(f"[AUTH] JWKS verification failed after cache refresh: {e}")
                raise HTTPException(status_code=401, detail="Authentication signature is invalid.")

    raise HTTPException(status_code=401, detail=f"Unsupported token algorithm: {alg}.")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    FastAPI dependency — validates the Supabase JWT and returns the user context.
    Used by all protected endpoints.
    """
    token = credentials.credentials
    try:
        payload = _verify_token(token)

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: subject (sub) is missing.")

        return {
            "user_id": user_id,
            "email":   payload.get("email"),
            "role":    payload.get("role", "authenticated"),
        }

    except jwt.ExpiredSignatureError:
        logger.warning("[AUTH] Expired token received.")
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    except jwt.InvalidSignatureError:
        logger.warning("[AUTH] Invalid signature on token.")
        raise HTTPException(status_code=401, detail="Authentication signature is invalid.")
    except jwt.PyJWTError as e:
        logger.warning(f"[AUTH] Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Unexpected authentication error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication failed due to internal error.")


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> dict:
    """
    FastAPI dependency — validates JWT if present, returns anonymous context otherwise.
    Used by endpoints that support both authenticated and guest access.
    """
    if not credentials or not credentials.credentials:
        return {"user_id": "anonymous", "email": None, "role": "anonymous"}
    return get_current_user(credentials)
