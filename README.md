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

## 🚀 Quick Start (Easy Setup)

### Option 1: One-Click Start (Recommended)
1. **Clone the repository**:
   ```powershell
   git clone https://github.com/priyansh1913/open-deep-research-web.git
   cd open-deep-research-web
   ```

2. **Set up your API key**:
   - Edit `backend/configs/open_deep_researcher_config.yaml`
   - Replace `your_together_ai_api_key_here` with your actual Together AI API key
   - Get your free API key from [Together AI](https://together.ai/)

3. **Run the application**:
   - **Windows**: Double-click `start_app.bat` or run `.\start_complete.ps1` in PowerShell
   - **Manual**: Run `.\start_servers.ps1` in PowerShell

4. **Access the application** at `http://localhost:3000`

### Option 2: Docker (Simplest)
1. Make sure Docker is installed on your system
2. Clone the repository and set up your API key (steps 1-2 above)
3. Run: `docker-compose up --build`
4. Access at `http://localhost:3000`

That's it! The application will automatically install dependencies and start both frontend and backend servers.

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

### Backend
- FastAPI
- Together AI API
- Stable Diffusion (diffusers library)
- PyTorch
- Python 3.8+

### Frontend
- React
- Tailwind CSS with Typography plugin
- React Modal
- Heroicons
- Chart.js and Mermaid.js for visualizations
- Docker with Nginx for production

## Requirements

- Python 3.8+
- Node.js (v14+)
- PyTorch
- CUDA-compatible GPU (recommended for faster image generation)

## Manual Setup (Advanced Users)

<details>
<summary>Click to expand manual setup instructions</summary>

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
   pip install -r requirements.txt
   ```

5. **Set up your API key**:
   - Copy the example config file:
     ```powershell
     copy configs\open_deep_researcher_config.yaml.example configs\open_deep_researcher_config.yaml
     ```
   - Edit the file and replace `your_together_ai_api_key_here` with your actual Together AI API key

6. **Start the backend server**:
   ```powershell
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

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

</details>

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter a research topic in the input field
3. Click "Start Deep Research"
4. View the summary in the pop-up modal
5. Explore the detailed report below with visualizations

## Troubleshooting

1. **CORS issues**: Make sure both servers are running and check the backend console for errors
2. **API key errors**: Verify your Together AI API key is correctly entered in the config file
3. **Port conflicts**: If ports 3000 or 8000 are in use, modify the port numbers in configuration files
4. **Missing dependencies**: Run the installation commands again
5. **Stable Diffusion issues**: Check the [Stable Diffusion Quickstart Guide](./STABLE_DIFFUSION_QUICKSTART.md)

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

- [Together AI](https://together.ai/) for providing the AI API
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
