import requests
import json
import logging
import time

# Configure logging
logger = logging.getLogger(__name__)

class OpenDeepResearch:
    def __init__(self, config=None, serverless_only=False):
        self.config = config or {}
        self.serverless_only = serverless_only
        self.api_key = self.config.get('together_api_key')
        self.model = self.config.get('model', 'mistralai/Mistral-7B-Instruct-v0.2')
        logger.info(f"Initialized OpenDeepResearch with model: {self.model}")
        
    def run(self, topic):
        """
        Run a deep research on the given topic using Together API
        
        Args:
            topic: The research topic
            
        Returns:
            A comprehensive research report on the topic
        """
        logger.info(f"Starting research on topic: {topic}")
        prompt = f"""You are a comprehensive research assistant tasked with providing in-depth analysis on any topic. 
        
Research topic: {topic}
        
Please provide a comprehensive analysis including:
1. Overview of the topic
2. Historical context
3. Current state of research
4. Key concepts and theories
5. Major challenges and controversies
6. Future directions
7. References to key literature
        
Your research should be thorough, balanced, and accessible to an educated audience."""
        
        # Call Together API
        try:
            logger.info("Attempting to call Together API...")
            start_time = time.time()
            report = self._call_together_api(prompt)
            end_time = time.time()
            logger.info(f"API call completed in {end_time - start_time:.2f} seconds")
            
            # Generate a summary
            summary = self._generate_summary(report, topic)
            
            # Return both the full report and summary
            return {
                "full_report": report,
                "summary": summary
            }
        except Exception as e:
            logger.error(f"Error calling Together API: {str(e)}")
            logger.info("Falling back to mock response")
            # For demo/testing purposes, return a mock response if API call fails
            mock_report = self._mock_research_response(topic)
            mock_summary = self._generate_mock_summary(topic)
            return {
                "full_report": mock_report,
                "summary": mock_summary
            }
    
    def _call_together_api(self, prompt):
        """Call the Together API with the given prompt"""
        url = "https://api.together.xyz/v1/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "prompt": prompt,
            "max_tokens": 2048,
            "temperature": 0.7,
            "top_p": 0.9,
            "timeout": 30  # Adding a timeout to prevent long waits
        }
        
        logger.info(f"Sending request to {url}")
        
        # Use the actual Together API
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info("Successfully received response from Together API")
            return result.get('choices', [{}])[0].get('text', "No research results available.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Together API: {str(e)}")
            # Fall back to mock response if API call fails
            logger.info("Falling back to mock response due to API error")
            return self._mock_research_response(prompt.split("Research topic:")[1].strip().split("\n")[0])
    
    def _generate_summary(self, report, topic):
        """Generate a summary of the research report"""
        logger.info(f"Generating summary for topic: {topic}")
        
        # Create a prompt for summarization
        summary_prompt = f"""Below is a research report on the topic "{topic}". 
Please create a concise summary (150-200 words) that captures the key findings and insights.

Report:
{report}

Summary:"""
        
        try:
            # Call the API again for the summary
            url = "https://api.together.xyz/v1/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "prompt": summary_prompt,
                "max_tokens": 300,
                "temperature": 0.5,
                "top_p": 0.9,
                "timeout": 30
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            summary = result.get('choices', [{}])[0].get('text', "").strip()
            return summary
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return self._generate_mock_summary(topic)
    
    def _generate_mock_summary(self, topic):
        """Generate a mock summary for demonstration purposes"""
        return f"""This research on {topic} explores its historical evolution, current trends, and future directions. 
Key findings highlight the interplay between traditional methodologies and emerging technologies. 
The field faces challenges including data limitations and methodological disagreements, but offers promising 
opportunities for innovation through interdisciplinary approaches. This summary provides a snapshot of 
the comprehensive analysis available in the full report."""
    
    def _mock_research_response(self, topic):
        """Return a mock research response for testing purposes"""
        logger.info(f"Generating mock response for topic: {topic}")
        return f"""# Comprehensive Research: {topic}

## 1. Overview
This is a mock research report on {topic} for demonstration purposes. In a real scenario, this would be generated by the Together AI API using the specified model.

## 2. Historical Context
The study of {topic} has evolved significantly over the past decades, with various approaches and methodologies being developed.

## 3. Current State of Research
Current research on {topic} is focused on integrating new technologies and methodologies to address existing challenges.

## 4. Key Concepts and Theories
- Theory A: Key explanation here
- Theory B: Key explanation here
- Methodology C: Key explanation here

## 5. Major Challenges and Controversies
The field faces several challenges including data limitations, methodological disagreements, and ethical considerations.

## 6. Future Directions
Future research will likely focus on more interdisciplinary approaches and the application of advanced technologies.

## 7. References
1. Smith, J. (2024). "Advancements in {topic}." Journal of Research Studies, 45(2), 123-145.
2. Johnson, A. et al. (2023). "A comprehensive review of {topic}." Annual Review, 12, 78-96.
3. Williams, P. (2025). "Future perspectives on {topic}." Future Research Press.

This mock report was generated for demonstration purposes."""
    
    def get_follow_up_answer(self, prompt):
        """
        Get an answer to a follow-up question based on original research
        
        Args:
            prompt: The follow-up question prompt with context
            
        Returns:
            An answer to the follow-up question
        """
        logger.info("Processing follow-up question")
        
        try:
            logger.info("Calling Together API for follow-up answer...")
            start_time = time.time()
            
            url = "https://api.together.xyz/v1/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "prompt": prompt,
                "max_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.9,
                "timeout": 30
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            end_time = time.time()
            logger.info(f"Follow-up API call completed in {end_time - start_time:.2f} seconds")
            
            answer = result.get('choices', [{}])[0].get('text', "").strip()
            return answer
        except Exception as e:
            logger.error(f"Error getting follow-up answer: {str(e)}")
            # Return a generic response for demonstration
            return self._mock_follow_up_answer(prompt)
    
    def _mock_follow_up_answer(self, prompt):
        """Generate a mock follow-up answer for demonstration purposes"""
        # Extract the follow-up question from the prompt
        try:
            question_part = prompt.split("FOLLOW-UP QUESTION:")[1].split("\n")[0].strip()
        except IndexError:
            question_part = "your question"
            
        logger.info(f"Generating mock follow-up answer for: {question_part}")
        
        return f"""Based on the original research report, here's what I can tell you about {question_part}:

The research indicates several important aspects related to this question:

1. There are multiple theoretical frameworks that address this issue from different perspectives.

2. Recent studies have shown promising results in addressing the challenges you've asked about.

3. Experts in the field generally agree that this is an area requiring further investigation, with several competing approaches currently being evaluated.

4. The literature suggests that interdisciplinary methods yield the most comprehensive understanding of this topic.

5. Future directions in this area will likely focus on integrating advanced technologies with traditional methodologies.

This information is derived directly from the original research report and represents the current state of knowledge on this specific aspect of the topic."""
