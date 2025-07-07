// components/MermaidDiagram.js
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = ({ diagram, title, className = "" }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const elementRef = useRef(null);

  useEffect(() => {
    if (!diagram) return;

    const renderDiagram = async () => {
      try {
        setError('');
        
        // Initialize mermaid if not already done
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          },
          timeline: {
            numberSectionStyles: 4,
            disableMulticolor: false
          }
        });

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, diagram);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, [diagram]);

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        )}
        <div className="text-red-500 text-center py-8">
          <p>Unable to render diagram</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Rendering diagram...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <div 
        ref={elementRef}
        className="mermaid-diagram overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}
      />
    </div>
  );
};

export default MermaidDiagram;
