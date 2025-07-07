// components/QueryAnalysis.js
import React from 'react';
import { 
  ClockIcon, 
  CpuChipIcon, 
  TagIcon, 
  ChartBarIcon,
  LightBulbIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const QueryAnalysis = ({ analysis, className = "" }) => {
  if (!analysis) return null;

  const getResearchTypeIcon = (type) => {
    switch (type) {
      case 'biography': return '👤';
      case 'explanation': return '📖';
      case 'process': return '⚙️';
      case 'analysis': return '🔍';
      case 'comparison': return '⚖️';
      case 'trend_analysis': return '📈';
      default: return '🔬';
    }
  };

  const getDomainIcon = (domain) => {
    const icons = {
      business: '💼',
      technology: '💻',
      science: '🧪',
      medicine: '⚕️',
      entertainment: '🎭',
      sports: '⚽',
      politics: '🏛️',
      history: '📜',
      environment: '🌍',
      general: '📚'
    };
    return icons[domain] || '📚';
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'fast': return 'bg-green-100 text-green-800';
      case 'comprehensive': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Query Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Research Type */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getResearchTypeIcon(analysis.research_type)}</span>
            <div>
              <p className="font-medium text-gray-800">Research Type</p>
              <p className="text-sm text-gray-600 capitalize">{analysis.research_type.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Domain */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getDomainIcon(analysis.domain)}</span>
            <div>
              <p className="font-medium text-gray-800">Domain</p>
              <p className="text-sm text-gray-600 capitalize">{analysis.domain}</p>
            </div>
          </div>
        </div>

        {/* Complexity & Time */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-gray-500 mr-3" />
            <div>
              <p className="font-medium text-gray-800">Estimated Time</p>
              <p className="text-sm text-gray-600">{analysis.estimated_time}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(analysis.complexity)}`}>
            {analysis.complexity}
          </span>
        </div>

        {/* Intent */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <CpuChipIcon className="h-6 w-6 text-purple-500 mr-3" />
            <div>
              <p className="font-medium text-gray-800">Intent</p>
              <p className="text-sm text-gray-600 capitalize">{analysis.intent}</p>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        {analysis.focus_areas && analysis.focus_areas.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <TagIcon className="h-5 w-5 text-blue-500 mr-2" />
              <p className="font-medium text-gray-800">Focus Areas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.focus_areas.map((area, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="font-medium text-gray-800">Key Terms</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.slice(0, 8).map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Visualizations */}
        {analysis.chart_types && analysis.chart_types.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <p className="font-medium text-gray-800">Suggested Charts</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.chart_types.map((chart, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full capitalize"
                >
                  {chart}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryAnalysis;
