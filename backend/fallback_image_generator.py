import logging
import base64
import platform
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FallbackImageGenerator:
    """
    A fallback image generator that creates text-based images when Stable Diffusion
    is unavailable or encounters errors.
    """
    
    def __init__(self):
        """Initialize the fallback image generator"""
        logger.info("Initializing FallbackImageGenerator")
        
        # Try to load a good font, falling back to default if necessary
        self.font = self._load_font(24)
        self.small_font = self._load_font(18)
        
    def _load_font(self, size):
        """Load a font with the given size, falling back to default if needed"""
        try:
            if platform.system() == "Windows":
                return ImageFont.truetype("arial.ttf", size)
            elif platform.system() == "Darwin":  # macOS
                return ImageFont.truetype("Arial.ttf", size)
            else:  # Linux and others
                return ImageFont.truetype("DejaVuSans.ttf", size)
        except Exception as e:
            logger.warning(f"Could not load font: {str(e)}")
            return ImageFont.load_default()
    
    def create_text_image(self, text, error_message=None, width=512, height=512):
        """
        Create a simple text-based image
        
        Args:
            text: The main text to display (usually the prompt)
            error_message: Optional error message to display
            width: Image width
            height: Image height
        
        Returns:
            PIL Image object
        """
        try:
            # Create a blank image with a gradient background
            image = Image.new('RGB', (width, height), color=(240, 240, 240))
            draw = ImageDraw.Draw(image)
            
            # Add a gradient background
            for y in range(height):
                r = int(240 - (y / height) * 40)
                g = int(240 - (y / height) * 20)
                b = int(240 - (y / height) * 30)
                for x in range(width):
                    draw.point((x, y), fill=(r, g, b))
            
            # Draw title
            title = "Image Generation Failed"
            title_font = self._load_font(28)
            title_width = draw.textlength(title, font=title_font)
            draw.text(((width - title_width) // 2, 40), title, font=title_font, fill=(80, 80, 80))
            
            # Draw horizontal line
            draw.line([(40, 80), (width-40, 80)], fill=(180, 180, 180), width=2)
            
            # Format the prompt text
            prompt_text = "Prompt: " + text
            lines = self._wrap_text(prompt_text, self.font, width - 80)
            
            # Draw prompt text
            y_position = 100
            for line in lines:
                draw.text((40, y_position), line, font=self.font, fill=(0, 0, 0))
                y_position += self.font.size + 10
            
            # Draw error message if provided
            if error_message:
                # Add some space before the error
                y_position += 20
                
                # Draw error title
                error_title = "Error details:"
                draw.text((40, y_position), error_title, font=self.font, fill=(180, 0, 0))
                y_position += self.font.size + 10
                
                # Draw the error message
                error_lines = self._wrap_text(error_message, self.small_font, width - 80)
                for line in error_lines:
                    draw.text((40, y_position), line, font=self.small_font, fill=(180, 0, 0))
                    y_position += self.small_font.size + 5
            
            # Add a note about fixing the issue
            note = "Try running the CUDA fix script or switching to CPU mode."
            note_width = draw.textlength(note, font=self.small_font)
            draw.text(((width - note_width) // 2, height - 60), note, font=self.small_font, fill=(80, 80, 80))
            
            # Add a border
            draw.rectangle([(10, 10), (width-10, height-10)], outline=(200, 200, 200), width=2)
            
            return image
        except Exception as e:
            # Last resort - create an ultra-simple image
            logger.error(f"Error creating text image: {str(e)}")
            img = Image.new('RGB', (width, height), color=(255, 255, 255))
            return img
    
    def _wrap_text(self, text, font, max_width):
        """
        Wrap text to fit within a given width
        
        Args:
            text: The text to wrap
            font: The font to use for measurement
            max_width: The maximum width in pixels
            
        Returns:
            List of lines
        """
        lines = []
        words = text.split()
        current_line = ""
        
        for word in words:
            test_line = current_line + " " + word if current_line else word
            if self._get_text_width(test_line, font) < max_width:
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines
    
    def _get_text_width(self, text, font):
        """Get the width of text with the given font"""
        try:
            # Try to use textlength first (newer method)
            if hasattr(ImageDraw.Draw(Image.new('RGB', (1, 1))), 'textlength'):
                return ImageDraw.Draw(Image.new('RGB', (1, 1))).textlength(text, font=font)
            # Fall back to getsize for older Pillow versions
            elif hasattr(font, 'getsize'):
                return font.getsize(text)[0]
            # Last resort - estimate based on character count
            else:
                return len(text) * font.size * 0.6
        except Exception:
            # Very rough estimate
            return len(text) * 12
    
    def generate_image(self, prompt, error_message=None, height=512, width=512):
        """
        Generate a fallback image
        
        Args:
            prompt: The text prompt
            error_message: Optional error message
            height: Image height
            width: Image width
            
        Returns:
            A dictionary containing:
            - image_base64: Base64 encoded image
            - prompt: The original prompt
            - fallback: Always True
        """
        logger.info(f"Generating fallback image for prompt: {prompt}")
        
        # Create the image
        image = self.create_text_image(prompt, error_message, width, height)
        
        # Convert to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "image_base64": img_str,
            "prompt": prompt,
            "fallback": True,
            "error": error_message if error_message else "Failed to generate image with AI"
        }
