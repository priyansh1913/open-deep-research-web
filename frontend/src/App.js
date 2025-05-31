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
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Summary
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
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-40"
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto overflow-hidden transform transition-all">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <LightBulbIcon className="h-6 w-6 mr-2" />
              Research Summary
            </h2>
            <button
              onClick={() => setModalIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="prose max-w-none">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Topic</h3>
                <p className="text-gray-700">{topic}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
                  {summary || "No summary available for this research."}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={() => setModalIsOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              View Full Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
