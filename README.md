# Open Deep Research Web

A comprehensive AI-powered research assistant web application that leverages Together AI API to provide in-depth research reports on any topic. Features local Stable Diffusion image generation capabilities with intelligent caching on the D drive to save C drive space.

## Features

### Frontend
- Generate in-depth research reports on any topic
- Beautiful UI with pop-up modal for summaries
- Detailed full reports with expandable sections
- Responsive design with modern React components
- Loading states and error handling
- Timeout handling for API requests
- Dynamic visualizations with Chart.js and Mermaid diagrams

### Backend
- FastAPI server with CORS support
- Integration with Together AI API for comprehensive research
- **Local Stable Diffusion for image generation**
- Intelligent prompt refinement for better images
- Automatic fallback to Pollinations.ai if local generation fails
- 10-minute timeout support for complex operations
- Python 3.8 compatibility with asyncio optimizations
- Comprehensive research report generation
- Summarization capabilities
- Robust error handling and fallback responses

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

<<<<<<< HEAD
### Frontend
- React
- Tailwind CSS with Typography plugin
- React Modal
- Heroicons

=======
>>>>>>> origin/main
### Backend
- FastAPI
- Together AI API
- Stable Diffusion (diffusers library)
- PyTorch
- Python 3.8+

<<<<<<< HEAD
## Requirements

- Python 3.8+
- Node.js (v14+)
- PyTorch
- CUDA-compatible GPU (recommended for faster image generation)
=======
### Frontend
- React
- Tailwind CSS with Typography plugin
- React Modal
- Heroicons
- Docker with Nginx for production

## Getting Started

### Prerequisites

1. **Install Git** (if not already installed)
   - Download from [git-scm.com](https://git-scm.com/downloads)

2. **Install Node.js and npm** (for frontend)
   - Download from [nodejs.org](https://nodejs.org/)

3. **Install Python** (version 3.8 or higher)
   - Download from [python.org](https://python.org/)

### Step 1: Clone the Repository

```powershell
git clone https://github.com/priyansh1913/open-deep-research-web.git
cd open-deep-research-web
```

### Step 2: Set Up the Backend

1. **Navigate to the backend directory**:
   ```powershell
   cd backend
   ```

2. **Create a virtual environment**:
   ```powershell
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   ```powershell
   .\venv\Scripts\activate
   ```

4. **Install dependencies**:
   ```powershell
   pip install fastapi uvicorn pydantic PyYAML requests
   ```
>>>>>>> origin/main

5. **Set up your API key**:
  
   - Edit the file  configs\open_deep_researcher_config.yaml and replace `your_together_ai_api_key_here` with your actual Together AI API key
   

6. **Start the backend server**:
   ```powershell
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

7. **Keep the terminal window open** and open a new terminal for the frontend setup

### Step 3: Set Up the Frontend

1. **Navigate to the frontend directory** (from the project root):
   ```powershell
   cd frontend
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Start the development server**:
   ```powershell
   npm start
   ```

4. **Your browser should automatically open** to http://localhost:3000

### Step 4: Use the Application

1. Enter a research topic in the text area
2. Click "Start Deep Research" 
3. Wait for the response
4. View the summary in the pop-up modal
5. Explore the detailed report below the input form

### Alternative: Using Docker

If you prefer to use Docker, you can run the entire application with just a few commands:

1. **Make sure you've set up your API key** in `backend/configs/open_deep_researcher_config.yaml`

2. **From the project root directory**, run:
   ```powershell
   docker-compose up --build
   ```

3. **Access the application** at http://localhost:3000

### Troubleshooting

1. **CORS issues**: If you encounter CORS errors, make sure both servers are running and check the backend console for errors.

2. **API key errors**: Verify your Together AI API key is correctly entered in the config file.

3. **Port conflicts**: If ports 3000 or 8000 are already in use, you can modify the port numbers in the respective configuration files.

4. **Missing dependencies**: If you encounter errors about missing packages, run the installation commands again.

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter a research topic in the input field
3. Click "Start Deep Research"
4. View the summary in the pop-up modal
5. Explore the detailed report below

## Branch Information

This repository contains several branches:

- `main`: The complete project with both frontend and backend
- `backend`: Contains only the backend FastAPI implementation
- `frontend`: Contains only the frontend React implementation
- `src`: Contains just the source code files for both components

## License

MIT

## Acknowledgements

- [Together AI](https://together.ai/) for providing the AI API
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
