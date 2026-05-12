from fastapi import APIRouter
from pydantic import BaseModel
import chromadb
import os
from learn.content import CONDITIONS, get_rag_chunks
from voice.llm import chat

router = APIRouter(prefix="/learn", tags=["learn"])

# ── ChromaDB setup ────────────────────────────────────────────────────────────

CHROMA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'chroma')
_client = None
_collection = None

def get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection
    _client = chromadb.PersistentClient(path=CHROMA_PATH)
    _collection = _client.get_or_create_collection(
        name="mindpath_learn",
        metadata={"hnsw:space": "cosine"},
    )
    # Seed if empty
    if _collection.count() == 0:
        chunks = get_rag_chunks()
        _collection.add(
            documents=[c["text"] for c in chunks],
            ids=[c["id"] for c in chunks],
            metadatas=[{"condition": c["condition"], "source": c["source"]} for c in chunks],
        )
    return _collection


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/conditions")
def list_conditions():
    return {"conditions": [
        {k: v for k, v in c.items() if k != "symptoms" and k != "treatments"}
        for c in CONDITIONS
    ]}

@router.get("/conditions/{condition_id}")
def get_condition(condition_id: str):
    cond = next((c for c in CONDITIONS if c["id"] == condition_id), None)
    if not cond:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Condition not found")
    return cond


class AskRequest(BaseModel):
    question: str
    condition_id: str | None = None

@router.post("/ask")
async def ask(req: AskRequest):
    collection = get_collection()

    # Search for relevant chunks
    where = {"condition": req.condition_id} if req.condition_id else None
    results = collection.query(
        query_texts=[req.question],
        n_results=4,
        where=where,
    )

    docs = results["documents"][0] if results["documents"] else []
    sources = [m["source"] for m in results["metadatas"][0]] if results["metadatas"] else []

    if not docs:
        return {
            "answer": "I don't have information on that. Please consult a licensed mental health professional.",
            "source": None,
        }

    context = "\n\n".join(docs)
    source = sources[0] if sources else "NIMH / APA"

    prompt = f"""You are a mental health education assistant for MindPath. Your answers are grounded in NIMH and APA clinical guidelines.

Use the context below as your primary source. You may supplement with general clinical knowledge about mental health that aligns with NIMH and APA guidelines, but do not speculate or give personal medical advice.

Keep answers warm, clear, and concise (3-5 sentences). Always recommend professional help for personal concerns. Never diagnose.

Context from NIMH/APA guidelines:
{context}

Question: {req.question}

Answer:"""

    answer = await chat([{"role": "user", "content": prompt}])

    return {
        "answer": answer or "I could not find a clear answer. Please consult a mental health professional.",
        "source": source,
    }
