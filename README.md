# Open Deep Research Web - Backend

This is the backend component of the Open Deep Research web application. It provides a FastAPI server that connects to the Together AI API to generate comprehensive research reports on any topic.

## Features

- FastAPI server with CORS support
- Integration with Together AI API
- Comprehensive research report generation
- Summarization capabilities
- Error handling and fallback responses

## Technology Stack

- FastAPI
- Together AI API
- Python 3.12
- Pydantic for data validation
- Docker for containerization

## Getting Started

### Prerequisites
- Python 3.8+ 
- Docker (optional)

### Setting up the Backend

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install fastapi uvicorn pydantic PyYAML requests
   ```

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
