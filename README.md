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
- Node.js (v14+)
- Python 3.8+ 
- Docker and Docker Compose (optional)

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
