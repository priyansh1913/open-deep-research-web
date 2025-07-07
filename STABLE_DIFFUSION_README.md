# Stable Diffusion Local Setup

This document provides instructions for setting up and running Stable Diffusion locally in the Open Deep Research Web application.

## Requirements

- Python 3.8 or higher
- PyTorch 1.13.0 or higher
- CUDA-compatible GPU (optional but highly recommended)
- 8GB+ VRAM for optimal performance (can run with less but will be slower)
- 16GB+ system RAM

## Installation

1. Clone the repository if you haven't already
2. Navigate to the project root directory
3. Install the required Python packages:

```bash
cd backend
pip install -r requirements.txt
```

## Running the Application

### Option 1: Using PowerShell Script (Recommended)

Simply run the PowerShell script from the project root directory:

```powershell
.\start_server.ps1
```

This will start both the backend (with Stable Diffusion) and the frontend servers.

### Option 2: Manual Startup

To start the backend manually:

```bash
cd backend
python main.py
```

To start the frontend manually:

```bash
cd frontend
npm install  # Only needed the first time
npm start
```

## Testing Stable Diffusion

You can test the Stable Diffusion setup without starting the whole application:

```bash
cd backend
python test_stable_diffusion.py
```

This will generate a test image and save it as `test_output.png` in the backend directory.

## Configuration

The application will use the `runwayml/stable-diffusion-v1-5` model by default. If you want to use a different model, you can modify the `StableDiffusionGenerator` class initialization in `stable_diffusion_image_generator.py`.

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**: If you encounter CUDA out of memory errors, try:
   - Reducing the image dimensions (height/width)
   - Using fewer inference steps
   - Using a smaller model

2. **Slow Generation**: If image generation is too slow:
   - Consider using a GPU if available
   - Reduce the number of inference steps
   - Use a smaller image size

3. **Missing Dependencies**: If you encounter errors about missing packages:
   - Make sure to run `pip install -r requirements.txt` in the backend directory

### Fallback to Pollinations.ai

If Stable Diffusion fails for any reason, the application will automatically fall back to using the Pollinations.ai API.
