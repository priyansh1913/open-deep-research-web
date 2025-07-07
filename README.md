
# Open Deep Research Web

This application provides an AI-powered research assistant with local Stable Diffusion image generation capabilities. All AI models and caches are stored on the D drive to save space on your C drive.

## Features

### Frontend
- Beautiful UI with pop-up modal for summaries
- Detailed full reports with expandable sections
- Responsive design
- Loading states and error handling
- Timeout handling for API requests

### Backend
- FastAPI server with CORS support
- Integration with Together AI API for research
- **Local Stable Diffusion for image generation**
- Prompt refinement for better images
- Automatic fallback to Pollinations.ai if local generation fails
- Comprehensive research report generation
- Summarization capabilities
- Error handling and fallback responses

## Quick Start

1. Simply run the `start_app.bat` file to start both the frontend and backend
2. Alternatively, run the PowerShell script: `.\start_complete.ps1` 
3. Access the application at `http://localhost:3000`

## D Drive Installation

All models, caches, and temporary files are now configured to use the D drive instead of C drive. The following locations are used:

- `D:\ai website\open-deep-research-web\huggingface_cache` - HuggingFace model cache
- `D:\ai website\open-deep-research-web\torch_cache` - PyTorch cache
- `D:\ai website\open-deep-research-web\transformers_cache` - Transformers models
- `D:\ai website\open-deep-research-web\xdg_cache` - General Python cache
- `D:\ai website\open-deep-research-web\pip_cache` - PIP package cache
- `D:\ai website\open-deep-research-web\npm_cache` - NPM package cache

To clean up your C drive, use the provided `clean_c_drive.bat` script.

## Documentation

- [Stable Diffusion Quickstart Guide](./STABLE_DIFFUSION_QUICKSTART.md)
- [Detailed Stable Diffusion Setup](./STABLE_DIFFUSION_README.md)
- [D Drive Installation Guide](./D_DRIVE_INSTALL.md)

## Technology Stack

### Frontend
- React
- Tailwind CSS with Typography plugin
- React Modal
- Heroicons

### Backend
- FastAPI
- Together AI API
- Stable Diffusion (diffusers library)
- PyTorch
- Python 3.8+

## Requirements

- Python 3.8+
- Node.js (v14+)
- PyTorch
- CUDA-compatible GPU (recommended for faster image generation)

4. Set up your configuration:
   - Copy `configs/open_deep_researcher_config.yaml.example` to `configs/open_deep_researcher_config.yaml`
   - Add your Together AI API key to the configuration file

5. Start the server:
   ```
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

- `POST /api/research`: Accepts a topic and returns a comprehensive research report and summary

## Docker

The project includes a Dockerfile for containerization:

```bash
docker build -t open-deep-research-backend .
docker run -p 8000:8000 -e TOGETHER_API_KEY=your_api_key open-deep-research-backend
```

## Environment Variables

- `TOGETHER_API_KEY`: Your Together AI API key

### Setting up the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### Using Docker

If you prefer to use Docker:

```
docker-compose up --build
```

This will build and start both the frontend and backend services.

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter a research topic in the input field
3. Click "Start Deep Research"
4. View the summary in the pop-up modal
5. Explore the detailed report below

## License

MIT

## Acknowledgements

- [Together AI](https://together.ai/) for providing the AI API
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
