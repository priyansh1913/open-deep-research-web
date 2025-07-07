import yaml
from together_open_deep_research import OpenDeepResearch
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        try:
            with open("configs/open_deep_researcher_config.yaml", "r") as f:
                config = yaml.safe_load(f)
            self.researcher = OpenDeepResearch(config)
            logger.info("ResearchService initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ResearchService: {str(e)}")
            raise

    async def process_research_request(self, topic: str):
        """
        Process a research request for a given topic
        
        Args:
            topic: The topic to research
            
        Returns:
            dict: Contains the full research report and a summary
        """
        try:
            logger.info(f"Processing research request for topic: {topic}")
            result = self.researcher.run(topic)
            return {
                "status": "success",
                "data": result
            }
        except Exception as e:
            logger.error(f"Error processing research request: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def process_follow_up_question(self, original_research: str, question: str):
        """
        Process a follow-up question based on previous research
        
        Args:
            original_research: The original research report
            question: The follow-up question
            
        Returns:
            str: The answer to the follow-up question
        """
        try:
            logger.info(f"Processing follow-up question: {question}")
            prompt = f"""Based on the following research report, please answer this follow-up question.

ORIGINAL RESEARCH:
{original_research}

FOLLOW-UP QUESTION:
{question}

Please provide a detailed answer based solely on the information from the original research."""
            
            answer = self.researcher.get_follow_up_answer(prompt)
            return {
                "status": "success",
                "data": {"answer": answer}
            }
        except Exception as e:
            logger.error(f"Error processing follow-up question: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
