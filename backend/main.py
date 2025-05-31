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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
