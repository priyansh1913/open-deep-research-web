// components/DynamicResearchResults.js
import React, { useState, useEffect } from 'react';
import DynamicChart from './DynamicChart';
import MermaidDiagram from './MermaidDiagram';
import { DataParser } from '../utils/dataParser';
import { QueryAnalyzer } from '../utils/queryAnalyzer';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowDownTrayIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const DynamicResearchResults = ({ 
  query, 
  results, 
  onFollowupQuestion,
  className = "" 
}) => {
  const [parsedData, setParsedData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [visibleCharts, setVisibleCharts] = useState({});
  const [visibleDiagrams, setVisibleDiagrams] = useState({});

  useEffect(() => {
    if (results && results.report) {
      const parsed = DataParser.parseResearchData(results.report, 'general');
      setParsedData(parsed);
      
      // Initialize visibility states
      const chartTypes = ['bar', 'line'];
      const diagramTypes = ['flowchart'];
      
      const chartVisibility = {};
      const diagramVisibility = {};
      
      chartTypes.forEach((type, index) => {
        chartVisibility[type] = index < 2; // Show first 2 by default
      });
      
      diagramTypes.forEach((type, index) => {
        diagramVisibility[type] = index < 1; // Show first 1 by default
      });
      
      setVisibleCharts(chartVisibility);
      setVisibleDiagrams(diagramVisibility);
    }
  }, [results]);

  const toggleChartVisibility = (chartType) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartType]: !prev[chartType]
    }));
  };

  const toggleDiagramVisibility = (diagramType) => {
    setVisibleDiagrams(prev => ({
      ...prev,
      [diagramType]: !prev[diagramType]
    }));
  };

  const exportResults = () => {
    const exportData = {
      query,
      results,
      parsedData,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `Research Results: ${query}`,
        text: results.summary,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Research Results: ${query}\n\n${results.summary}\n\nGenerated at: ${new Date().toLocaleString()}`
      );
      alert('Results copied to clipboard!');
    }
  };

  if (!results || !parsedData) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
    { id: 'charts', label: 'Charts', icon: ChartBarIcon },
    { id: 'analysis', label: 'Analysis', icon: EyeIcon }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Research Results</h2>
          <div className="flex space-x-2">
            <button
              onClick={shareResults}
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="Share Results"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={exportResults}
              className="p-2 text-gray-500 hover:text-green-500 transition-colors"
              title="Export Results"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-4">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">{results.summary}</p>
            </div>

            {/* Key Insights */}
            {parsedData.insights.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedData.insights.slice(0, 4).map((insight, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <p className="text-gray-700 text-sm">{insight.text}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Importance: {insight.importance || 1}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Metrics */}
            {parsedData.key_metrics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {parsedData.key_metrics.slice(0, 4).map((metric, index) => (
                    <div key={index} className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-700">{metric.value}</div>
                      <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Questions */}
            {results.suggested_questions && results.suggested_questions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Suggested Follow-up Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.suggested_questions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => onFollowupQuestion && onFollowupQuestion(question)}
                      className="text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                    >
                      <p className="text-sm text-gray-700">{question}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Data Visualizations</h3>
              <p className="text-sm text-gray-500">Click the eye icon to toggle chart visibility</p>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['bar', 'line', 'doughnut'].map((chartType) => {
                const chartData = DataParser.generateChartData(parsedData, chartType);
                if (!chartData) return null;

                return (
                  <div key={chartType} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800 capitalize">{chartType} Chart</h4>
                      <button
                        onClick={() => toggleChartVisibility(chartType)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {visibleCharts[chartType] ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {visibleCharts[chartType] && (
                      <DynamicChart
                        type={chartType}
                        data={chartData}
                        title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Analysis`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mermaid Diagrams */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Process Diagrams</h3>
              <div className="grid grid-cols-1 gap-6">
                {['flowchart'].map((diagramType) => {
                  const diagram = QueryAnalyzer.generateMermaidDiagram(diagramType, parsedData, query);
                  if (!diagram) return null;

                  return (
                    <div key={diagramType} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800 capitalize">{diagramType} Diagram</h4>
                        <button
                          onClick={() => toggleDiagramVisibility(diagramType)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          {visibleDiagrams[diagramType] ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {visibleDiagrams[diagramType] && (
                        <MermaidDiagram
                          diagram={diagram}
                          title={`${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} View`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Detailed Report */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Report</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                  {results.report}
                </div>
              </div>
            </div>

              {/* Entities and Timeline */}
              {parsedData.entities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Entities</h3>
                  <div className="space-y-2">
                    {parsedData.entities.slice(0, 8).map((entity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium text-gray-800">{entity.name}</span>
                        <span className="text-sm text-gray-500">
                          Mentioned {entity.frequency} time{entity.frequency !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  );
};

export default DynamicResearchResults;
