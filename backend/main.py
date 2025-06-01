import os, yaml
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from together_open_deep_research import OpenDeepResearch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResearchRequest(BaseModel):
    topic: str

class FollowUpRequest(BaseModel):
    question: str
    originalTopic: str = None
    originalReport: str = None

with open("configs/open_deep_researcher_config.yaml") as f:
    config = yaml.safe_load(f)

os.environ["TOGETHER_API_KEY"] = config["together_api_key"]

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/research")
async def research(req: ResearchRequest):
    try:
        logger.info(f"Received research request for topic: {req.topic}")
        rdr = OpenDeepResearch(config=config, serverless_only=True)
        logger.info("OpenDeepResearch instance created")
        report = rdr.run(req.topic)
        logger.info("Research completed successfully")
        return {"report": report}
    except Exception as e:
        logger.error(f"Error processing research request: {str(e)}")
        raise HTTPException(500, detail=str(e))

@app.post("/api/follow-up")
async def follow_up(req: FollowUpRequest):
    try:
        logger.info(f"Received follow-up request: {req.question}")
        
        if not req.originalReport:
            logger.warning("No original report provided for context")
            raise HTTPException(400, detail="No original report provided for context")
        
        # Create a prompt for the follow-up question
        prompt = f"""You are an AI research assistant. You previously conducted research on the topic: "{req.originalTopic}".
Based on the research report below, answer the follow-up question as thoroughly as possible.

ORIGINAL RESEARCH REPORT:
{req.originalReport}

FOLLOW-UP QUESTION:
{req.question}

Please provide a detailed answer to the follow-up question based ONLY on the information in the original research report.
"""
        
        # Use the same model as the research to answer the follow-up
        rdr = OpenDeepResearch(config=config, serverless_only=True)
        
        # Get answer to follow-up question
        answer = rdr.get_follow_up_answer(prompt)
        
        logger.info("Follow-up question answered successfully")
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error processing follow-up request: {str(e)}")
        raise HTTPException(500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
