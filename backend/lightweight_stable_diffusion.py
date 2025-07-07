import os
import logging
import base64
from io import BytesIO
import torch
from diffusers import StableDiffusionPipeline
from fallback_image_generator import FallbackImageGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LightweightStableDiffusion:
    """
    A lightweight implementation of Stable Diffusion that minimizes memory usage
    and provides better error handling for systems with limited VRAM.
    """
    
    def __init__(self, model_id="runwayml/stable-diffusion-v1-5"):
        """
        Initialize the lightweight Stable Diffusion generator
        
        Args:
            model_id: The model ID to use
        """
        self.model_id = model_id
        self.fallback_generator = FallbackImageGenerator()
        self.pipeline = None
        
        # Set environment variables for optimized CUDA usage
        os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:256"
        os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
        
        # Detect best device
        self.device = self._detect_device()
        logger.info(f"Using device: {self.device}")
        
        # Load the model with optimal settings
        try:
            self._load_model()
        except Exception as e:
            logger.error(f"Failed to load Stable Diffusion model: {str(e)}")
            self.pipeline = None
    
    def _detect_device(self):
        """Detect the best available device for inference"""
        # Check CUDA availability
        if torch.cuda.is_available():
            try:
                # Test CUDA with a small operation
                test_tensor = torch.zeros(1).cuda()
                del test_tensor
                torch.cuda.empty_cache()
                
                # Get VRAM info
                device_name = torch.cuda.get_device_name(0)
                total_memory = torch.cuda.get_device_properties(0).total_memory
                total_memory_gb = total_memory / (1024 ** 3)
                
                logger.info(f"CUDA device: {device_name} with {total_memory_gb:.2f}GB VRAM")
                
                return "cuda"
            except Exception as e:
                logger.warning(f"CUDA available but test failed: {str(e)}")
        
        # Check MPS (Apple Silicon)
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        
        # Fallback to CPU
        return "cpu"
    
    def _load_model(self):
        """Load the Stable Diffusion model with optimal settings for the device"""
        try:
            if self.device == "cuda":
                # For CUDA devices, optimize for lower memory usage
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    self.model_id,
                    torch_dtype=torch.float16,  # Use half precision
                    revision="fp16",
                    safety_checker=None,        # Disable safety checker for speed
                    requires_safety_checker=False
                ).to(self.device)
                
                # Apply memory optimizations
                self.pipeline.enable_attention_slicing(slice_size="max")
                
                # Try to enable xformers if available
                try:
                    self.pipeline.enable_xformers_memory_efficient_attention()
                    logger.info("Enabled xformers for memory-efficient attention")
                except Exception:
                    logger.info("Xformers not available, using default attention mechanism")
                
                # Set fixed attention size if using lower VRAM GPU
                total_memory = torch.cuda.get_device_properties(0).total_memory
                total_memory_gb = total_memory / (1024 ** 3)
                
                if total_memory_gb < 8:
                    logger.info(f"Low VRAM detected ({total_memory_gb:.2f}GB), using additional optimizations")
                    # Set even smaller slice size for very limited VRAM
                    self.pipeline.enable_attention_slicing(slice_size=1)
                    
                    # Set smaller VAE slicing
                    if hasattr(self.pipeline, "vae") and hasattr(self.pipeline.vae, "enable_slicing"):
                        self.pipeline.vae.enable_slicing()
                        logger.info("Enabled VAE slicing for lower memory usage")
            
            elif self.device == "mps":
                # Settings for Apple Silicon
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    self.model_id,
                    safety_checker=None,
                    requires_safety_checker=False
                ).to(self.device)
                
                # Enable attention slicing for MPS
                self.pipeline.enable_attention_slicing()
            
            else:
                # CPU settings - use 8-bit optimizations if available
                try:
                    # Try to import optimum for 8-bit quantization
                    from optimum.bettertransformer import BetterTransformer
                    
                    self.pipeline = StableDiffusionPipeline.from_pretrained(
                        self.model_id,
                        safety_checker=None,
                        requires_safety_checker=False
                    )
                    
                    # Apply BetterTransformer optimizations
                    self.pipeline.unet = BetterTransformer.transform(self.pipeline.unet) 
                    self.pipeline.vae = BetterTransformer.transform(self.pipeline.vae)
                    self.pipeline = self.pipeline.to(self.device)
                    
                    logger.info("Using BetterTransformer optimizations for CPU")
                except ImportError:
                    # Fallback to standard pipeline
                    self.pipeline = StableDiffusionPipeline.from_pretrained(
                        self.model_id,
                        safety_checker=None,
                        requires_safety_checker=False
                    ).to(self.device)
                    
                    logger.info("Using standard pipeline for CPU (optimum not available)")
                
                # Enable attention slicing for CPU
                self.pipeline.enable_attention_slicing(slice_size=1)
        
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.pipeline = None
            raise
    
    def generate_image(self, prompt, negative_prompt=None, height=512, width=512, 
                      num_inference_steps=30, guidance_scale=7.5):
        """
        Generate an image based on the given prompt
        
        Args:
            prompt: The text prompt
            negative_prompt: What not to include in the image
            height: Image height
            width: Image width
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow the prompt
            
        Returns:
            A dictionary containing:
            - image_base64: Base64 encoded image
            - prompt: The original prompt
            - fallback: Boolean indicating if fallback was used
        """
        # Check if the pipeline is loaded
        if self.pipeline is None:
            error_msg = "Stable Diffusion model is not loaded"
            logger.error(error_msg)
            return self.fallback_generator.generate_image(prompt, error_msg, height, width)
        
        # Handle low memory situations by reducing parameters
        if self.device == "cuda":
            # Check available memory
            try:
                free_memory = torch.cuda.mem_get_info()[0]
                free_memory_gb = free_memory / (1024 ** 3)
                
                if free_memory_gb < 2:
                    logger.warning(f"Low VRAM available ({free_memory_gb:.2f}GB), reducing parameters")
                    # Reduce parameters for low memory situations
                    height = min(height, 512)
                    width = min(width, 512)
                    num_inference_steps = min(num_inference_steps, 20)
                    
                    # Clear cache
                    torch.cuda.empty_cache()
            except Exception as e:
                logger.warning(f"Could not check memory: {str(e)}")
        
        # On CPU, always reduce steps
        if self.device == "cpu":
            original_steps = num_inference_steps
            num_inference_steps = min(num_inference_steps, 15)
            if original_steps != num_inference_steps:
                logger.info(f"Reduced inference steps from {original_steps} to {num_inference_steps} for CPU")
        
        # Try to generate the image
        try:
            # Set generator for reproducibility
            generator = torch.Generator(device=self.device).manual_seed(42)
            
            # Generate the image
            with torch.inference_mode():
                output = self.pipeline(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    height=height,
                    width=width,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    generator=generator
                )
            
            # Get the image
            image = output.images[0]
            
            # Convert to base64
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            logger.info(f"Successfully generated image for prompt: {prompt}")
            
            return {
                "image_base64": img_str,
                "prompt": prompt,
                "fallback": False
            }
        
        except (RuntimeError, torch.cuda.OutOfMemoryError) as e:
            # Handle CUDA errors and out of memory errors
            error_msg = str(e)
            logger.error(f"CUDA/GPU error during generation: {error_msg}")
            
            # Try to recover CUDA memory
            if self.device == "cuda":
                torch.cuda.empty_cache()
                
                # Try again with reduced parameters
                try:
                    logger.info("Attempting with reduced parameters")
                    
                    # Set very conservative parameters
                    reduced_height = min(height, 384)
                    reduced_width = min(width, 384)
                    reduced_steps = min(num_inference_steps, 10)
                    
                    # Generate with reduced parameters
                    with torch.inference_mode():
                        output = self.pipeline(
                            prompt=prompt,
                            negative_prompt=negative_prompt,
                            height=reduced_height,
                            width=reduced_width,
                            num_inference_steps=reduced_steps,
                            guidance_scale=guidance_scale,
                            generator=generator
                        )
                    
                    # Get the image
                    image = output.images[0]
                    
                    # Convert to base64
                    buffered = BytesIO()
                    image.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    
                    logger.info(f"Successfully generated image with reduced parameters")
                    
                    return {
                        "image_base64": img_str,
                        "prompt": prompt,
                        "fallback": False
                    }
                except Exception as retry_error:
                    logger.error(f"Retry with reduced parameters failed: {str(retry_error)}")
            
            # Return fallback image if all attempts failed
            return self.fallback_generator.generate_image(
                prompt, 
                f"CUDA/GPU error: {error_msg}", 
                height, 
                width
            )
        
        except Exception as e:
            # Handle other errors
            error_msg = str(e)
            logger.error(f"Error generating image: {error_msg}")
            
            # Return fallback image
            return self.fallback_generator.generate_image(
                prompt, 
                f"Error: {error_msg}", 
                height, 
                width
            )
