import os, yaml
import logging
import sys
import time
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from research_orchestrator import ResearchOrchestrator
from stable_diffusion_image_generator import StableDiffusionGenerator
from fastapi.responses import JSONResponse
import torch
from typing import Dict, Any
import atexit

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set CUDA environment variables for stable performance
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
os.environ["CUDA_VISIBLE_DEVICES"] = "0"
os.environ["TORCH_CUDNN_V8_API_ENABLED"] = "1"  # Enable CUDNN v8 API for better performance

# Ensure proper CUDA loading by setting these early
if hasattr(torch, 'cuda') and hasattr(torch.cuda, 'empty_cache'):
    try:
        torch.cuda.empty_cache()
        logger.info("Cleared CUDA cache at startup")
    except Exception as e:
        logger.warning(f"Could not clear CUDA cache: {str(e)}")

# Register cleanup function to clear CUDA cache on exit
def cleanup_resources():
    logger.info("Cleaning up resources before shutdown...")
    if hasattr(torch, 'cuda') and hasattr(torch.cuda, 'empty_cache'):
        try:
            torch.cuda.empty_cache()
            logger.info("Cleared CUDA cache before exit")
        except Exception as e:
            logger.warning(f"Could not clear CUDA cache: {str(e)}")

atexit.register(cleanup_resources)

# Check CUDA availability and log detailed information
def check_cuda_availability():
    logger.info("Checking CUDA availability...")
    
    # Print PyTorch version info
    logger.info(f"PyTorch version: {torch.__version__}")
    
    if torch.cuda.is_available():
        cuda_version = torch.version.cuda
        device_count = torch.cuda.device_count()
        device_names = [torch.cuda.get_device_name(i) for i in range(device_count)]
        
        logger.info(f"CUDA is available: version {cuda_version}")
        logger.info(f"Found {device_count} CUDA device(s): {', '.join(device_names)}")
        
        # Test CUDA with a small operation
        try:
            x = torch.randn(5, 5).cuda()
            y = torch.randn(5, 5).cuda()
            z = x @ y
            logger.info("CUDA test operation successful")
            return True
        except Exception as e:
            logger.error(f"CUDA test operation failed: {str(e)}")
            return False
    else:
        logger.warning("CUDA is not available")
        logger.info("Environment variables:")
        for key, value in os.environ.items():
            if "CUDA" in key or "TORCH" in key:
                logger.info(f"  {key}={value}")
        return False

# Check CUDA on startup
cuda_available = check_cuda_availability()

class ResearchRequest(BaseModel):
    topic: str
    fast_mode: bool = False  # Default to comprehensive mode for detailed research

class FollowUpRequest(BaseModel):
    question: str
    original_research: Dict[str, Any]

# Load configuration
with open("configs/open_deep_researcher_config.yaml") as f:
    config = yaml.safe_load(f)

class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = None
    height: int = 512
    width: int = 512
    num_inference_steps: int = 30
    guidance_scale: float = 7.5

class PromptRefinementRequest(BaseModel):
    prompt: str

# Initialize research orchestrator
orchestrator = ResearchOrchestrator()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "*"  # Allow all origins for testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize resources on server startup"""
    logger.info("Server starting up...")
    check_cuda_availability()

@app.get("/api/health")
async def health_check():
    """Simple health check endpoint to test API connectivity and response format"""
    return JSONResponse(
        content={
            "status": "success",
            "message": "API is healthy",
            "data": {
                "server": "open-deep-research-web",
                "version": "1.0.0",
                "cuda_available": torch.cuda.is_available(),
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
                "features": {
                    "fast_research": True,
                    "comprehensive_research": True,
                    "image_generation": True
                }
            }
        },
        status_code=200,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    )

@app.post("/api/research/quick")
async def quick_research(req: ResearchRequest):
    """Quick research endpoint with minimal processing for fastest results"""
    try:
        logger.info(f"Received quick research request for topic: {req.topic}")
        
        # Force fast mode for this endpoint
        research_results = await asyncio.wait_for(
            orchestrator.conduct_research(req.topic, fast_mode=True),
            timeout=60.0  # 1 minute for quick research
        )
        
        # Generate follow-up questions quickly
        follow_up_questions = [
            f"What are the latest developments in {req.topic}?",
            f"How does {req.topic} compare to alternatives?",
            f"What are the future implications of {req.topic}?",
            f"What challenges does {req.topic} face?",
            f"What are the practical applications of {req.topic}?"
        ]
        
        logger.info("Quick research completed successfully")
        
        response_data = {
            "status": "success",
            "report": research_results.get('full_report', ''),  # Frontend expects 'report' key
            "summary": research_results.get('summary', ''),
            "suggested_questions": follow_up_questions,
            "metadata": research_results.get('metadata', {})
        }
        
        return JSONResponse(
            content=response_data,
            status_code=200,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        )
        
    except asyncio.TimeoutError:
        logger.error("Quick research request timed out")
        error_response = {
            "status": "error",
            "message": "Quick research timed out. Please try a simpler query.",
            "data": None
        }
        return JSONResponse(
            content=error_response,
            status_code=408,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        logger.error(f"Error in quick research: {str(e)}")
        error_response = {
            "status": "error",
            "message": str(e),
            "data": None
        }
        return JSONResponse(
            content=error_response,
            status_code=500,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        )

@app.options("/api/research")
async def research_options():
    """Handle CORS preflight requests for research endpoint"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.post("/api/research")
async def research(req: ResearchRequest):
    """
    Endpoint to conduct comprehensive research using multiple models.
    """
    try:
        logger.info(f"Received research request for topic: {req.topic} (fast_mode: {req.fast_mode})")
        
        # Set a timeout for the research operation
        try:
            # Use asyncio.wait_for to add a timeout
            research_results = await asyncio.wait_for(
                orchestrator.conduct_research(req.topic, req.fast_mode),
                timeout=120.0  # 2 minutes maximum
            )
        except asyncio.TimeoutError:
            logger.error("Research request timed out after 2 minutes")
            error_response = {
                "status": "error",
                "message": "Research request timed out. Please try with a simpler query or enable fast mode.",
                "data": None
            }
            return JSONResponse(
                content=error_response,
                status_code=408,  # Request Timeout
                headers={
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            )
        
        # Generate follow-up questions
        follow_up_questions = await orchestrator.generate_follow_up_questions(research_results)
        
        logger.info("Research completed successfully")
        
        # Ensure response is properly formatted for frontend compatibility
        response_data = {
            "status": "success",
            "report": research_results.get('full_report', ''),  # Frontend expects 'report' key
            "summary": research_results.get('summary', ''),
            "suggested_questions": follow_up_questions,
            "metadata": research_results.get('metadata', {})
        }
        
        logger.info(f"Sending response with keys: {list(response_data.keys())}")
        return JSONResponse(
            content=response_data,
            status_code=200,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "*"
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing research request: {str(e)}")
        error_response = {
            "status": "error",
            "message": str(e),
            "data": None
        }
        return JSONResponse(
            content=error_response,
            status_code=500,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        )

@app.post("/api/follow-up")
async def follow_up(req: FollowUpRequest):
    """
    Endpoint to handle follow-up questions about the research.
    """
    try:
        logger.info(f"Received follow-up question: {req.question}")
        
        if not req.original_research:
            logger.warning("No original research provided for context")
            raise HTTPException(400, detail="No original research provided for context")
        
        # Process the follow-up question
        answer = await orchestrator.process_follow_up(
            req.original_research,
            req.question
        )
        
        logger.info("Follow-up question answered successfully")
        return {
            "status": "success",
            "question": req.question,
            "answer": answer
        }
    except Exception as e:
        logger.error(f"Error processing follow-up request: {str(e)}")
        raise HTTPException(500, detail=str(e))

@app.post("/api/refine-prompt")
async def refine_prompt(req: PromptRefinementRequest):
    try:
        logger.info(f"Received prompt refinement request: {req.prompt}")
        
        if not req.prompt.strip():
            raise HTTPException(400, detail="Image prompt cannot be empty")
        
        # Use the research orchestrator for prompt refinement
        refinement_prompt = f"""You are an expert prompt engineer specializing in image generation. Your task is to enhance and refine the following user prompt to produce better, more detailed, and visually appealing images.

Original prompt: "{req.prompt}"

Please enhance this prompt by:
1. Adding specific artistic details (style, lighting, composition, color palette)
2. Including technical specifications for better quality (4K, high resolution, detailed)
3. Adding relevant artistic styles or references if appropriate
4. Making the description more vivid and specific
5. Ensuring the prompt is optimized for AI image generation

Return ONLY the refined prompt without any explanations or additional text. The refined prompt should be a single, well-crafted sentence or paragraph that will generate a stunning image.

Refined prompt:"""
        
        # Use the analysis model for prompt refinement
        refined_prompt = await orchestrator._execute_research_step('analysis', refinement_prompt)
        
        # Clean the response to get just the refined prompt
        refined_prompt = refined_prompt.strip()
        if refined_prompt.startswith("Refined prompt:"):
            refined_prompt = refined_prompt.replace("Refined prompt:", "").strip()
        
        logger.info(f"Refined prompt: {refined_prompt}")
        return {"original_prompt": req.prompt, "refined_prompt": refined_prompt}
        
    except Exception as e:
        logger.error(f"Error refining prompt: {str(e)}")
        raise HTTPException(500, detail=str(e))

@app.options("/api/generate-image")
async def generate_image_options():
    """Handle CORS preflight requests for image generation endpoint"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.post("/api/generate-image")
async def generate_image(req: ImageRequest):
    try:
        logger.info(f"Received image generation request for prompt: {req.prompt}")
        
        if not req.prompt.strip():
            raise HTTPException(400, detail="Image prompt cannot be empty")
        
        # Verify CUDA is available for this request
        cuda_check = check_cuda_availability()
        logger.info(f"CUDA available for this request: {cuda_check}")
        
        # Initialize Stable Diffusion with increased token limit
        logger.info("Initializing Stable Diffusion...")
        # Increased to 300 tokens for much longer, more detailed prompts
        # Smart optimization will prioritize the most important elements
        sd_generator = StableDiffusionGenerator(max_tokens=300)
        
        # Use Together AI for prompt enhancement with proper fallback
        try:
            logger.info("Attempting to enhance prompt with Together AI...")
            
            enhancement_prompt = f"""You are an expert prompt engineer specializing in AI image generation. Your task is to enhance and refine the following user prompt to produce better, more detailed, and visually appealing images.

Original prompt: "{req.prompt}"

Please enhance this prompt by:
1. Adding specific artistic details (style, lighting, composition, color palette)
2. Including technical specifications for better quality (highly detailed, sharp focus, 4K resolution)
3. Adding relevant artistic styles or references if appropriate
4. Making the description more vivid and specific
5. Ensuring the prompt is optimized for Stable Diffusion image generation

IMPORTANT: 
- Return ONLY the enhanced prompt without any explanations, prefixes, or additional text
- Be very concise as Stable Diffusion can only process about 75 tokens (roughly 60-70 words)
- Focus on the most important details rather than trying to include everything
- Keep your response under 300 characters for optimal results with Stable Diffusion

Enhanced prompt:"""
            
            # Use Together AI for prompt enhancement
            orchestrator_result = await orchestrator._execute_research_step('analysis', enhancement_prompt)
            
            # Log the raw response for debugging
            logger.info(f"Raw Together AI response: {orchestrator_result[:100]}{'...' if len(orchestrator_result) > 100 else ''}")
            
            # Validate the Together AI response
            if (orchestrator_result and 
                len(orchestrator_result.strip()) > 10 and  # Ensure it's not too short
                not any(error_keyword in orchestrator_result.lower() for error_keyword in 
                    ['error', 'could not be completed', 'technical issues', 'unavailable', 'failed', 'unable to', 'cannot'])):
                
                # Clean the response to get just the enhanced prompt
                refined_prompt = orchestrator_result.strip()
                
                # Remove common prefixes that might be added
                prefixes_to_remove = ["enhanced prompt:", "refined prompt:", "improved prompt:", "final prompt:"]
                for prefix in prefixes_to_remove:
                    if refined_prompt.lower().startswith(prefix):
                        refined_prompt = refined_prompt[len(prefix):].strip()
                
                # Truncate if still too long (adding an ellipsis)
                if len(refined_prompt) > 1000:
                    logger.warning(f"Truncating overly long prompt ({len(refined_prompt)} chars)")
                    refined_prompt = refined_prompt[:997] + "..."
                    
                # Count approximate tokens (rough estimation)
                word_count = len(refined_prompt.split())
                if word_count > 60:
                    logger.warning(f"Prompt may exceed Stable Diffusion token limit ({word_count} words)")
                    # Simple approach to reduce tokens while keeping important content
                    words = refined_prompt.split()
                    refined_prompt = " ".join(words[:60])
                    logger.info(f"Truncated to approximately 60 words: {refined_prompt}")
                
                # Ensure the enhanced prompt is reasonable (not too short)
                if len(refined_prompt) >= 20:
                    logger.info(f"Successfully enhanced prompt with Together AI")
                    logger.info(f"Original: {req.prompt}")
                    logger.info(f"Enhanced: {refined_prompt}")
                else:
                    logger.warning(f"Together AI response too short ({len(refined_prompt)} chars), using fallback")
                    refined_prompt = sd_generator.refine_prompt(req.prompt)
            else:
                logger.warning(f"Together AI returned invalid response: {orchestrator_result}")
                logger.info("Using cleaned prompt without enhancement")
                refined_prompt = sd_generator.refine_prompt(req.prompt)
                
        except Exception as e:
            logger.warning(f"Error enhancing prompt with Together AI: {str(e)}")
            logger.info("Using cleaned prompt without enhancement")
            refined_prompt = sd_generator.refine_prompt(req.prompt)
        
        # Clear CUDA cache before generation to free up memory
        if hasattr(torch, 'cuda') and hasattr(torch.cuda, 'empty_cache'):
            try:
                torch.cuda.empty_cache()
                logger.info("Cleared CUDA cache before image generation")
            except Exception as e:
                logger.warning(f"Could not clear CUDA cache: {str(e)}")
        
        # Generate the image with Stable Diffusion (with 10-minute timeout)
        try:
            # Wrap the synchronous image generation in a timeout
            # First run may take longer while downloading models (2-4GB)
            # Use loop.run_in_executor for Python 3.8 compatibility (asyncio.to_thread requires Python 3.9+)
            loop = asyncio.get_event_loop()
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    None,  # Use default ThreadPoolExecutor
                    lambda: sd_generator.generate_image(
                        prompt=refined_prompt,
                        negative_prompt=req.negative_prompt,
                        height=req.height,
                        width=req.width,
                        num_inference_steps=req.num_inference_steps,
                        guidance_scale=req.guidance_scale
                    )
                ),
                timeout=600.0  # 10 minutes timeout for image generation (including model download)
            )
        except asyncio.TimeoutError:
            logger.error("Image generation timed out after 10 minutes")
            # Return a fallback response instead of failing completely
            from stable_diffusion_image_generator import create_text_image
            import base64
            from io import BytesIO
            
            fallback_image = create_text_image(
                f"Image generation timed out for: {refined_prompt}\n\nThe first run may take longer while downloading models (2-4GB).\nPlease try again - subsequent generations will be faster.",
                width=req.width,
                height=req.height
            )
            buffered = BytesIO()
            fallback_image.save(buffered, format="PNG")
            fallback_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            return JSONResponse(
                content={
                    "status": "timeout",
                    "image_base64": fallback_base64,
                    "original_prompt": req.prompt,
                    "refined_prompt": refined_prompt,
                    "fallback": True,
                    "message": "Image generation took too long. The first run may take longer while downloading models. Please try again."
                },
                status_code=200,  # Return 200 with fallback image instead of error
                headers={
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            )
        
        logger.info("Image generated successfully")
        
        response_data = {
            "status": "success",
            "image_base64": result["image_base64"],
            "original_prompt": req.prompt,
            "refined_prompt": refined_prompt,
            "fallback": result.get("fallback", False)
        }
        
        return JSONResponse(
            content=response_data,
            status_code=200,
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        # Check for CUDA errors specifically
        if "CUDA" in str(e) or "cuda" in str(e) or "Torch not compiled with CUDA" in str(e):
            error_message = (
                f"CUDA error: {str(e)}. "
                "Please check if your GPU drivers are up to date and CUDA is properly installed. "
                "Try running the 'install_torch_cuda.ps1' script to install PyTorch with CUDA support."
            )
            raise HTTPException(500, detail=error_message)
        else:
            raise HTTPException(500, detail=f"Image generation failed: {str(e)}")

@app.get("/api/test-stable-diffusion")
async def test_stable_diffusion():
    """
    Endpoint to test that Stable Diffusion is working with CUDA
    Returns information about CUDA status and a simple test image
    """
    try:
        logger.info("Testing Stable Diffusion with CUDA")
        
        # Check CUDA status
        cuda_available = check_cuda_availability()
        cuda_info = {
            "available": cuda_available,
            "device_count": torch.cuda.device_count() if cuda_available else 0,
            "device_name": torch.cuda.get_device_name(0) if cuda_available and torch.cuda.device_count() > 0 else "N/A",
            "cuda_version": torch.version.cuda if hasattr(torch.version, 'cuda') else "N/A",
            "pytorch_version": torch.__version__
        }
        
        # Initialize Stable Diffusion with increased token limit for testing
        sd_generator = StableDiffusionGenerator(max_tokens=300)
        
        # Generate a simple test image
        test_prompt = "A test image of a mountain landscape, high quality"
        result = sd_generator.generate_image(
            prompt=test_prompt,
            height=512,
            width=512,
            num_inference_steps=20  # Use fewer steps for quick testing
        )
        
        return {
            "status": "success",
            "cuda_info": cuda_info,
            "device_used": sd_generator.device,
            "image_base64": result["image_base64"],
            "prompt": test_prompt
        }
    except Exception as e:
        logger.error(f"Stable Diffusion test failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "cuda_info": {
                "available": torch.cuda.is_available(),
                "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
                "pytorch_version": torch.__version__
            }
        }

@app.get("/api/cuda-status")
async def cuda_status():
    """Simple endpoint to check CUDA availability"""
    cuda_available = check_cuda_availability()
    return {
        "cuda_available": cuda_available,
        "device_count": torch.cuda.device_count() if cuda_available else 0,
        "device_name": torch.cuda.get_device_name(0) if cuda_available and torch.cuda.device_count() > 0 else "N/A",
        "cuda_version": torch.version.cuda if hasattr(torch.version, 'cuda') else "N/A",
        "pytorch_version": torch.__version__,
        "environment_variables": {
            key: value for key, value in os.environ.items() 
            if "CUDA" in key or "TORCH" in key or "PYT" in key
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Running without reload to prevent CUDA detection issues
    # Set timeout to 10 minutes (600 seconds) to allow for model downloading and image generation
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,
        timeout_keep_alive=600,  # 10 minutes keep-alive timeout
        timeout_graceful_shutdown=30  # 30 seconds for graceful shutdown
    )
