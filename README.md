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

### Prerequisites (Install These First)
Before starting, make sure you have these installed:
- **Python 3.8+** - [Download from python.org](https://python.org/) (⚠️ Check "Add to PATH" during installation)
- **Node.js v14+** - [Download from nodejs.org](https://nodejs.org/) 
- **Git** - [Download from git-scm.com](https://git-scm.com/downloads)
- **At least 5GB free space** on your D drive (for AI models and cache)
- **Internet connection** (first run downloads ~2-4GB of AI models)

### Option 1: One-Click Start (Recommended) 

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/priyansh1913/open-deep-research-web.git
   cd open-deep-research-web
   ```

2. **Get your FREE API key** (Required):
   - Go to [Together AI](https://together.ai/) and sign up for a free account
   - Copy your API key from the dashboard
   - Navigate to `backend/configs/` folder
   - Copy `open_deep_researcher_config.yaml.example` to `open_deep_researcher_config.yaml`
   - Open the new file and replace `your_together_ai_api_key_here` with your actual API key

3. **Run the application**:
   ```powershell
   # Option A: Double-click this file in Windows Explorer
   start_app.bat
   
   # Option B: Run in PowerShell
   .\start_complete.ps1
   ```

4. **Wait and access** (be patient on first run):
   - First run takes 3-5 minutes to download AI models
   - Backend starts on `http://localhost:8000`
   - Frontend starts on `http://localhost:3000` 
   - Your browser should open automatically to `http://localhost:3000`

**That's it!**  The script automatically:
-  Installs all Python and Node.js dependencies
-  Sets up D-drive cache locations (saves C drive space)
-  Downloads required AI models (~2-4GB first time only)
-  Starts both backend and frontend servers
-  Opens the application in your browser

### Option 2: Docker (Alternative)
```powershell
# 1. Install Docker Desktop first
# 2. Clone the repo and set up API key (steps 1-2 above)
# 3. Run:
docker-compose up --build

# 4. Access at http://localhost:3000
```

### ⚠️ Common Issues & Solutions

**"Python not found" or "Node not found":**
- Reinstall Python/Node.js and make sure to check "Add to PATH"
- Restart your terminal/PowerShell after installation

**"Port already in use" errors:**
- Close any existing servers on ports 3000 or 8000
- Or modify ports in the configuration files

**"API key errors":**
- Double-check your Together AI API key is correctly copied
- Make sure you saved the config file after editing

**First image generation is slow:**
- Normal behavior - first image takes 2-5 minutes to load the model
- Subsequent images are much faster
- CPU users: expect slower performance than GPU users




###  What to Expect on First Run
- **Initial Setup**: 3-5 minutes to install dependencies and download AI models
- **Model Download**: ~2-4GB of AI models will be downloaded to D drive
- **First Image**: Takes 2-5 minutes to generate (subsequent images are much faster)
- **Stable Diffusion**: Automatic CPU/GPU detection with fallback support



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

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **Python**: 3.8 or higher
- **Node.js**: v14 or higher
- **RAM**: 8GB minimum (16GB recommended for image generation)
- **Storage**: 5GB free space on D drive for models and cache
- **Internet**: Broadband connection (for downloading models first time)

### Recommended for Best Performance
- **GPU**: NVIDIA GPU with CUDA support (for faster image generation)
- **RAM**: 16GB+ for smooth Stable Diffusion image generation
- **Storage**: SSD for faster model loading

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

##  How to Use

### Basic Research
1. **Open your browser** and navigate to `http://localhost:3000`
2. **Enter a research topic** in the input field (e.g., "artificial intelligence trends 2025")
3. **Click "Start Deep Research"** and wait for the analysis
4. **View the summary** in the pop-up modal that appears
5. **Explore the detailed report** below with interactive visualizations

### Advanced Features
- **Image Generation**: Research reports automatically include relevant AI-generated images
- **Interactive Charts**: Click and explore data visualizations created with Chart.js
- **Mermaid Diagrams**: View complex relationships and flowcharts
- **Export Options**: Copy text or save reports for later use

### Tips for Better Results
- **Be Specific**: "Machine learning in healthcare 2025" works better than just "AI"
- **Use Current Topics**: The AI has knowledge up to its training cutoff
- **Wait Patiently**: Complex research takes 30-60 seconds to complete
- **First Image**: The first AI image generation takes longer due to model loading

## 🔧 Troubleshooting

### Installation Issues

**" Python is not recognized as an internal or external command"**
- **Solution**: Reinstall Python from [python.org](https://python.org/) and check "Add Python to PATH"
- **Test**: Open new PowerShell and run `python --version`

** "Node is not recognized as an internal or external command"**
- **Solution**: Install Node.js from [nodejs.org](https://nodejs.org/) and restart your terminal
- **Test**: Run `node --version` and `npm --version`

** "Port 3000/8000 already in use"**
- **Solution**: Close other applications using these ports or restart your computer
- **Check**: Run `netstat -ano | findstr :3000` to see what's using the port

### API & Configuration Issues

** "API key errors" or "Unauthorized"**
- **Check**: Verify your Together AI API key is correctly copied in `backend/configs/open_deep_researcher_config.yaml`
- **Format**: Make sure there are no extra spaces or quotes around the API key
- **File**: Ensure you copied the `.example` file to create the config file

** "Configuration file not found"**
- **Solution**: Copy `backend/configs/open_deep_researcher_config.yaml.example` to `open_deep_researcher_config.yaml`
- **Location**: Must be in `backend/configs/` folder

### Performance Issues

** "First image generation takes forever"**
- **Normal**: First image takes 2-5 minutes to download and load the model (~2-4GB)
- **CPU Users**: Expect 5-10 minutes for first generation, 2-3 minutes for subsequent images
- **GPU Users**: Much faster after initial model download

** "Out of memory errors during image generation"**
- **Solution**: Close other applications to free up RAM
- **GPU**: Reduce image size or use CPU mode if GPU memory is insufficient
- **System**: Minimum 8GB RAM recommended, 16GB for smooth operation

### Network & Download Issues

** "Failed to download models" or "Connection timeout"**
- **Solution**: Check your internet connection and try again
- **Firewall**: Ensure Python and Node.js can access the internet
- **Size**: Models are 2-4GB total, so download may take time on slower connections

** "CORS errors" in browser**
- **Solution**: Make sure both backend (port 8000) and frontend (port 3000) are running
- **Check**: Backend should show "Server started" and frontend should open browser automatically

### Advanced Troubleshooting

** "D drive not accessible" or permission errors**
- **Solution**: Run PowerShell as Administrator or change cache location in startup script
- **Alternative**: Edit `start_complete.ps1` to use C drive (not recommended for space reasons)

** Still having issues?**
- **Check Logs**: Look at the console output from backend and frontend servers
- **Restart**: Try closing all windows and running `start_app.bat` again
- **Clean Start**: Delete `node_modules` folder in frontend and cache folders, then restart
- **Documentation**: Check [Stable Diffusion Quickstart Guide](./STABLE_DIFFUSION_QUICKSTART.md) for advanced setup

## Branch Information

This repository contains several branches:

- `main`: The complete project with both frontend and backend
- `backend`: Contains only the backend FastAPI implementation
- `frontend`: Contains only the frontend React implementation
- `src`: Contains just the source code files for both components

## License

MIT

##  Acknowledgements

- [Together AI](https://together.ai/) for providing the AI API
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Stable Diffusion](https://stability.ai/) for AI image generation
- [Hugging Face](https://huggingface.co/) for model hosting and tools
