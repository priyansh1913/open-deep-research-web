import { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { XMarkIcon, LightBulbIcon, DocumentTextIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import DynamicResearchResults from "./components/DynamicResearchResults";
// Set the app element for accessibility
Modal.setAppElement("#root");

function App() {  
  const [topic, setTopic] = useState("");
  const [currentResearchTopic, setCurrentResearchTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [report, setReport] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const [researchDate, setResearchDate] = useState("");
  const [keyTopics, setKeyTopics] = useState([]);
  const [challenges, setChallenges] = useState("");
  const [futureDirections, setFutureDirections] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // Dynamic research states
  const [currentResults, setCurrentResults] = useState(null);

  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages with a small delay to allow content to render
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close modal when escape key is pressed
  useEffect(() => {    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setReportModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, []);
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    
    // Store the current research topic
    setCurrentResearchTopic(topic);
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: topic,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
      // Clear input
    setTopic("");
    
    // Check if this is a prompt refinement request
    const promptRefinementKeywords = [
      'refine prompt', 'improve prompt', 'enhance prompt', 'better prompt',
      'optimize prompt', 'refine my prompt', 'improve my prompt', 'enhance my prompt',
      'make prompt better', 'help with prompt', 'prompt help'
    ];
    
    const isPromptRefinementRequest = promptRefinementKeywords.some(keyword => 
      topic.toLowerCase().includes(keyword)
    );
    
    if (isPromptRefinementRequest) {
      // Extract the prompt to refine (usually after keywords like "refine prompt:")
      let promptToRefine = topic;
      // Try to extract prompt after common patterns
      const patterns = [
        /refine prompt:?\s*(.*)/i,
        /improve prompt:?\s*(.*)/i,
        /enhance prompt:?\s*(.*)/i,
        /better prompt for:?\s*(.*)/i,
        /optimize prompt:?\s*(.*)/i
      ];
      
      for (const pattern of patterns) {
        const match = topic.match(pattern);
        if (match && match[1].trim()) {
          promptToRefine = match[1].trim();
          break;
        }
      }
      
      await handlePromptRefinement(promptToRefine);
      return;
    }
    
    // Check if this is an image generation request
    const imageKeywords = [
      'generate image', 'create image', 'make image', 'draw', 'picture of', 
      'image of', 'show me', 'visualize', 'illustrate', 'create a picture',
      'generate a picture', 'make a picture', 'draw me', 'sketch', 'artwork',
      'create art', 'design', 'render', 'paint', 'create visual', 'generate a visual'
    ];
    
    // Also check if the prompt starts with image-related phrases
    const imageStartPhrases = [
      'draw', 'create', 'generate', 'make', 'show', 'visualize', 'illustrate',
      'paint', 'sketch', 'design', 'render'
    ];
    
    const isImageRequest = imageKeywords.some(keyword => 
      topic.toLowerCase().includes(keyword)
    ) || imageStartPhrases.some(phrase => 
      topic.toLowerCase().startsWith(phrase + ' ') || 
      topic.toLowerCase().startsWith(phrase + ' a ') ||
      topic.toLowerCase().startsWith(phrase + ' an ')
    );
    
    if (isImageRequest) {
      // Handle image generation
      await handleImageGeneration(topic);
      return;
    }
    
    // Show loading message for research
    setLoading(true);
    setError("");
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout for comprehensive research
    
    try {
      console.log("Sending request to backend...");
      
      // Add typing indicator
      const typingId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: typingId,
        text: "Researching...",
        sender: 'assistant',
        isTyping: true
      }]);
      
      const res = await fetch("http://localhost:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: userMessage.text }),
        signal: controller.signal
      });
      
      console.log("Response received:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || `Server returned ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Data received:", data);
      
      if (!data || !data.report) {
        throw new Error("Invalid response format from server");
      }
      
      // Parse the data to extract full report and summary
      const reportData = typeof data.report === "string" 
        ? { full_report: data.report, summary: "" } 
        : data.report;
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
      
      // Process results with dynamic analysis
      const results = {
        report: reportData.full_report || data.report,
        summary: data.summary || reportData.summary,
        suggested_questions: data.suggested_questions || []
      };
      
      setCurrentResults(results);
      
      // Generate a summary if one wasn't provided
      let summaryText = results.summary;
      if (!summaryText || summaryText.trim() === "") {
        // Use the first few sentences of the full report as a summary
        const sentences = results.report.match(/[^.!?]+[.!?]+/g) || [];
        summaryText = sentences.slice(0, 3).join(' ');
      }
      
      // Generate context-aware follow-up questions based on the report content
      const contextAwareFollowUps = generateContextAwareFollowUps(results.report, currentResearchTopic);
      
      // Add assistant message with summary instead of full report
      const assistantMessage = {
        id: Date.now() + 2,
        text: summaryText || "Here's what I found on this topic.",
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        hasDetails: true,
        suggestedFollowUps: contextAwareFollowUps,
        results: results
      };
      setMessages(prev => [...prev, assistantMessage]);
      // Store the full report for viewing in modal and parse the data
      setReport(results.report);
      setSummary(summaryText);
      // Legacy parsing replaced by dynamic components
      extractAdditionalInfo(reportData.full_report);
      
      // Set the research date
      setResearchDate(new Date().toLocaleString());
      
      // Extract additional information from the report
      extractAdditionalInfo(results.report);
    } catch (e) {
      console.error("Error in handleSubmit:", e);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 3,
        text: e.name === 'AbortError' 
          ? "The research took longer than 4 minutes to complete. Please try a more specific query or try again." 
          : `Error: ${e.message || "An unknown error occurred"}`,
        sender: 'assistant',
        isError: true,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      if (e.name === 'AbortError') {
        setError("Research request timed out after 4 minutes. Please try a more specific query or try again later.");
      } else {
        setError(e.message || "An unknown error occurred");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Handle follow-up questions with dynamic analysis
  const handleFollowUpQuestion = async (question) => {
    setTopic(question);
    await handleSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };  const MessageContent = ({ message, onViewReport }) => {
    const textColorClass = message.sender === 'user' ? 'text-white' : 'text-gray-900';
    
    if (message.image || message.imageUrl) {
      return (
        <div className="flex flex-col gap-3">
          <p className={textColorClass}>{message.text}</p>
          <img 
            src={message.image || message.imageUrl} 
            alt="Generated image"
            className="rounded-lg max-w-md w-full object-contain shadow-lg"
            loading="lazy"
            style={{ maxHeight: "80vh" }}
          />
        </div>
      );
    }

    if (message.text) {
      return (
        <div className={textColorClass}>
          {message.text}
          
          {message.hasDetails && (
            <button
              onClick={() => onViewReport()}
              className="mt-3 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              View Dynamic Report
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={textColorClass}>
        {message.text}
      </div>
    );
  };

  // Format the report content into sections
  const formatReport = (content) => {
    if (!content) return [];
    
    // Split the content by headers (## or #)
    const sections = content.split(/(?=##?\s+)/);
    
    return sections.map((section, index) => {
      // Extract the header if it exists
      const headerMatch = section.match(/^(##?\s+)(.+)$/m);
      const header = headerMatch ? headerMatch[2].trim() : (index === 0 ? "Overview" : `Section ${index + 1}`);
      const level = headerMatch && headerMatch[1].includes("##") ? 2 : 1;
      const content = headerMatch ? section.replace(/^##?\s+.+$/m, '').trim() : section.trim();
      
      return { header, content, level, id: `section-${index}` };
    });
  };
  const extractAdditionalInfo = (reportText) => {
    // Reset previous values
    setKeyTopics([]);
    setChallenges("");
    setFutureDirections("");

    if (!reportText) return;

    // Parse the sections from the report
    const sections = formatReport(reportText);
    
    // Find key concepts section - look for multiple possible headings
    const conceptsSection = sections.find(section => 
      /key\s*concepts|main\s*concepts|concepts|theories|terminology|key\s*topics|important\s*terms/i.test(section.header)
    );
    
    if (conceptsSection) {
      // Extract bullet points or numbered lists
      let lines = conceptsSection.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());
      
      // First try to find bullet points
      const bulletPoints = lines.filter(line => 
        line.startsWith('-') || line.startsWith('•') || line.startsWith('*')
      );
      
      // If bullet points found, use them
      if (bulletPoints.length > 0) {
        setKeyTopics(bulletPoints.map(line => line.replace(/^[-•*]\s*/, '')));
      } else {
        // Try to find numbered lists
        const numberedPoints = lines.filter(line => /^\d+\.\s/.test(line));
        
        if (numberedPoints.length > 0) {
          setKeyTopics(numberedPoints.map(line => line.replace(/^\d+\.\s*/, '')));
        } else {
          // If no structured lists found, try to extract important sentences
          // Split content by sentences
          const sentences = conceptsSection.content.match(/[^.!?]+[.!?]+/g) || [];
          console.log("Sentences:", sentences);
          
          // Filter meaningful sentences
          const meaningfulSentences = sentences
            .filter(s => {
              const trimmed = s.trim();
              return trimmed.length > 15 && 
                     !(/^(However|Therefore|Thus|Additionally|Moreover|Furthermore|In addition)/i.test(trimmed));
            })
            .map(s => s.trim());
          
          // Take a reasonable number of sentences
          setKeyTopics(meaningfulSentences.slice(0, 7));
        }
      }
    } else {
      // If no dedicated section found, try to extract key concepts from introduction or overview
      const introSection = sections.find(section => 
        /introduction|overview|background/i.test(section.header) || section.id === 'section-0'
      );
      
      if (introSection) {
        // Split content by sentences
        const sentences = introSection.content.match(/[^.!?]+[.!?]+/g) || [];
        
        // First look for definitions or key terms
        const definitionSentences = sentences
          .filter(s => {
            const trimmed = s.trim();
            return /is defined as|refers to|is a|are|means|represents|encompasses|constitutes|comprises/i.test(trimmed) && 
                   trimmed.length > 20;
          })
          .map(s => s.trim());
        
        if (definitionSentences.length > 0) {
          setKeyTopics(definitionSentences);
        } else {
          // Look for sentences with important keywords
          const keywordSentences = sentences
            .filter(s => {
              const trimmed = s.trim();
              return (/important|key|fundamental|essential|significant|critical|core|primary|central|main/i.test(trimmed) || 
                      trimmed.includes(':')) && 
                     trimmed.length > 20;
            })
            .map(s => s.trim());
          
          if (keywordSentences.length > 0) {
            setKeyTopics(keywordSentences);
          } else {
            // If no special sentences found, take a few substantive sentences
            setKeyTopics(
              sentences
                .filter(s => {
                  const trimmed = s.trim();
                  return trimmed.length > 30 && 
                         !(/^(However|Therefore|Thus|Additionally|Moreover|Furthermore|In addition)/i.test(trimmed));
                })
                .slice(1, 6)
                .map(s => s.trim())
            );
          }
        }
      }
    }

    // Find challenges section - look for multiple possible headings
    const challengesSection = sections.find(section => 
      /challenges|difficulties|limitations|problems|obstacles|controversies|issues|drawbacks/i.test(section.header)
    );
    
    if (challengesSection) {
      // Split content by lines
      const lines = challengesSection.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());
      
      // Extract bullet points or numbered lists
      const structuredPoints = lines.filter(line => 
        line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\.\s/.test(line)
      );
      
      if (structuredPoints.length > 0) {
        // Format as a proper bullet list
        const formattedPoints = structuredPoints
          .map(point => point.replace(/^[-•*\d\.]\s*/, '').trim())
          .filter(point => point.length > 0)
          .map(point => `• ${point}`)
          .join('\n\n');
        
        setChallenges(formattedPoints);
      } else {
        // If no structured points, try to identify sentences
        const sentences = challengesSection.content.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length > 0) {
          // Format as bullet points
          const formattedSentences = sentences
            .map(s => s.trim())
            .filter(s => s.length > 15)
            .map(s => `• ${s}`)
            .join('\n\n');
          
          setChallenges(formattedSentences);
        } else {
          // If all else fails, use the raw content with minimal formatting
          setChallenges(challengesSection.content.trim());
        }
      }
    } else {
      // Look for challenges mentioned in other sections
      const otherSections = sections.filter(section => 
        !/introduction|overview|conclusion|summary|references/i.test(section.header)
      );
      
      // Search for sentences mentioning challenges
      let challengeSentences = [];
      otherSections.forEach(section => {
        const sentences = section.content.match(/[^.!?]+[.!?]+/g) || [];
        const relevant = sentences.filter(s => 
          /challenge|difficult|limitation|problem|obstacle|controversy|drawback|issue/i.test(s)
        );
        challengeSentences = [...challengeSentences, ...relevant];
      });
      
      if (challengeSentences.length > 0) {
        // Format as bullet points
        const formattedSentences = challengeSentences
          .map(s => s.trim())
          .filter(s => s.length > 15)
          .map(s => `• ${s}`)
          .join('\n\n');
        
        setChallenges(formattedSentences);
      }
    }

    // Find future directions section - look for multiple possible headings
    const futureSection = sections.find(section => 
      /future|directions|outlook|prospects|opportunities|next\s*steps|recommendations|potential|implications/i.test(section.header)
    );
    
    if (futureSection) {
      // Split content by lines
      const lines = futureSection.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim());
      
      // Extract bullet points or numbered lists
      const structuredPoints = lines.filter(line => 
        line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\.\s/.test(line)
      );
      
      if (structuredPoints.length > 0) {
        // Format as a proper bullet list
        const formattedPoints = structuredPoints
          .map(point => point.replace(/^[-•*\d\.]\s*/, '').trim())
          .filter(point => point.length > 0)
          .map(point => `• ${point}`)
          .join('\n\n');
        
        setFutureDirections(formattedPoints);
      } else {
        // If no structured points, try to identify sentences
        const sentences = futureSection.content.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length > 0) {
          // Format as bullet points
          const formattedSentences = sentences
            .map(s => s.trim())
            .filter(s => s.length > 15)
            .map(s => `• ${s}`)
            .join('\n\n');
          
          setFutureDirections(formattedSentences);
        } else {
          // If all else fails, use the raw content with minimal formatting
          setFutureDirections(futureSection.content.trim());
        }
      }
    } else {
      // Look for future directions mentioned in conclusion or other sections
      const conclusionSection = sections.find(section => 
        /conclusion|final|summary/i.test(section.header) || section.id === `section-${sections.length - 1}`
      );
      
      if (conclusionSection) {
        const sentences = conclusionSection.content.match(/[^.!?]+[.!?]+/g) || [];
        const futureSentences = sentences.filter(s => 
          /future|next|recommend|suggest|potential|direction|opportunity|prospect|may|might|could|would|should/i.test(s)
        );
        
        if (futureSentences.length > 0) {
          // Format as bullet points
          const formattedSentences = futureSentences
            .map(s => s.trim())
            .filter(s => s.length > 15)
            .map(s => `• ${s}`)
            .join('\n\n');
          
          setFutureDirections(formattedSentences);
        }
      }
    }
  };


  // Handle follow-up questions
  const handleFollowUp = async (question) => {
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: question,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading message
    setLoading(true);
    
    // Add typing indicator
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: typingId,
      text: "Thinking...",
      sender: 'assistant',
      isTyping: true
    }]);
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout for follow-up research
    
    try {
      console.log("Sending follow-up request to backend...");
      
      const latestReport = messages
        .filter(msg => msg.sender === 'assistant' && !msg.isTyping && !msg.isError && !msg.isFollowUp)
        .pop();
      
      // Get the original topic from the first user message
      const originalTopic = messages
        .find(msg => msg.sender === 'user')?.text || "";
      
      const res = await fetch("http://localhost:8000/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: question,
          originalTopic: originalTopic,
          originalReport: latestReport ? latestReport.text : (report ? report : null)
        }),
        signal: controller.signal
      });
      
      console.log("Follow-up response received:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Follow-up error response:", errorText);
        throw new Error(`Error: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Follow-up data:", data);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
      
      // Add assistant response
      const assistantMessage = {
        id: Date.now() + 2,
        text: data.answer || "I couldn't find a good answer to your follow-up question.",
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isFollowUp: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Follow-up error:", error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        text: `Sorry, I encountered an error while processing your follow-up question: ${error.message}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };  // Function to refine prompts without generating images
  const handlePromptRefinement = async (prompt) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: typingId,
      text: "Refining your prompt...",
      sender: 'assistant',
      isTyping: true
    }]);
    
    try {
      const res = await fetch("http://localhost:8000/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
        signal: controller.signal
      });
      
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server returned ${res.status}`);
      }
      
      const data = await res.json();
      
      const assistantMessage = {
        id: Date.now(),
        text: `Here's your refined prompt:\n\n**Original:** "${data.original_prompt}"\n\n**Enhanced:** "${data.refined_prompt}"\n\nYou can now use this enhanced prompt for better image generation!`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (e) {
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
      
      const errorMessage = {
        id: Date.now(),
        text: `Sorry, I couldn't refine your prompt: ${e.message || "An unknown error occurred"}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);    } finally {
      clearTimeout(timeoutId);
    }
  };
  
  // Function to handle image generation
  const handleImageGeneration = async (prompt) => {
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout for image generation (first run may download models)
    
    // Add typing indicator for image generation
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: typingId,
      text: "Refining your prompt and generating image...\nThis may take a few minutes if using the CPU or loading models for the first time.",
      sender: 'assistant',
      isTyping: true
    }]);
    
    try {
      const res = await fetch("http://localhost:8000/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
        signal: controller.signal
      });
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
        if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server returned ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data || (!data.image_url && !data.image_base64)) {
        throw new Error("Invalid response format from server");
      }
      
      // Create an image URL from base64 if that's what we got
      const imageUrl = data.image_url || `data:image/png;base64,${data.image_base64}`;
        // Add just a simple message with the image, removing the enhanced prompt display
      const assistantMessage = {
        id: Date.now(),
        text: `Here's your generated image:`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        imageUrl: imageUrl,
        originalPrompt: data.original_prompt || prompt,
        refinedPrompt: data.refined_prompt || prompt
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (e) {
      // Remove typing indicator on error
      setMessages(prev => prev.filter(msg => msg.id !== typingId));
        console.error("Error in image generation:", e);
      
      // Add error message to chat
      let errorMsg = "An unknown error occurred";
      
      if (e.name === 'AbortError') {
        errorMsg = "Image generation took too long. The first run may take longer while downloading models. Please try again.";
      } else if (e.message && e.message.includes("CUDA")) {
        errorMsg = `${e.message}\n\nPlease see the CUDA_TROUBLESHOOTING.md file for instructions on fixing CUDA issues.`;
      } else if (e.message) {
        errorMsg = e.message;
      }
      
      const errorMessage = {
        id: Date.now(),
        text: `Sorry, I couldn't generate the image: ${errorMsg}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      clearTimeout(timeoutId);
    }
  };
  
  // Add welcome message when component mounts
  useEffect(() => {
    // Add a slight delay to make it seem like the assistant is typing
    const timer = setTimeout(() => {
      setMessages([
        {
          id: Date.now(),
          text: "Hello! I'm your AI research assistant. I can research topics for you or generate images. Try asking 'Research climate change' or 'Generate image of a futuristic city'. What would you like me to help you with today?",
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const sections = formatReport(report);
  // Generate context-aware follow-up questions based on the report content
  const generateContextAwareFollowUps = (reportText, topic) => {
    if (!reportText) {
      return [
        "What are the main challenges in this field?",
        "What future directions are most promising?",
        "Can you explain the key concepts in simpler terms?",
        "What are the practical applications of this research?"
      ];
    }

    // Convert to lowercase for easier pattern matching
    const lowerReport = reportText.toLowerCase();
    const lowerTopic = topic.toLowerCase();
    
    // Prepare a list of possible follow-up questions based on the topic and content
    const possibleQuestions = [];
    
    // Check for domain-specific keywords to generate relevant questions
    const domains = {
      'ai': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'algorithm', 'data science', 'nlp', 'natural language processing'],
      'medicine': ['medical', 'health', 'disease', 'patient', 'treatment', 'clinical', 'pharmaceutical', 'doctor', 'hospital', 'drug'],
      'technology': ['technology', 'software', 'hardware', 'digital', 'computer', 'internet', 'tech', 'coding', 'programming', 'web development'],
      'physics': ['physics', 'quantum', 'particle', 'energy', 'matter', 'force', 'relativity', 'thermodynamics', 'gravity'],
      'business': ['business', 'market', 'economy', 'finance', 'investment', 'company', 'economic', 'stock', 'entrepreneur', 'startup'],
      'environment': ['environment', 'climate', 'sustainable', 'green', 'pollution', 'ecosystem', 'conservation', 'renewable', 'biodiversity'],
      'psychology': ['psychology', 'mental', 'behavior', 'cognitive', 'brain', 'therapy', 'emotion', 'psychologist', 'counseling', 'mind'],
      'politics': ['politics', 'government', 'policy', 'election', 'political', 'democracy', 'law', 'legislation', 'voting', 'parliament'],
      'entertainment': ['actor', 'actress', 'movie', 'film', 'cinema', 'hollywood', 'director', 'celebrity', 'entertainment', 'star', 'performance', 'role', 'character'],
      'music': ['music', 'song', 'album', 'band', 'artist', 'singer', 'musician', 'concert', 'genre', 'record', 'lyrics'],
      'sports': ['sports', 'athlete', 'player', 'team', 'game', 'competition', 'championship', 'olympic', 'tournament', 'match'],
      'history': ['history', 'historical', 'ancient', 'century', 'era', 'civilization', 'empire', 'revolution', 'dynasty', 'medieval']
    };
    
    // Count keyword matches for each domain to determine relevance strength
    const domainRelevanceScores = {};
    let highestScore = 0;
    let mostRelevantDomain = '';
    
    for (const [domain, keywords] of Object.entries(domains)) {
      let score = 0;
      for (const keyword of keywords) {
        // Check topic - these are more significant matches
        if (lowerTopic.includes(keyword)) {
          score += 3;  // Higher weight for topic matches
        }
        
        // Count occurrences in report
        const regex = new RegExp(keyword, 'g');
        const matches = (lowerReport.match(regex) || []).length;
        score += matches;
      }
      
      domainRelevanceScores[domain] = score;
      
      // Track highest scoring domain
      if (score > highestScore) {
        highestScore = score;
        mostRelevantDomain = domain;
      }
    }
    
    // Identify the domains that are actually relevant (have a meaningful score)
    // A domain is relevant if its score is at least 20% of the highest score or above a minimum threshold
    const relevantDomains = [];
    const minimumThreshold = 2;  // Minimum score to be considered relevant
    
    for (const [domain, score] of Object.entries(domainRelevanceScores)) {
      if (score >= Math.max(minimumThreshold, highestScore * 0.2)) {
        relevantDomains.push(domain);
      }
    }
    
    console.log("Topic:", topic);
    console.log("Relevant domains:", relevantDomains);
    console.log("Domain scores:", domainRelevanceScores);
    
    // Add domain-specific questions based on identified domains
    if (relevantDomains.includes('entertainment')) {
      possibleQuestions.push(
        "How has their career evolved over time?",
        "What were their most critically acclaimed performances?",
        "How have they influenced the entertainment industry?",
        "What notable collaborations have they had with other actors or directors?"
      );
      
      // If it's likely about a specific actor/actress
      if (lowerReport.includes('actor') || lowerReport.includes('actress') || lowerReport.includes('star')) {
        possibleQuestions.push(
          "What acting techniques or methods are they known for?",
          "How has their public image changed throughout their career?",
          "What genres are they most associated with?",
          "How do critics typically evaluate their performances?"
        );
      }
    }
    
    if (relevantDomains.includes('ai')) {
      possibleQuestions.push(
        "How does this AI technology compare to existing solutions?",
        "What ethical concerns arise from this AI application?",
        "How is this AI technology trained and what data does it use?",
        "What are the computational requirements for implementing this AI approach?"
      );
    }
    
    if (relevantDomains.includes('medicine')) {
      possibleQuestions.push(
        "What are the clinical implications of this research?",
        "Has this treatment been tested in clinical trials?",
        "What are the potential side effects or risks?",
        "How does this compare to current standard treatments?"
      );
    }
    
    if (relevantDomains.includes('technology')) {
      possibleQuestions.push(
        "How scalable is this technology solution?",
        "What are the implementation challenges for this technology?",
        "How does this technology integrate with existing systems?",
        "What are the security implications of this technology?"
      );
    }
    
    if (relevantDomains.includes('physics')) {
      possibleQuestions.push(
        "How does this align with the standard model of physics?",
        "What experimental evidence supports these findings?",
        "What are the theoretical implications of this discovery?",
        "How might this change our understanding of fundamental forces?"
      );
    }
    
    if (relevantDomains.includes('business')) {
      possibleQuestions.push(
        "What's the potential market impact of this development?",
        "How might this affect investment strategies in the sector?",
        "What companies are leading in this area?",
        "What's the economic outlook for this industry?"
      );
    }
    
    if (relevantDomains.includes('environment')) {
      possibleQuestions.push(
        "What are the environmental impacts of this approach?",
        "How does this contribute to sustainability goals?",
        "What policy changes might support this environmental solution?",
        "How does this compare to other conservation strategies?"
      );
    }
    
    if (relevantDomains.includes('psychology')) {
      possibleQuestions.push(
        "How does this affect our understanding of human behavior?",
        "What therapeutic applications might this research have?",
        "How is this measured or assessed in clinical settings?",
        "What are the social implications of these psychological findings?"
      );
    }
    
    if (relevantDomains.includes('politics')) {
      possibleQuestions.push(
        "What political factors influence this issue?",
        "How might this affect policy development?",
        "What are the regulatory implications?",
        "How do different political systems approach this issue?"
      );
    }
    
    if (relevantDomains.includes('music')) {
      possibleQuestions.push(
        "How has their musical style evolved over time?",
        "What influences can be heard in their work?",
        "How have they impacted the music industry?",
        "What are considered their most significant compositions or albums?"
      );
    }
    
    if (relevantDomains.includes('sports')) {
      possibleQuestions.push(
        "What training methods do they use?",
        "How do they compare to others in their sport?",
        "What records or achievements are they known for?",
        "How have they influenced their sport?"
      );
    }
    
    if (relevantDomains.includes('history')) {
      possibleQuestions.push(
        "How has this historical event been interpreted over time?",
        "What primary sources provide insight into this period?",
        "How did this influence subsequent historical developments?",
        "What contemporary perspectives exist on this historical topic?"
      );
    }
    
    // Check for specific content patterns to generate additional contextual questions
    if (lowerReport.includes('challenge') || lowerReport.includes('problem') || lowerReport.includes('difficult')) {
      possibleQuestions.push("What are the biggest challenges in this area?");
    }
    
    if (lowerReport.includes('future') || lowerReport.includes('development') || lowerReport.includes('potential')) {
      possibleQuestions.push("What future developments are expected in this field?");
    }
    
    if (lowerReport.includes('application') || lowerReport.includes('practical') || lowerReport.includes('implement')) {
      possibleQuestions.push("What are the practical applications of this research?");
    }
    
    if (lowerReport.includes('controversy') || lowerReport.includes('debate') || lowerReport.includes('disagree')) {
      possibleQuestions.push("What are the main points of debate or controversy in this area?");
    }
    
    if (lowerReport.includes('compare') || lowerReport.includes('difference') || lowerReport.includes('versus')) {
      possibleQuestions.push("How does this compare with alternative approaches or perspectives?");
    }
    
    if (lowerReport.includes('history') || lowerReport.includes('evolution') || lowerReport.includes('development')) {
      possibleQuestions.push("How has this subject evolved over time?");
    }
    
    if (lowerReport.includes('example') || lowerReport.includes('case study') || lowerReport.includes('instance')) {
      possibleQuestions.push("Can you provide more specific examples or case studies?");
    }
    
    // Extract proper nouns as potential subjects of interest
    const properNouns = extractProperNouns(reportText);
    const mainSubject = properNouns.length > 0 ? properNouns[0] : topic;
    
    // Add some general follow-up questions that work for most topics, using the main subject
    possibleQuestions.push(
      `What are considered ${mainSubject}'s greatest achievements?`,
      `How has public perception of ${mainSubject} changed over time?`,
      `What are common misconceptions about ${mainSubject}?`,
      `What's the historical significance of ${mainSubject}?`
    );
    
    // If we don't have enough questions, add very generic ones that would work for any topic
    if (possibleQuestions.length < 4) {
      possibleQuestions.push(
        "Can you elaborate more on this topic?",
        "What aspects of this topic are most interesting to researchers?",
        "How has this field evolved in recent years?",
        "What resources would you recommend for learning more about this?"
      );
    }
    
    // Shuffle the questions and take 4 questions
    const shuffled = possibleQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    
    return selected;
  };
  
  // Helper function to extract proper nouns from text
  const extractProperNouns = (text) => {
    if (!text) return [];
    
    // Simple heuristic: words that start with uppercase letters that aren't at the beginning of sentences
    const words = text.split(/\s+/);
    const properNouns = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].trim();      // Skip words at the beginning of sentences or empty words
      if (i === 0 || !word || word.length < 2) continue;
      
      // Check if previous word ends with sentence-ending punctuation
      const prevWord = words[i-1];
      const isPrevWordEndOfSentence = /[.!?]$/.test(prevWord);
      
      // If it's not the start of a sentence and starts with uppercase
      if (!isPrevWordEndOfSentence && /^[A-Z][a-z]+$/.test(word)) {
        // Check if it's a common word that shouldn't be considered (like "I", "The", etc.)
        const commonWords = ["I", "The", "A", "An", "This", "That", "These", "Those", "My", "Your", "His", "Her"];
        if (!commonWords.includes(word)) {
          properNouns.push(word);
        }
      }
    }
    
    // Count occurrences of each proper noun
    const counts = {};
    properNouns.forEach(noun => {
      counts[noun] = (counts[noun] || 0) + 1;
    });
    
    // Sort by occurrence count (most frequent first)
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  };
  
  return (
    <div className="w-full mx-auto p-2 sm:p-4 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-4">        <div className="chat-header p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center">
            <LightBulbIcon className="h-7 w-7 mr-2 text-yellow-300" />
            Open Deep Research Chat
          </h1>
        </div>
      </div>
        {/* Chat messages container */}
      <div className="flex-grow bg-white shadow-lg rounded-lg p-4 mb-4 overflow-hidden flex flex-col">        <div className="flex-grow overflow-y-auto mb-4 px-4 message-container" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <LightBulbIcon className="h-16 w-16 mb-4 text-indigo-200" />
              <p className="text-center text-lg">Ask a research question to get started!</p>
              <p className="text-center text-sm mt-2">Example: "What are the latest advancements in quantum computing?"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-1">                      <MessageContent 
                        message={message}
                        onViewReport={() => setReportModalOpen(true)}
                      />
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp}
                    </div>
                    {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Suggested follow-up questions:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedFollowUps.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => setTopic(question)}
                              className="text-sm px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}        <div className="space-y-4">
          {/* Research question input */}          <div className="flex space-x-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a research question or request an image..."
              className="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !topic.trim()}
              className={`p-3 rounded-lg ${
                loading || !topic.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white transition-colors`}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>
      {/* Dynamic Research Results Modal */}
      <Modal
        isOpen={reportModalOpen}
        onRequestClose={() => setReportModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-40"
        closeTimeoutMS={300}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl mx-auto overflow-hidden transform transition-all h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Research Results</h2>
              <p className="text-sm text-indigo-100 mt-1">
                {currentResearchTopic} • {researchDate}
              </p>
            </div>
            <button
              onClick={() => setReportModalOpen(false)}
              className="text-white hover:text-indigo-100 focus:outline-none transition-transform hover:scale-110"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Dynamic Content */}
          <div className="h-[calc(90vh-5rem)] overflow-y-auto">
            {currentResults ? (
              <DynamicResearchResults
                query={currentResearchTopic}
                results={currentResults}
                onFollowupQuestion={handleFollowUpQuestion}
              />
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No research data available</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
  
    </div>
  );
}

export default App;
