# Stable Diffusion Quickstart Guide

This quickstart guide will help you get up and running with Stable Diffusion locally in just a few minutes.

## Quick Setup

1. **Prerequisites**:
   - Make sure you have Python 3.8+ installed
   - A GPU with CUDA support is recommended but not required

2. **Start the Application**:
   - Open PowerShell in the project root directory
   - Run: `.\start_server.ps1`
   - This will start both the backend and frontend

3. **Access the Application**:
   - Open your browser to `http://localhost:3000`
   - You can now generate images using the local Stable Diffusion model

## What's Happening Behind the Scenes

When you start the application:

1. The PowerShell script starts the backend server, which:
   - Installs the required Python packages if needed
   - Initializes the Stable Diffusion model
   - Starts the FastAPI server on port 8000

2. The script also starts the frontend, which:
   - Installs npm dependencies if needed
   - Starts the React development server on port 3000

3. When you generate an image:
   - Your prompt is refined for better results
   - The refined prompt is sent to Stable Diffusion
   - The model generates the image and returns it as base64
   - The image is displayed in your browser

## First-Time Tips

- The first time you run the application, it will download the Stable Diffusion model (about 4-5GB), which may take some time
- Try simple prompts first to test that everything is working properly
- If you encounter any issues, check the STABLE_DIFFUSION_README.md file for troubleshooting tips
