# Open Deep Research Web

A web application that leverages Together AI API to provide comprehensive research reports on any topic. It uses React for the frontend and FastAPI for the backend.

## Features

- Generate in-depth research reports on any topic
- Automatic summary generation
- Beautiful UI with pop-up modal for summaries
- Detailed full reports with expandable sections
- Responsive design

## Technology Stack

### Backend
- FastAPI
- Together AI API
- Python 3.12
- Pydantic for data validation
- Docker for containerization

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

5. **Set up your API key**:
   - Copy the example config file:
     ```powershell
     copy configs\open_deep_researcher_config.yaml.example configs\open_deep_researcher_config.yaml
     ```
   - Edit the file and replace `your_together_ai_api_key_here` with your actual Together AI API key
     (You can get an API key from [Together AI](https://together.ai/))

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

## License

MIT

## Acknowledgements

- [Together AI](https://together.ai/) for providing the AI API
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
