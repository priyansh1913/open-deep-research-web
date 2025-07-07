import os
import yaml
import logging
from typing import Dict, Any, List
import requests
from pathlib import Path
import time
import json
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResearchOrchestrator:
    def __init__(self, config_path: str = "configs/model_config.yaml"):
        """Initialize the research orchestrator with multiple model configurations."""
        try:
            # Try to load from environment variable first
            self.api_key = os.getenv('TOGETHER_API_KEY')
            
            # Load configuration file
            config_file = Path(config_path)
            if not config_file.exists():
                logger.warning(f"Configuration file not found: {config_path}")
                self.config = {
                    "together_api_key": self.api_key,
                    "models": {
                        "research": {
                            "model": "mistralai/Mistral-7B-Instruct-v0.2",
                            "temperature": 0.7,
                            "max_tokens": 1500,  # Reduced for faster response
                            "top_p": 0.9
                        },
                        "analysis": {
                            "model": "mistralai/Mistral-7B-Instruct-v0.2",
                            "temperature": 0.6,
                            "max_tokens": 1000,  # Reduced for faster response
                            "top_p": 0.9
                        },
                        "fact_checking": {
                            "model": "mistralai/Mistral-7B-Instruct-v0.2",
                            "temperature": 0.3,
                            "max_tokens": 800,   # Reduced for faster response
                            "top_p": 0.9
                        },
                        "summarization": {
                            "model": "mistralai/Mistral-7B-Instruct-v0.2",
                            "temperature": 0.5,
                            "max_tokens": 600,   # Reduced for faster response
                            "top_p": 0.9
                        }
                    },
                    "prompt_templates": {
                        "initial_research": """Conduct comprehensive research on the topic: "{topic}"
                        
Please provide detailed information including:
1. Basic facts and overview
2. Key historical information
3. Current status and developments
4. Important figures or entities involved
5. Recent news or updates
6. Relevant statistics or data

Provide accurate, well-structured information that would be useful for someone wanting to understand this topic thoroughly.""",

                        "fact_checking": """Review the following research content for accuracy and completeness:

{research_content}

Please:
1. Identify any claims that need verification
2. Point out potential inaccuracies or biases
3. Suggest additional reliable sources
4. Highlight any missing important information
5. Provide confidence levels for key facts

Focus on ensuring the information is reliable and well-sourced.""",

                        "deep_analysis": """Perform a deep analysis of the following research content:

{research_content}

Please provide:
1. Critical analysis of the key points
2. Connections between different aspects
3. Broader implications and context
4. Potential controversies or debates
5. Comparative analysis with related topics
6. Future trends or developments

Provide thoughtful insights that go beyond the surface-level information.""",

                        "insights_generation": """Based on the following research data, generate key insights:

{research_content}

Please identify:
1. The most important takeaways
2. Surprising or counterintuitive findings
3. Patterns or trends that emerge
4. Practical applications or implications
5. Questions that arise from the research
6. Areas requiring further investigation

Focus on actionable insights and meaningful conclusions.""",

                        "summarization": """Create a comprehensive summary of the following research:

{research_content}

Provide:
1. Executive summary (2-3 sentences)
2. Key findings (bullet points)
3. Main conclusions
4. Important context
5. Significance of the findings

Keep it concise but comprehensive, suitable for someone who wants a quick overview.""",

                        "report_compilation": """Compile a final research report based on the following components:

Research Content: {research_content}
Fact Check Results: {fact_check_results}
Analysis: {analysis_results}
Insights: {insights}

Create a well-structured, professional report that includes:
1. Executive Summary
2. Introduction
3. Key Findings
4. Detailed Analysis
5. Insights and Implications
6. Conclusions
7. Areas for Further Research

Format the report in markdown with clear headings and structure."""
                    }
                }
            else:
                try:
                    with open(config_file, 'r') as f:
                        self.config = yaml.safe_load(f)
                    logger.info("Loaded model configuration successfully")
                except Exception as yaml_error:
                    logger.error(f"Error parsing YAML file: {str(yaml_error)}")
                    # Use default configuration
                    self.config = {
                        "together_api_key": self.api_key,
                        "models": {
                            "research": {
                                "model": "mistralai/Mistral-7B-Instruct-v0.2",
                                "temperature": 0.7,
                                "max_tokens": 1500,  # Reduced for faster response
                                "top_p": 0.9
                            },
                            "analysis": {
                                "model": "mistralai/Mistral-7B-Instruct-v0.2",
                                "temperature": 0.6,
                                "max_tokens": 1000,  # Reduced for faster response
                                "top_p": 0.9
                            },
                            "fact_checking": {
                                "model": "mistralai/Mistral-7B-Instruct-v0.2",
                                "temperature": 0.3,
                                "max_tokens": 800,   # Reduced for faster response
                                "top_p": 0.9
                            },
                            "summarization": {
                                "model": "mistralai/Mistral-7B-Instruct-v0.2",
                                "temperature": 0.5,
                                "max_tokens": 600,   # Reduced for faster response
                                "top_p": 0.9
                            }
                        },
                        "prompt_templates": {
                            "initial_research": """Conduct comprehensive research on the topic: "{topic}"
                            
Please provide detailed information including:
1. Basic facts and overview
2. Key historical information
3. Current status and developments
4. Important figures or entities involved
5. Recent news or updates
6. Relevant statistics or data

Provide accurate, well-structured information that would be useful for someone wanting to understand this topic thoroughly.""",

                            "fact_checking": """Review the following research content for accuracy and completeness:

{research_content}

Please:
1. Identify any claims that need verification
2. Point out potential inaccuracies or biases
3. Suggest additional reliable sources
4. Highlight any missing important information
5. Provide confidence levels for key facts

Focus on ensuring the information is reliable and well-sourced.""",

                            "deep_analysis": """Perform a deep analysis of the following research content:

{research_content}

Please provide:
1. Critical analysis of the key points
2. Connections between different aspects
3. Broader implications and context
4. Potential controversies or debates
5. Comparative analysis with related topics
6. Future trends or developments

Provide thoughtful insights that go beyond the surface-level information.""",

                            "insights_generation": """Based on the following research data, generate key insights:

{research_content}

Please identify:
1. The most important takeaways
2. Surprising or counterintuitive findings
3. Patterns or trends that emerge
4. Practical applications or implications
5. Questions that arise from the research
6. Areas requiring further investigation

Focus on actionable insights and meaningful conclusions.""",

                            "summarization": """Create a comprehensive summary of the following research:

{research_content}

Provide:
1. Executive summary (2-3 sentences)
2. Key findings (bullet points)
3. Main conclusions
4. Important context
5. Significance of the findings

Keep it concise but comprehensive, suitable for someone who wants a quick overview.""",

                            "report_compilation": """Compile a final research report based on the following components:

Research Content: {research_content}
Fact Check Results: {fact_check_results}
Analysis: {analysis_results}
Insights: {insights}

Create a well-structured, professional report that includes:
1. Executive Summary
2. Introduction
3. Key Findings
4. Detailed Analysis
5. Insights and Implications
6. Conclusions
7. Areas for Further Research

Format the report in markdown with clear headings and structure."""
                        }
                    }
                    
            # If no API key in environment, try config file
            if not self.api_key:
                self.api_key = self.config.get('together_api_key')
            
            if not self.api_key:
                raise ValueError(
                    "Together API key not found. Please ensure it is set in either:\n"
                    f"1. Environment variable 'TOGETHER_API_KEY'\n"
                    f"2. Configuration file: {config_path}"
                )
            
            logger.info("API key configured successfully")
            
        except Exception as e:
            error_msg = str(e)
            if "API key not found" in error_msg:
                logger.error("API Key Configuration Error:")
                logger.error(error_msg)
            else:
                logger.error(f"Error initializing ResearchOrchestrator: {error_msg}")
            raise

    async def conduct_research(self, topic: str, fast_mode: bool = False) -> Dict[str, Any]:
        """
        Orchestrate the complete research workflow using multiple models.
        
        Args:
            topic: The research topic
            fast_mode: If True, use a streamlined workflow for faster results (default: False for comprehensive research)
            
        Returns:
            Dict containing the complete research results
        """
        try:
            logger.info(f"Starting research workflow for topic: {topic} (fast_mode: {fast_mode})")
            research_data = {}
            
            if fast_mode:
                # Streamlined workflow for faster results
                return await self._conduct_fast_research(topic)
            else:
                # Full comprehensive workflow
                return await self._conduct_full_research(topic)
                
        except Exception as e:
            logger.error(f"Error in research workflow: {str(e)}")
            raise

    async def _conduct_fast_research(self, topic: str) -> Dict[str, Any]:
        """Fast research workflow with fewer steps for quicker results"""
        try:
            research_data = {}
            
            # Step 1: Main Research (combining initial research and analysis)
            try:
                main_research_prompt = f"""Conduct comprehensive research on the topic: "{topic}"
                
Please provide a detailed but concise research report including:
1. Basic facts and overview
2. Key historical information
3. Current status and recent developments
4. Important figures or entities involved
5. Key insights and analysis
6. Practical implications

Focus on accuracy and relevance. Provide a well-structured response suitable for someone wanting to understand this topic thoroughly."""

                research_data['main_research'] = await self._execute_research_step(
                    'research',
                    main_research_prompt
                )
                logger.info("Main research step completed successfully")
            except Exception as e:
                logger.error(f"Error in main research step: {str(e)}")
                research_data['main_research'] = f"Research could not be completed due to: {str(e)}"
            
            # Step 2: Quick Summary
            try:
                summary_prompt = f"""Create a concise summary of the following research about "{topic}":

{research_data.get('main_research', 'No research data available')}

Provide:
1. Executive summary (2-3 sentences)
2. Key findings (3-5 bullet points)
3. Main conclusion
4. Significance

Keep it brief but informative."""

                research_data['summary'] = await self._execute_research_step(
                    'summarization',
                    summary_prompt
                )
                logger.info("Summary step completed successfully")
            except Exception as e:
                logger.error(f"Error in summary step: {str(e)}")
                research_data['summary'] = "Summary could not be generated due to technical issues."

            # Prepare the final output
            final_report = f"""# Research Report: {topic}

## Summary
{research_data.get('summary', 'Summary not available')}

## Detailed Research
{research_data.get('main_research', 'Research data not available')}

---
*This report was generated using fast research mode for quicker results.*
"""

            return {
                'full_report': final_report,
                'summary': research_data['summary'],
                'main_research': research_data['main_research'],
                'metadata': {
                    'topic': topic,
                    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'mode': 'fast',
                    'models_used': ['research', 'summarization']
                }
            }
            
        except Exception as e:
            logger.error(f"Error in fast research workflow: {str(e)}")
            # Return basic fallback response
            return {
                'full_report': f"# Research Report: {topic}\n\nThe research system encountered technical difficulties. Please try again later.",
                'summary': "Research could not be completed due to technical issues.",
                'main_research': "Research data unavailable",
                'metadata': {
                    'topic': topic,
                    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'mode': 'fast',
                    'error': str(e)
                }
            }

    async def _conduct_full_research(self, topic: str) -> Dict[str, Any]:
        """Full comprehensive research workflow (original implementation)"""
    async def _conduct_full_research(self, topic: str) -> Dict[str, Any]:
        """Full comprehensive research workflow (original implementation)"""
        try:
            logger.info(f"Starting comprehensive research workflow for topic: {topic}")
            research_data = {}
            
            # Step 1: Initial Research
            try:
                research_data['initial_research'] = await self._execute_research_step(
                    'research',
                    self.config['prompt_templates']['initial_research'].format(topic=topic)
                )
                logger.info("Initial research step completed successfully")
            except Exception as e:
                logger.error(f"Error in initial research step: {str(e)}")
                research_data['initial_research'] = f"Initial research could not be completed due to: {str(e)}"
            
            # Step 2: Fact Checking
            try:
                research_data['fact_check'] = await self._execute_research_step(
                    'fact_checking',
                    self.config['prompt_templates']['fact_checking'].format(
                        research_content=research_data.get('initial_research', 'No initial research available')
                    )
                )
                logger.info("Fact checking step completed successfully")
            except Exception as e:
                logger.error(f"Error in fact checking step: {str(e)}")
                research_data['fact_check'] = "Fact checking could not be completed"
            
            # Step 3: Deep Analysis
            try:
                research_data['analysis'] = await self._execute_research_step(
                    'analysis',
                    self.config['prompt_templates']['deep_analysis'].format(
                        research_content=research_data.get('initial_research', 'No initial research available')
                    )
                )
                logger.info("Analysis step completed successfully")
            except Exception as e:
                logger.error(f"Error in analysis step: {str(e)}")
                research_data['analysis'] = "Deep analysis could not be completed"
            
            # Step 4: Generate Insights
            try:
                research_data['insights'] = await self._execute_research_step(
                    'analysis',
                    self.config['prompt_templates']['insights_generation'].format(
                        research_content=json.dumps({k: v for k, v in research_data.items() if k in ['initial_research', 'analysis']})
                    )
                )
                logger.info("Insights generation step completed successfully")
            except Exception as e:
                logger.error(f"Error in insights generation step: {str(e)}")
                research_data['insights'] = "Insights could not be generated"
            
            # Step 5: Create Summary
            try:
                research_data['summary'] = await self._execute_research_step(
                    'summarization',
                    self.config['prompt_templates']['summarization'].format(
                        research_content=json.dumps({k: v for k, v in research_data.items() if k in ['initial_research', 'analysis']})
                    )
                )
                logger.info("Summary step completed successfully")
            except Exception as e:
                logger.error(f"Error in summary step: {str(e)}")
                research_data['summary'] = "The research assistant encountered technical difficulties creating a summary."
            
            # Step 6: Compile Final Report
            try:
                final_report = await self._execute_research_step(
                    'research',
                    self.config['prompt_templates']['report_compilation'].format(
                        research_content=research_data.get('initial_research', 'No initial research available'),
                        fact_check_results=research_data.get('fact_check', 'No fact check available'),
                        analysis_results=research_data.get('analysis', 'No analysis available'),
                        insights=research_data.get('insights', 'No insights available')
                    )
                )
                logger.info("Report compilation step completed successfully")
            except Exception as e:
                logger.error(f"Error in report compilation step: {str(e)}")
                # Create a basic report from available components
                final_report = f"""# Research Report on {topic}

## Summary
{research_data.get('summary', 'Summary could not be generated due to technical issues.')}

## Research Findings
{research_data.get('initial_research', 'Initial research could not be completed due to technical issues.')}

## Analysis
{research_data.get('analysis', 'Analysis could not be completed due to technical issues.')}

## Insights
{research_data.get('insights', 'Insights could not be generated due to technical issues.')}

*Note: This report was generated with limited functionality due to technical issues.*
"""
            
            # Prepare the final output
            return {
                'full_report': final_report,
                'summary': research_data['summary'],
                'insights': research_data['insights'],
                'fact_check': research_data['fact_check'],
                'metadata': {
                    'topic': topic,
                    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'mode': 'comprehensive',
                    'models_used': list(self.config['models'].keys())
                }
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive research workflow: {str(e)}")
            raise

    async def _execute_research_step(self, model_type: str, prompt: str) -> str:
        """
        Execute a single research step using the specified model.
        
        Args:
            model_type: The type of model to use (research, summarization, etc.)
            prompt: The prompt to send to the model
            
        Returns:
            The model's response
        """
        try:
            # Check if the model type exists in config
            if model_type not in self.config['models']:
                logger.error(f"Model type '{model_type}' not found in configuration")
                return f"Error: Model type '{model_type}' is not configured"
            
            model_config = self.config['models'][model_type]
            logger.info(f"Executing research step with model type: {model_type}")
            
            # Call Together API
            response = await self._call_together_api(
                prompt=prompt,
                model=model_config['model'],
                temperature=model_config['temperature'],
                max_tokens=model_config['max_tokens'],
                top_p=model_config['top_p']
            )
            
            # If the response is very short or contains error messages, provide a fallback
            if len(response) < 20 or "error" in response.lower():
                logger.warning(f"Received potentially problematic response: {response}")
                return self._generate_fallback_response(model_type, prompt)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in research step {model_type}: {str(e)}")
            return self._generate_fallback_response(model_type, prompt)
    
    def _generate_fallback_response(self, model_type: str, prompt: str) -> str:
        """Generate a fallback response when the API call fails"""
        logger.info(f"Generating fallback response for {model_type}")
        
        if model_type == 'research':
            return f"The research assistant encountered technical difficulties while researching this topic. Please try again later or refine your query."
        
        elif model_type == 'fact_checking':
            return "Fact checking could not be completed due to technical limitations. Please verify information from reliable sources."
        
        elif model_type == 'analysis':
            return "Analysis could not be completed at this time due to technical issues."
        
        elif model_type == 'summarization':
            return "A summary could not be generated due to technical difficulties."
        
        else:
            return f"The {model_type} operation could not be completed due to technical issues."

    async def _call_together_api(self, prompt: str, model: str, temperature: float, 
                               max_tokens: int, top_p: float) -> str:
        """
        Call the Together API with specified parameters.
        
        Args:
            prompt: The prompt to send
            model: The model to use
            temperature: Temperature setting
            max_tokens: Maximum tokens to generate
            top_p: Top-p sampling parameter
            
        Returns:
            The model's response text
        """
        try:
            # List of models to try in order of preference
            models_to_try = [
                model,  # Original requested model
                "mistralai/Mistral-7B-Instruct-v0.2",  # Fallback model 1
                "microsoft/DialoGPT-medium",  # Fallback model 2
                "togethercomputer/RedPajama-INCITE-Chat-3B-v1"  # Fallback model 3
            ]
            
            # Remove duplicates while preserving order
            models_to_try = list(dict.fromkeys(models_to_try))
            
            for model_to_use in models_to_try:
                try:
                    logger.info(f"Calling Together AI API with model: {model_to_use}")
                    
                    # Try chat completions endpoint first (modern API)
                    url = "https://api.together.xyz/v1/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                    
                    # Format the request for the chat completions API
                    data = {
                        "model": model_to_use,
                        "messages": [
                            {"role": "system", "content": "You are a helpful, accurate research assistant."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "top_p": top_p
                    }
                    
                    response = requests.post(url, headers=headers, json=data, timeout=30)  # Reduced timeout
                    logger.info(f"API response status code: {response.status_code}")
                    
                    if response.status_code == 200:
                        result = response.json()
                        if "choices" in result and len(result["choices"]) > 0:
                            if "message" in result["choices"][0]:
                                content = result["choices"][0]["message"]["content"].strip()
                                if content and len(content) > 10:  # Valid response
                                    logger.info(f"Successfully got response from model: {model_to_use}")
                                    return content
                    
                    # If chat completions failed, try legacy completions endpoint
                    logger.info("Chat completions endpoint failed, trying legacy completions endpoint")
                    url = "https://api.together.xyz/v1/completions"
                    data = {
                        "model": model_to_use,
                        "prompt": prompt,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                        "top_p": top_p,
                        "timeout": 30
                    }
                    
                    response = requests.post(url, headers=headers, json=data, timeout=30)  # Reduced timeout
                    logger.info(f"Legacy API response status code: {response.status_code}")
                    
                    if response.status_code == 200:
                        result = response.json()
                        if "choices" in result and len(result["choices"]) > 0:
                            content = result["choices"][0].get("text", "").strip()
                            if content and len(content) > 10:  # Valid response
                                logger.info(f"Successfully got response from model: {model_to_use}")
                                return content
                    
                except Exception as model_error:
                    logger.warning(f"Model {model_to_use} failed: {str(model_error)}")
                    continue
            
            # If all models failed, return a fallback message
            logger.error("All API models failed to respond")
            return f"The research assistant is currently unavailable. All API models failed to respond."
            
        except Exception as e:
            logger.error(f"API call error: {str(e)}")
            # Return a fallback response instead of raising an exception
            return f"The research assistant is currently unavailable. Error: {str(e)}"

    async def generate_follow_up_questions(self, research_data: Dict[str, Any]) -> List[str]:
        """
        Generate intelligent follow-up questions based on the research.
        
        Args:
            research_data: The complete research data dictionary
            
        Returns:
            List of follow-up questions
        """
        try:
            prompt = f"""Based on this research:
            {json.dumps(research_data)}
            
            Generate 5 insightful follow-up questions that would:
            1. Explore unexplored aspects
            2. Dive deeper into interesting findings
            3. Challenge assumptions
            4. Connect different concepts
            5. Investigate practical applications
            
            Return only the questions, one per line."""
            
            response = await self._execute_research_step('analysis', prompt)
            questions = [q.strip() for q in response.split('\n') if q.strip()]
            return questions[:5]  # Ensure we only return 5 questions
            
        except Exception as e:
            logger.error(f"Error generating follow-up questions: {str(e)}")
            return [
                "What are the major challenges in this field?",
                "How might this research be applied in practice?",
                "What are the future implications of these findings?",
                "How does this compare to alternative approaches?",
                "What are the key limitations of current research?"
            ]

    async def process_follow_up(self, original_research: Dict[str, Any], 
                              question: str) -> str:
        """
        Process a follow-up question using the appropriate model.
        
        Args:
            original_research: The original research data
            question: The follow-up question
            
        Returns:
            Detailed answer to the follow-up question
        """
        try:
            prompt = f"""Based on this research:
            {json.dumps(original_research)}
            
            Provide a detailed answer to this follow-up question:
            {question}
            
            Consider:
            1. Direct information from the research
            2. Logical implications
            3. Related concepts
            4. Practical applications
            5. Limitations and uncertainties
            
            Provide a comprehensive yet focused answer."""
            
            return await self._execute_research_step('research', prompt)
            
        except Exception as e:
            logger.error(f"Error processing follow-up question: {str(e)}")
            raise
