import os
import logging
import base64
import sys
import platform
from io import BytesIO
from diffusers import StableDiffusionPipeline
import torch
from PIL import Image
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define fallback image generator function
def create_text_image(text, width=512, height=512):
    """Create a simple text-based image when image generation fails"""
    from PIL import Image, ImageDraw, ImageFont
    try:
        # Create a blank image with a gradient background
        image = Image.new('RGB', (width, height), color=(240, 240, 240))
        draw = ImageDraw.Draw(image)
        
        # Add a simple gradient background
        for y in range(height):
            r = int(240 - (y / height) * 40)
            g = int(240 - (y / height) * 20)
            b = int(240 - (y / height) * 30)
            for x in range(width):
                draw.point((x, y), fill=(r, g, b))
        
        # Try to use a nice font, fall back to default if not available
        try:
            font_size = 24
            if platform.system() == "Windows":
                font = ImageFont.truetype("arial.ttf", font_size)
            else:
                font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Split text into lines
        lines = []
        words = text.split()
        current_line = ""
        for word in words:
            test_line = current_line + " " + word if current_line else word
            if draw.textlength(test_line, font=font) < width - 40:
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        # Draw text centered on image
        y_position = height // 2 - (len(lines) * font_size) // 2
        for line in lines:
            text_width = draw.textlength(line, font=font)
            x_position = (width - text_width) // 2
            draw.text((x_position, y_position), line, font=font, fill=(0, 0, 0))
            y_position += font_size + 10
        
        # Add a border
        draw.rectangle([(10, 10), (width-10, height-10)], outline=(200, 200, 200), width=2)
        
        return image
    except Exception as e:
        # Last resort - create an ultra-simple image
        logger.error(f"Error creating text image: {str(e)}")
        img = Image.new('RGB', (width, height), color=(255, 255, 255))
        return img

class StableDiffusionGenerator:
    def __init__(self, model_id="runwayml/stable-diffusion-v1-5", device=None, max_tokens=200):
        """
        Initialize the Stable Diffusion image generator.
        
        Args:
            model_id: The model ID to use for image generation
            device: The device to use for inference (None for auto-detection)
            max_tokens: Maximum token limit for prompts (increased to 200 for longer prompts)
        """
        self.model_id = model_id
        self.pipeline = None
        self.fallback_mode = False
        self.max_tokens = max_tokens  # Store the token limit
        
        # Auto-detect device if not specified
        if device is None:
            # Try multiple methods to detect CUDA
            self.device = self._detect_best_device()
        else:
            self.device = device
            
        logger.info(f"Initializing Stable Diffusion with model {model_id} on {self.device}")
        
        # Load the pipeline with appropriate settings for the device
        try:
            logger.info(f"Loading Stable Diffusion model '{model_id}'...")
            logger.info("This may take a few minutes if downloading for the first time (approx. 2-4 GB)...")
            
            if self.device == "cpu":
                logger.info("Loading model for CPU inference...")
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    model_id, 
                    torch_dtype=torch.float32,
                    safety_checker=None  # Disable safety checker for speed
                )
                logger.info("Model loaded successfully for CPU")
            else:
                # For CUDA devices, use half precision for better memory efficiency
                try:
                    logger.info(f"Loading model for {self.device.upper()} inference with float16 precision...")
                    self.pipeline = StableDiffusionPipeline.from_pretrained(
                        model_id, 
                        torch_dtype=torch.float16,
                        safety_checker=None  # Disable safety checker for speed
                    )
                    logger.info(f"Model loaded successfully for {self.device.upper()}")
                except Exception as cuda_e:
                    logger.warning(f"Error loading model with CUDA settings: {str(cuda_e)}")
                    logger.info("Falling back to CPU model loading")
                    self.device = "cpu"
                    self.fallback_mode = True
                    self.pipeline = StableDiffusionPipeline.from_pretrained(
                        model_id, 
                        torch_dtype=torch.float32,
                        safety_checker=None
                    )
                    logger.info("Model loaded successfully for CPU (fallback)")
            
            if self.pipeline is None:
                raise ValueError("Failed to initialize pipeline")
                
            # Move the pipeline to the specified device
            try:
                logger.info(f"Moving pipeline to {self.device}...")
                self.pipeline = self.pipeline.to(self.device)
                logger.info(f"Pipeline successfully moved to {self.device}")
            except RuntimeError as e:
                if "CUDA" in str(e) or "cuda" in str(e):
                    logger.warning(f"Error moving pipeline to {self.device}: {str(e)}")
                    logger.info("Falling back to CPU")
                    self.device = "cpu"
                    self.fallback_mode = True
                    self.pipeline = self.pipeline.to("cpu")
                    logger.info("Pipeline successfully moved to CPU (fallback)")
                else:
                    raise
            
            # Enable memory optimization
            try:
                self.pipeline.enable_attention_slicing()
                logger.info("Enabled attention slicing")
            except Exception as e:
                logger.warning(f"Could not enable attention slicing: {str(e)}")
            
            # For CPU, use even more aggressive memory optimization
            if self.device == "cpu":
                # Enable sequential CPU offload if available
                try:
                    logger.info("Attempting to enable sequential CPU offload")
                    if hasattr(self.pipeline, 'enable_sequential_cpu_offload'):
                        self.pipeline.enable_sequential_cpu_offload()
                        logger.info("Enabled sequential CPU offload")
                except Exception as e:
                    logger.warning(f"Sequential CPU offload not available: {str(e)}")
                
                # Use float32 for CPU
                try:
                    if hasattr(self.pipeline, 'vae') and hasattr(self.pipeline.vae, 'to'):
                        self.pipeline.vae = self.pipeline.vae.to(dtype=torch.float32)
                    if hasattr(self.pipeline, 'unet') and hasattr(self.pipeline.unet, 'to'):
                        self.pipeline.unet = self.pipeline.unet.to(dtype=torch.float32)
                    logger.info("Set model components to float32 for CPU")
                except Exception as e:
                    logger.warning(f"Could not set model components to float32: {str(e)}")
            
            # For CUDA devices, use memory optimizations
            if self.device == "cuda":
                logger.info("CUDA device detected, enabling memory optimizations...")
                
                try:
                    # Enable attention slicing for all GPU devices regardless of memory
                    self.pipeline.enable_attention_slicing(slice_size="auto")
                    logger.info("Enabled attention slicing for better memory usage")
                except Exception as e:
                    logger.warning(f"Could not enable attention slicing: {str(e)}")
                
                try:
                    if hasattr(self.pipeline, 'enable_xformers_memory_efficient_attention'):
                        self.pipeline.enable_xformers_memory_efficient_attention()
                        logger.info("Enabled xformers memory efficient attention")
                except Exception as e:
                    logger.warning(f"Could not enable xformers memory efficient attention: {str(e)}")
                    logger.info("Continuing without xformers optimization")
                    
                # Try to optimize VRAM usage
                try:
                    if hasattr(torch.cuda, 'empty_cache'):
                        torch.cuda.empty_cache()
                        logger.info("Cleared CUDA cache to free up memory")
                except Exception as e:
                    logger.warning(f"Could not clear CUDA cache: {str(e)}")
            
            logger.info("Stable Diffusion pipeline loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Stable Diffusion pipeline: {str(e)}")
            logger.warning("Will use fallback text-to-image conversion")
            self.fallback_mode = True
            self.pipeline = None
            
    def _detect_best_device(self):
        """Detect the best available device using multiple methods"""
        try:
            # Method 1: Standard PyTorch check
            if torch.cuda.is_available():
                device_count = torch.cuda.device_count()
                if device_count > 0:
                    device_name = torch.cuda.get_device_name(0)
                    logger.info(f"CUDA is available. Found {device_count} devices.")
                    logger.info(f"Using CUDA device: {device_name}")
                    
                    # Verify CUDA actually works by performing a small operation
                    try:
                        test_tensor = torch.zeros(1).cuda()
                        del test_tensor
                        return "cuda"
                    except Exception as e:
                        logger.warning(f"CUDA available but test failed: {str(e)}")
            
            # Method 2: Check for specific CUDA drivers and libraries
            try:
                import subprocess
                result = subprocess.run(["nvidia-smi"], capture_output=True, text=True)
                if result.returncode == 0:
                    logger.info("nvidia-smi check passed, CUDA should be available")
                    
                    # Check CUDA_HOME environment variable
                    cuda_home = os.environ.get("CUDA_HOME") or os.environ.get("CUDA_PATH")
                    if cuda_home and os.path.exists(cuda_home):
                        logger.info(f"CUDA_HOME is set to {cuda_home}")
                        # One more attempt to use CUDA
                        try:
                            torch.cuda.init()
                            return "cuda"
                        except Exception as e:
                            logger.warning(f"Could not initialize CUDA: {str(e)}")
            except Exception:
                pass
            
            # Method 3: Check if MPS is available (Apple Silicon)
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                logger.info("MPS is available (Apple Silicon). Using MPS backend.")
                return "mps"
            
            # Fallback to CPU
            logger.warning("No GPU acceleration available. Using CPU (will be slow).")
            return "cpu"
        except Exception as e:
            logger.error(f"Error detecting device: {str(e)}")
            logger.warning("Falling back to CPU")
            return "cpu"
    
    def generate_image(self, prompt, negative_prompt=None, height=512, width=512, num_inference_steps=30, guidance_scale=7.5, max_tokens=None):
        """
        Generate an image based on the given prompt.
        
        Args:
            prompt: The text prompt to generate an image from
            negative_prompt: What not to include in the image
            height: Image height
            width: Image width
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow the prompt
            max_tokens: Maximum number of tokens allowed (uses instance default if None)
            
        Returns:
            A dictionary containing:
            - image_base64: Base64 encoded image
            - prompt: The original prompt
        """
        # Use instance default if not provided
        if max_tokens is None:
            max_tokens = self.max_tokens
        logger.info(f"Generating image for prompt: '{prompt[:100]}{'...' if len(prompt) > 100 else ''}'")
        logger.info(f"Image parameters: {width}x{height}, steps: {num_inference_steps}, guidance: {guidance_scale}")
        
        # Check and optimize prompt if needed
        original_prompt = prompt
        if self.count_tokens(prompt) > max_tokens:
            # Use smart optimization first, then fallback to simple truncation
            prompt = self.smart_prompt_optimization(prompt, max_tokens)
            if self.count_tokens(prompt) > max_tokens:
                prompt = self.truncate_prompt(prompt, max_tokens)
        
        # If we're in fallback mode, just generate a text image
        if self.fallback_mode or self.pipeline is None:
            logger.warning("Using fallback text-to-image mode")
            try:
                image = create_text_image(f"Could not generate image for: {prompt}", width, height)
                buffered = BytesIO()
                image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                
                return {
                    "image_base64": img_str,
                    "prompt": prompt,
                    "fallback": True
                }
            except Exception as e:
                logger.error(f"Error creating fallback image: {str(e)}")
                # Return an error image as last resort
                raise RuntimeError(f"Failed to generate image: {str(e)}")

        # Normal generation path
        try:
            # For slower devices, use fewer steps
            if self.device == "cpu":
                if num_inference_steps > 20:
                    logger.info(f"Reducing inference steps from {num_inference_steps} to 20 for CPU")
                    num_inference_steps = 20
            
            logger.info(f"Starting image generation on {self.device} with {num_inference_steps} steps...")
            
            # Set generator for reproducibility
            seed = 1024
            generator = torch.Generator(device=self.device).manual_seed(seed)
            
            # Generate the image
            try:
                # Use torch.autocast when available for better performance
                if hasattr(torch, 'autocast') and self.device in ['cuda', 'mps']:
                    logger.info("Using autocast for optimized CUDA inference...")
                    with torch.autocast(self.device):
                        output = self.pipeline(
                            prompt=prompt,
                            negative_prompt=negative_prompt,
                            height=height,
                            width=width,
                            num_inference_steps=num_inference_steps,
                            guidance_scale=guidance_scale,
                            generator=generator
                        )
                else:
                    # Fallback for older PyTorch versions or CPU
                    logger.info("Using standard inference (no autocast)...")
                    output = self.pipeline(
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        height=height,
                        width=width,
                        num_inference_steps=num_inference_steps,
                        guidance_scale=guidance_scale,
                        generator=generator
                    )
                logger.info("Image generation completed successfully!")
            except RuntimeError as e:
                # Handle various types of CUDA errors
                error_str = str(e).lower()
                is_cuda_error = any(s in error_str for s in ["cuda", "gpu", "memory", "torch not compiled with cuda"])
                
                if is_cuda_error:
                    logger.error(f"CUDA/GPU error during image generation: {str(e)}")
                    if self.device in ["cuda", "mps"]:
                        # Try to fallback to CPU if CUDA/MPS fails
                        logger.warning("Attempting to fallback to CPU for image generation")
                        original_device = self.device
                        self.device = "cpu"
                        try:
                            # Move pipeline to CPU
                            self.pipeline = self.pipeline.to("cpu")
                            
                            # Clear CUDA cache
                            if hasattr(torch.cuda, 'empty_cache'):
                                torch.cuda.empty_cache()
                            
                            # Adjust parameters for CPU
                            reduced_steps = min(15, num_inference_steps)  # Even fewer steps for emergency fallback
                            generator = torch.Generator(device="cpu").manual_seed(seed)
                            
                            # Generate on CPU
                            output = self.pipeline(
                                prompt=prompt,
                                negative_prompt=negative_prompt,
                                height=height,
                                width=width,
                                num_inference_steps=reduced_steps,
                                guidance_scale=guidance_scale,
                                generator=generator
                            )
                            logger.info("Successfully generated image on CPU after GPU failed")
                        except Exception as cpu_error:
                            logger.error(f"CPU fallback also failed: {str(cpu_error)}")
                            # Use fallback text image as last resort
                            image = create_text_image(f"Failed to generate image for: {prompt}\nError: GPU out of memory and CPU fallback failed", width, height)
                            buffered = BytesIO()
                            image.save(buffered, format="PNG")
                            img_str = base64.b64encode(buffered.getvalue()).decode()
                            
                            return {
                                "image_base64": img_str,
                                "prompt": prompt,
                                "fallback": True
                            }
                    else:
                        # If already on CPU and still getting CUDA errors, there's a configuration issue
                        logger.error(f"CUDA error while using CPU device: {str(e)}")
                        # Create fallback image
                        image = create_text_image(f"Failed to generate image for: {prompt}\nError: CUDA configuration error", width, height)
                        buffered = BytesIO()
                        image.save(buffered, format="PNG")
                        img_str = base64.b64encode(buffered.getvalue()).decode()
                        
                        return {
                            "image_base64": img_str,
                            "prompt": prompt,
                            "fallback": True
                        }
                else:
                    # For non-CUDA errors, try to create fallback image
                    logger.error(f"Non-CUDA error during image generation: {str(e)}")
                    image = create_text_image(f"Failed to generate image for: {prompt}\nError: {str(e)[:100]}", width, height)
                    buffered = BytesIO()
                    image.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    
                    return {
                        "image_base64": img_str,
                        "prompt": prompt,
                        "fallback": True
                    }
            
            # Process successful output
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
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            
            # Return fallback image with error message
            try:
                image = create_text_image(f"Failed to generate image for: {prompt}\nError: {str(e)[:100]}", width, height)
                buffered = BytesIO()
                image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                
                return {
                    "image_base64": img_str,
                    "prompt": prompt,
                    "fallback": True
                }
            except Exception as img_error:
                logger.error(f"Error creating fallback image: {str(img_error)}")
                raise RuntimeError(f"Complete failure in image generation: {str(e)}")
    
    def refine_prompt(self, prompt):
        """
        Simple pass-through function that just returns the original prompt.
        This is only used as a fallback when Together AI is not available.
        All prompt enhancement is now handled by Together AI.
        
        Args:
            prompt: The original prompt
            
        Returns:
            The original prompt without modifications
        """
        # Just clean the prompt and remove common prefixes
        prompt = prompt.strip()
        
        # Remove common prefixes that users might add
        prefixes_to_remove = ["generate image of", "create image of", "make image of", "draw", "paint"]
        for prefix in prefixes_to_remove:
            if prompt.lower().startswith(prefix):
                prompt = prompt[len(prefix):].strip()
                
        logger.info(f"Using original prompt: {prompt}")
        return prompt
        
    def count_tokens(self, text):
        """
        Estimate token count of a text string for CLIP text encoder.
        This is a simple estimation - each word and punctuation is roughly one token.
        
        Args:
            text: The text to count tokens for
            
        Returns:
            Estimated token count
        """
        # Split on whitespace and punctuation
        tokens = re.findall(r'\w+|[^\w\s]', text)
        return len(tokens)
        
    def truncate_prompt(self, prompt, max_tokens=200):
        """
        Intelligently truncate a prompt to fit within token limits.
        Prioritizes keeping the main subject and descriptive elements.
        
        Args:
            prompt: The prompt to truncate
            max_tokens: Maximum number of tokens allowed (default increased to 200)
            
        Returns:
            Truncated prompt
        """
        # If already under limit, return as is
        if self.count_tokens(prompt) <= max_tokens:
            return prompt
            
        logger.warning(f"Prompt exceeds token limit ({self.count_tokens(prompt)} > {max_tokens}). Truncating...")
        
        # Split into words and punctuation
        tokens = re.findall(r'\w+|[^\w\s]', prompt)
        
        # Keep most important tokens (earlier ones tend to be more important in SD)
        # Leave a small buffer (3 tokens) to account for tokenization differences
        truncated_tokens = tokens[:max_tokens-3]
        truncated_prompt = ' '.join(truncated_tokens).replace(' ,', ',').replace(' .', '.').replace(' ;', ';')
        
        logger.info(f"Truncated prompt from {len(tokens)} to {len(truncated_tokens)} tokens")
        logger.info(f"Truncated prompt: {truncated_prompt}")
        
        return truncated_prompt
        
    def smart_prompt_optimization(self, prompt, max_tokens=200):
        """
        Advanced prompt optimization that prioritizes important elements.
        
        Args:
            prompt: The original prompt
            max_tokens: Maximum tokens allowed (default increased to 200)
            
        Returns:
            Optimized prompt within token limits
        """
        if self.count_tokens(prompt) <= max_tokens:
            return prompt
            
        logger.info("Applying smart prompt optimization...")
        
        # Extract key elements from the prompt
        # Priority order: main subject, style, quality modifiers, colors, composition
        
        # Common quality/style modifiers to preserve
        important_modifiers = [
            'high quality', 'detailed', 'realistic', 'photorealistic', 'masterpiece',
            'best quality', 'ultra detailed', '4k', '8k', 'hdr', 'cinematic',
            'professional', 'sharp focus', 'beautiful', 'stunning', 'vibrant'
        ]
        
        # Split prompt into parts
        parts = prompt.split(',')
        parts = [part.strip() for part in parts if part.strip()]
        
        # Start with the first part (usually the main subject)
        optimized_parts = []
        current_tokens = 0
        
        # Add parts in order of importance
        for i, part in enumerate(parts):
            part_tokens = self.count_tokens(part)
            
            # Always include the first part (main subject)
            if i == 0:
                optimized_parts.append(part)
                current_tokens += part_tokens
            # Check if adding this part would exceed limit
            elif current_tokens + part_tokens + 2 <= max_tokens:  # +2 for comma and space
                optimized_parts.append(part)
                current_tokens += part_tokens + 2
            # If we can't fit the whole part, see if it contains important modifiers
            else:
                # Check if this part contains important modifiers
                part_lower = part.lower()
                for modifier in important_modifiers:
                    if modifier in part_lower and current_tokens + self.count_tokens(modifier) + 2 <= max_tokens:
                        optimized_parts.append(modifier)
                        current_tokens += self.count_tokens(modifier) + 2
                        break
                
                # Stop adding parts if we're getting close to limit
                if current_tokens >= max_tokens - 5:
                    break
        
        optimized_prompt = ', '.join(optimized_parts)
        
        # Final check and truncation if needed
        if self.count_tokens(optimized_prompt) > max_tokens:
            optimized_prompt = self.truncate_prompt(optimized_prompt, max_tokens)
        
        logger.info(f"Optimized prompt: {optimized_prompt}")
        return optimized_prompt
