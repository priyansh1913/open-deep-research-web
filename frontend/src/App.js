import { useState, useEffect } from "react";
import Modal from "react-modal";
import { XMarkIcon, LightBulbIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

// Set the app element for accessibility
Modal.setAppElement("#root");

function App() {
  const [topic, setTopic] = useState("");
  const [report, setReport] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [researchDate, setResearchDate] = useState("");
  const [keyTopics, setKeyTopics] = useState([]);
  const [challenges, setChallenges] = useState("");
  const [futureDirections, setFutureDirections] = useState("");

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setModalIsOpen(false);
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
    setLoading(true);
    setError("");
    setReport(null);
    setSummary("");
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      console.log("Sending request to backend...");
      const res = await fetch("http://localhost:8000/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
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
      
      setReport(reportData.full_report);
      setSummary(reportData.summary);
      
      // Set the research date
      setResearchDate(new Date().toLocaleString());
      
      // Extract additional information from the report
      extractAdditionalInfo(reportData.full_report);
      
      // Automatically open the summary modal when data is received
      setModalIsOpen(true);
    } catch (e) {
      console.error("Error in handleSubmit:", e);
      if (e.name === 'AbortError') {
        setError("Request timed out. Please try again later.");
      } else {
        setError(e.message || "An unknown error occurred");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Parse the markdown content into sections
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
      // First try to extract bullet points
      let lines = conceptsSection.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'));
      
      // If no bullet points found, try to extract numbered points
      if (lines.length === 0) {
        lines = conceptsSection.content.split('\n')
          .filter(line => line.trim())
          .map(line => line.trim())
          .filter(line => /^\d+\.\s/.test(line));
      }
      
      // If still no structured points found, try to extract sentences
      if (lines.length === 0) {
        const sentences = conceptsSection.content.match(/[^.!?]+[.!?]+/g) || [];
        // Filter out very short sentences and take the most meaningful ones
        const meaningfulSentences = sentences
          .filter(s => s.trim().length > 20 && !/^(However|Therefore|Thus|Additionally|Moreover)/i.test(s.trim()))
          .map(s => s.trim());
        setKeyTopics(meaningfulSentences);
      } else {
        // Clean up the bullet points (remove the bullet character and any leading space)
        setKeyTopics(lines.map(line => line.replace(/^[-•*\d\.]\s*/, '')));
      }
    } else {
      // If no dedicated section found, try to extract key concepts from introduction or overview
      const introSection = sections.find(section => 
        /introduction|overview|background/i.test(section.header) || section.id === 'section-0'
      );
      
      if (introSection) {
        const sentences = introSection.content.match(/[^.!?]+[.!?]+/g) || [];
        
        // First look for definitions or key terms (sentences containing "is defined as", "refers to", etc.)
        const definitionPattern = /is defined as|refers to|is a|are|means|represents|encompasses|constitutes|comprises/i;
        let definitionSentences = sentences.filter(s => definitionPattern.test(s) && s.trim().length > 30);
        
        // If we found definitions, use them as key topics
        if (definitionSentences.length > 0) {
          setKeyTopics(definitionSentences.map(s => s.trim()));
        } else {
          // Otherwise, look for sentences with important keywords
          const keywordPattern = /important|key|fundamental|essential|significant|critical|core|primary|central|main/i;
          const conceptSentences = sentences
            .filter(s => (keywordPattern.test(s) || s.includes(':')) && s.trim().length > 30)
            .map(s => s.trim());
          
          if (conceptSentences.length > 0) {
            setKeyTopics(conceptSentences);
          } else {
            // If no sentences with keywords, take substantive sentences from the beginning
            const substantiveSentences = sentences
              .filter(s => s.trim().length > 40 && !/^(However|Therefore|Thus|Additionally|Moreover)/i.test(s.trim()))
              .slice(1, 6)
              .map(s => s.trim());
            
            setKeyTopics(substantiveSentences);
          }
        }
      }
    }

    // Find challenges section - look for multiple possible headings
    const challengesSection = sections.find(section => 
      /challenges|difficulties|limitations|problems|obstacles|controversies|issues|drawbacks/i.test(section.header)
    );
    
    if (challengesSection) {
      // Extract structured points if available
      const bulletPoints = challengesSection.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\.\s/.test(line));
      
      if (bulletPoints.length > 0) {
        // Format the challenges as a list
        setChallenges(bulletPoints
          .map(point => point.replace(/^[-•*\d\.]\s*/, ''))
          .join('\n\n• ')
          .replace(/^/, '• '));
      } else {
        // Just use the raw content with some formatting
        setChallenges(challengesSection.content);
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
        setChallenges(challengeSentences.join('\n\n'));
      }
    }

    // Find future directions section - look for multiple possible headings
    const futureSection = sections.find(section => 
      /future|directions|outlook|prospects|opportunities|next\s*steps|recommendations|potential|implications/i.test(section.header)
    );
    
    if (futureSection) {
      // Extract structured points if available
      const bulletPoints = futureSection.content.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\.\s/.test(line));
      
      if (bulletPoints.length > 0) {
        // Format the future directions as a list
        setFutureDirections(bulletPoints
          .map(point => point.replace(/^[-•*\d\.]\s*/, ''))
          .join('\n\n• ')
          .replace(/^/, '• '));
      } else {
        // Just use the raw content with some formatting
        setFutureDirections(futureSection.content);
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
          setFutureDirections(futureSentences.join('\n\n'));
        }
      }
    }
  };

  const sections = formatReport(report);

  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-indigo-800 flex items-center">
          <LightBulbIcon className="h-8 w-8 mr-2 text-yellow-500" />
          Open Deep Research
        </h1>
        
        <div className="mb-6">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Research Topic
          </label>
          <textarea
            id="topic"
            className="w-full border border-gray-300 rounded-md p-3 mb-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Enter your research topic here..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !topic.trim()}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Research...
              </>
            ) : (
              <>Start Deep Research</>
            )}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {report && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 prose max-w-none">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center m-0">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
              Research Results
            </h2>
            {summary && (
              <button 
                onClick={() => setModalIsOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <LightBulbIcon className="h-5 w-5 mr-1 text-yellow-300" />
                View Insights
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-200">
            {sections.map((section, index) => (
              <div key={section.id} className="py-4">
                <div 
                  className={`flex justify-between items-center cursor-pointer ${section.level === 1 ? 'font-bold text-xl' : 'font-semibold text-lg'}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <h3 className={`m-0 ${section.level === 1 ? 'text-indigo-800' : 'text-indigo-600'}`}>
                    {section.header}
                  </h3>
                  {expandedSections[section.id] ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {(index === 0 || expandedSections[section.id]) && (
                  <div className="mt-2 text-gray-700 whitespace-pre-wrap">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Research Summary"
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-40"
        closeTimeoutMS={300}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-auto overflow-hidden transform transition-all animate-modalEntry">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-800 px-6 py-5 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <LightBulbIcon className="h-7 w-7 mr-3 text-yellow-300" />
              Research Insights
            </h2>
            <button
              onClick={() => setModalIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none transition-transform hover:scale-110"
            >
              <XMarkIcon className="h-7 w-7" />
            </button>
          </div>
          
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="prose max-w-none">
              {/* Topic section */}
              <div className="mb-5 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-xl font-semibold text-indigo-800 flex items-center">
                  <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 mr-2 flex items-center justify-center shadow-sm">
                    <span className="font-bold">Q</span>
                  </span>
                  Research Topic
                </h3>
                <div className="ml-10 mt-2">
                  <div className="bg-gradient-to-r from-gray-50 to-indigo-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
                    <p className="text-gray-800 font-medium">{topic}</p>
                  </div>
                </div>
              </div>
              
              {/* Summary section */}
              <div className="mb-5 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-xl font-semibold text-indigo-800 flex items-center">
                  <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 mr-2 flex items-center justify-center shadow-sm">
                    <span className="font-bold">S</span>
                  </span>
                  Summary
                </h3>
                <div className="ml-10 mt-2">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 shadow-sm text-gray-800 whitespace-pre-wrap">
                    {summary || "No summary available for this research."}
                  </div>
                </div>
              </div>

              {/* Key concepts section */}
              {keyTopics.length > 0 && (
                <div className="mb-5 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center">
                    <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 mr-2 flex items-center justify-center shadow-sm">
                      <span className="font-bold">K</span>
                    </span>
                    Key Concepts
                  </h3>
                  <div className="ml-10 mt-2">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 shadow-sm max-h-80 overflow-y-auto">
                      <ul className="list-disc pl-5 space-y-3 text-gray-800">
                        {keyTopics.map((topic, index) => (
                          <li key={index} className="leading-relaxed animate-slideInRight" style={{ animationDelay: `${0.4 + index * 0.1}s` }}>
                            <div className="font-medium">{topic}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Challenges section */}
              {challenges && (
                <div className="mb-5 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center">
                    <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 mr-2 flex items-center justify-center shadow-sm">
                      <span className="font-bold">C</span>
                    </span>
                    Challenges & Limitations
                  </h3>
                  <div className="ml-10 mt-2">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 shadow-sm text-gray-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
                      {challenges}
                    </div>
                  </div>
                </div>
              )}

              {/* Future directions section */}
              {futureDirections && (
                <div className="mb-5 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                  <h3 className="text-xl font-semibold text-indigo-800 flex items-center">
                    <span className="inline-block w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 mr-2 flex items-center justify-center shadow-sm">
                      <span className="font-bold">F</span>
                    </span>
                    Future Directions
                  </h3>
                  <div className="ml-10 mt-2">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 shadow-sm text-gray-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
                      {futureDirections}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata section */}
              <div className="mt-6 ml-10 flex justify-between text-xs text-gray-500 border-t border-gray-200 pt-3 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                <div>
                  <p>Generated: {researchDate}</p>
                </div>
                <div className="text-right">
                  <p>Model: {report ? "mistralai/Mistral-7B-Instruct-v0.2" : "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-8 py-4 flex justify-between">
            <div>
              <button
                onClick={() => {
                  // Copy summary to clipboard
                  navigator.clipboard.writeText(summary)
                    .then(() => {
                      const notification = document.createElement('div');
                      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fadeIn';
                      notification.textContent = 'Summary copied!';
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        notification.style.animation = 'fadeOut 0.5s ease-out forwards';
                        setTimeout(() => document.body.removeChild(notification), 500);
                      }, 1500);
                    })
                    .catch(err => console.error("Could not copy text: ", err));
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 flex items-center shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                </svg>
                Copy Summary
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setModalIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 shadow-sm hover:shadow"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setModalIsOpen(false);
                  window.scrollTo({
                    top: document.querySelector('.prose').offsetTop,
                    behavior: 'smooth'
                  });
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                View Full Report
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
