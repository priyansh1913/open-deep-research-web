# Open Deep Research Web - Source Code

This branch contains the source code for both the frontend and backend components of the Open Deep Research web application.

## Project Structure

### Backend Source Code

- `backend/main.py`: FastAPI server setup and API endpoints
- `backend/together_open_deep_research.py`: Core implementation for research generation
- `backend/configs/open_deep_researcher_config.yaml`: Configuration settings

### Frontend Source Code

- `frontend/src/App.js`: Main React component with UI implementation
- `frontend/src/index.js`: React application entry point
- `frontend/src/index.css`: Global CSS and tailwind imports

## Features

- Generate in-depth research reports on any topic
- Automatic summary generation
- Beautiful UI with pop-up modal for summaries
- Detailed full reports with expandable sections
- Error handling and fallback responses

## Getting Started

For detailed setup instructions, see the README.md files in the respective branches:
- Backend setup: See the `backend` branch
- Frontend setup: See the `frontend` branch

### Setting up the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install fastapi uvicorn pydantic PyYAML requests
   ```

5. Set up your configuration:
   - Copy `configs/open_deep_researcher_config.yaml.example` to `configs/open_deep_researcher_config.yaml`
   - Add your Together AI API key to the configuration file

6. Start the server:
   ```
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

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
