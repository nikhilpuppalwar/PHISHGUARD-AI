from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.meta import AttackType, Dataset, ModelVersion
from app.schemas.meta import AttackTypeOut, DatasetOut, ModelVersionOut

router = APIRouter(tags=["Metadata & System Information"])

@router.get("/attack-types", response_model=List[AttackTypeOut])
def get_attack_types(db: Session = Depends(get_db)):
    """
    FR-18: Attack Type Glossary lookup table.
    """
    return db.query(AttackType).all()

@router.get("/datasets", response_model=List[DatasetOut])
def get_datasets(db: Session = Depends(get_db)):
    """
    Returns inventory of audited training datasets per TRD §6.
    """
    return db.query(Dataset).all()

@router.get("/models", response_model=List[ModelVersionOut])
def get_models(db: Session = Depends(get_db)):
    """
    Returns registered multi-agent ML models with verified evaluation metrics.
    """
    return db.query(ModelVersion).filter(ModelVersion.is_active == True).all()

from pydantic import BaseModel
from app.models.meta import LLMCredential
from app.schemas.meta import (
    LLMProviderInfo, LLMCredentialCreate, LLMCredentialOut,
    LLMTestRequest, LLMTestResponse
)
from app.services.llm_gateway import llm_gateway, PROVIDER_CATALOG
from fastapi import HTTPException

def mask_key(k: str | None) -> str:
    if not k:
        return "None"
    if len(k) <= 8:
        return "********"
    return f"{k[:4]}...{k[-4:]}"

@router.get("/llm/providers", response_model=List[LLMProviderInfo])
def get_llm_providers():
    """
    Returns the catalog of supported multi-model LLM providers:
    Google Gemini, Groq, OpenRouter, Claude, OpenAI, Ollama, Hugging Face.
    """
    res = []
    for pid, pdata in PROVIDER_CATALOG.items():
        res.append(LLMProviderInfo(
            id=pid,
            name=pdata["name"],
            default_model=pdata["default_model"],
            models=pdata["models"],
            requires_key=pdata["requires_key"],
            base_url=pdata.get("base_url"),
            description=pdata["description"]
        ))
    return res

@router.get("/llm/credentials", response_model=List[LLMCredentialOut])
def get_llm_credentials(db: Session = Depends(get_db)):
    """
    Fetch all LLM credentials saved in the database with masked API keys.
    """
    creds = db.query(LLMCredential).order_by(LLMCredential.updated_at.desc()).all()
    out = []
    for c in creds:
        out.append(LLMCredentialOut(
            credential_id=c.credential_id,
            provider=c.provider,
            model_name=c.model_name,
            masked_key=mask_key(c.api_key),
            base_url=c.base_url,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
    return out

@router.post("/llm/credentials", response_model=LLMCredentialOut)
def save_llm_credential(cred_in: LLMCredentialCreate, db: Session = Depends(get_db)):
    """
    Save or update an LLM provider credential in the database.
    If is_active is True, previous credentials can be deactivated so this one becomes primary.
    """
    provider = cred_in.provider.lower().strip()
    
    # Check if credential for this provider already exists
    existing = db.query(LLMCredential).filter(LLMCredential.provider == provider).first()
    
    if cred_in.is_active:
        # Deactivate any currently active credentials
        db.query(LLMCredential).update({LLMCredential.is_active: False})
        
    if existing:
        existing.model_name = cred_in.model_name
        if cred_in.api_key:
            existing.api_key = cred_in.api_key.strip()
        if cred_in.base_url is not None:
            existing.base_url = cred_in.base_url.strip()
        existing.is_active = cred_in.is_active if cred_in.is_active is not None else True
        db.commit()
        db.refresh(existing)
        target = existing
    else:
        target = LLMCredential(
            provider=provider,
            model_name=cred_in.model_name,
            api_key=cred_in.api_key.strip() if cred_in.api_key else None,
            base_url=cred_in.base_url.strip() if cred_in.base_url else None,
            is_active=cred_in.is_active if cred_in.is_active is not None else True
        )
        db.add(target)
        db.commit()
        db.refresh(target)

    # Sync with runtime environment if Gemini or OpenAI
    if provider == "gemini" and target.api_key:
        import os
        from app.config import settings
        settings.GEMINI_API_KEY = target.api_key
        os.environ["GEMINI_API_KEY"] = target.api_key
        try:
            import google.generativeai as genai
            genai.configure(api_key=target.api_key)
        except Exception:
            pass
    elif provider == "openai" and target.api_key:
        import os
        from app.config import settings
        settings.OPENAI_API_KEY = target.api_key
        os.environ["OPENAI_API_KEY"] = target.api_key

    return LLMCredentialOut(
        credential_id=target.credential_id,
        provider=target.provider,
        model_name=target.model_name,
        masked_key=mask_key(target.api_key),
        base_url=target.base_url,
        is_active=target.is_active,
        created_at=target.created_at,
        updated_at=target.updated_at
    )

@router.put("/llm/credentials/{credential_id}/activate", response_model=LLMCredentialOut)
def activate_llm_credential(credential_id: str, db: Session = Depends(get_db)):
    """
    Set specified LLM credential as the active model in the database.
    """
    target = db.query(LLMCredential).filter(LLMCredential.credential_id == credential_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="LLM Credential not found")

    db.query(LLMCredential).update({LLMCredential.is_active: False})
    target.is_active = True
    db.commit()
    db.refresh(target)

    return LLMCredentialOut(
        credential_id=target.credential_id,
        provider=target.provider,
        model_name=target.model_name,
        masked_key=mask_key(target.api_key),
        base_url=target.base_url,
        is_active=target.is_active,
        created_at=target.created_at,
        updated_at=target.updated_at
    )

@router.delete("/llm/credentials/{credential_id}")
def delete_llm_credential(credential_id: str, db: Session = Depends(get_db)):
    """
    Remove an LLM credential from the database.
    """
    target = db.query(LLMCredential).filter(LLMCredential.credential_id == credential_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="LLM Credential not found")
    db.delete(target)
    db.commit()
    return {"status": "deleted", "credential_id": credential_id}

@router.post("/llm/test", response_model=LLMTestResponse)
def test_llm_connection(req: LLMTestRequest, db: Session = Depends(get_db)):
    """
    Test live connectivity and measure latency to the selected LLM provider and model.
    If api_key is empty, looks up saved key in the DB.
    """
    api_key = req.api_key
    if not api_key:
        saved = db.query(LLMCredential).filter(LLMCredential.provider == req.provider.lower()).first()
        if saved and saved.api_key:
            api_key = saved.api_key

    result = llm_gateway.test_connection(
        provider=req.provider,
        model_name=req.model_name,
        api_key=api_key,
        base_url=req.base_url
    )

    return LLMTestResponse(
        success=result.get("success", False),
        provider=req.provider,
        model=req.model_name,
        latency_ms=result.get("latency_ms"),
        response=result.get("response"),
        error=result.get("error")
    )

@router.get("/settings/llm")
def get_llm_status(db: Session = Depends(get_db)):
    active_cred = db.query(LLMCredential).filter(LLMCredential.is_active == True).first()
    return {
        "active_provider": active_cred.provider if active_cred else "offline_deterministic",
        "model_name": active_cred.model_name if active_cred else "Context-Grounded-Pipeline-v2",
        "has_active_key": bool(active_cred and active_cred.api_key) if active_cred else False
    }


