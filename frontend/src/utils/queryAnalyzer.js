// utils/queryAnalyzer.js
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif'
});

export class QueryAnalyzer {
  static analyzeQuery(query) {
    const queryLower = query.toLowerCase();
    
    const analysis = {
      research_type: "general",
      domain: "general",
      complexity: "comprehensive",
      focus_areas: [],
      suggested_visualizations: [],
      estimated_time: "2-3 minutes",
      keywords: [],
      entities: [],
      intent: "research",
      chart_types: [],
      mermaid_diagrams: []
    };

    // Extract keywords and entities
    const stopWords = new Set(["the", "is", "are", "was", "were", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"]);
    const words = query.toLowerCase().match(/\b\w+\b/g) || [];
    analysis.keywords = words.filter(word => word.length > 3 && !stopWords.has(word)).slice(0, 10);
    
    // Extract potential entities (capitalized words in original query)
    const entities = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    analysis.entities = entities.slice(0, 5);

    // Determine intent
    const intentPatterns = {
      definition: ["what is", "define", "meaning of", "explain"],
      comparison: ["compare", "vs", "versus", "difference", "better"],
      tutorial: ["how to", "steps", "guide", "tutorial", "learn"],
      analysis: ["analyze", "analysis", "impact", "effect", "why"],
      news: ["latest", "recent", "news", "current", "today"],
      biography: ["who is", "biography", "life", "born", "career"],
      statistics: ["statistics", "data", "numbers", "percentage", "rate"],
      trends: ["trend", "future", "forecast", "prediction", "growth"]
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        analysis.intent = intent;
        break;
      }
    }

    // Determine domain
    const domainPatterns = {
      business: ["business", "company", "market", "revenue", "profit", "economy", "finance", "stock", "investment", "startup", "entrepreneur"],
      technology: ["technology", "ai", "software", "hardware", "tech", "programming", "algorithm", "data", "digital", "computer", "internet"],
      science: ["science", "research", "study", "experiment", "theory", "discovery", "scientific", "biology", "chemistry", "physics"],
      medicine: ["medical", "health", "disease", "treatment", "doctor", "hospital", "drug", "therapy", "clinical", "medicine"],
      entertainment: ["actor", "actress", "movie", "film", "celebrity", "entertainment", "hollywood", "music", "singer", "artist"],
      sports: ["sport", "athlete", "player", "team", "game", "championship", "olympic", "tournament", "match", "football", "basketball"],
      politics: ["politics", "government", "election", "political", "policy", "democracy", "law", "legislation", "president", "minister"],
      history: ["history", "historical", "ancient", "century", "era", "civilization", "empire", "revolution", "dynasty", "medieval"],
      environment: ["environment", "climate", "green", "sustainable", "pollution", "ecosystem", "conservation", "renewable", "carbon"]
    };

    for (const [domain, keywords] of Object.entries(domainPatterns)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        analysis.domain = domain;
        break;
      }
    }

    // Determine research type and focus areas
    if (["who is", "who was", "biography", "life"].some(word => queryLower.includes(word))) {
      analysis.research_type = "biography";
      analysis.focus_areas = ["Personal Background", "Career", "Achievements", "Impact"];
      analysis.chart_types = ["timeline", "achievements"];
      analysis.mermaid_diagrams = ["timeline"];
    } else if (["what is", "explain", "definition", "meaning"].some(word => queryLower.includes(word))) {
      analysis.research_type = "explanation";
      analysis.focus_areas = ["Definition", "Key Concepts", "Applications", "Examples"];
      analysis.chart_types = ["doughnut", "bar"];
      analysis.mermaid_diagrams = ["mindmap", "flowchart"];
    } else if (["how", "process", "steps", "method"].some(word => queryLower.includes(word))) {
      analysis.research_type = "process";
      analysis.focus_areas = ["Steps", "Methods", "Requirements", "Best Practices"];
      analysis.chart_types = ["line", "radar"];
      analysis.mermaid_diagrams = ["flowchart", "sequence"];
    } else if (["why", "reason", "cause", "impact"].some(word => queryLower.includes(word))) {
      analysis.research_type = "analysis";
      analysis.focus_areas = ["Causes", "Effects", "Analysis", "Implications"];
      analysis.chart_types = ["bubble", "scatter"];
      analysis.mermaid_diagrams = ["flowchart", "gitgraph"];
    } else if (["compare", "vs", "versus", "difference"].some(word => queryLower.includes(word))) {
      analysis.research_type = "comparison";
      analysis.focus_areas = ["Similarities", "Differences", "Pros & Cons", "Recommendations"];
      analysis.chart_types = ["radar", "bar"];
      analysis.mermaid_diagrams = ["graph", "sankey"];
    } else if (["trend", "future", "prediction", "forecast"].some(word => queryLower.includes(word))) {
      analysis.research_type = "trend_analysis";
      analysis.focus_areas = ["Current Trends", "Future Predictions", "Market Analysis", "Opportunities"];
      analysis.chart_types = ["line", "area"];
      analysis.mermaid_diagrams = ["timeline", "gitgraph"];
    }

    // Determine complexity
    if (["quick", "brief", "summary", "overview"].some(word => queryLower.includes(word))) {
      analysis.complexity = "fast";
      analysis.estimated_time = "30-60 seconds";
    } else if (["detailed", "comprehensive", "thorough", "in-depth", "complete"].some(word => queryLower.includes(word))) {
      analysis.complexity = "comprehensive";
      analysis.estimated_time = "2-4 minutes";
    }

    return analysis;
  }

  static generateMermaidDiagram(type, data, title) {
    switch (type) {
      case 'timeline':
        return this.generateTimelineDiagram(data, title);
      case 'flowchart':
        return this.generateFlowchartDiagram(data, title);
      case 'mindmap':
        return this.generateMindmapDiagram(data, title);
      case 'sequence':
        return this.generateSequenceDiagram(data, title);
      case 'graph':
        return this.generateGraphDiagram(data, title);
      default:
        return this.generateFlowchartDiagram(data, title);
    }
  }

  static generateTimelineDiagram(data, title) {
    const events = data.timeline_data || [];
    if (events.length === 0) return null;

    let diagram = `timeline
    title ${title}
`;
    
    events.forEach(event => {
      diagram += `    ${event.year} : ${event.event.replace(/:/g, ';')}\n`;
    });

    return diagram;
  }

  static generateFlowchartDiagram(data, title) {
    const steps = data.process_steps || data.focus_areas || [];
    if (steps.length === 0) return null;

    let diagram = `flowchart TD
    A[${title}]
`;
    
    steps.forEach((step, index) => {
      const nodeId = String.fromCharCode(66 + index); // B, C, D, etc.
      diagram += `    A --> ${nodeId}[${step}]\n`;
    });

    return diagram;
  }

  static generateMindmapDiagram(data, title) {
    const concepts = data.focus_areas || data.keywords || [];
    if (concepts.length === 0) return null;

    let diagram = `mindmap
  root((${title}))
`;
    
    concepts.forEach(concept => {
      diagram += `    ${concept.replace(/\s+/g, '_')}\n`;
    });

    return diagram;
  }

  static generateSequenceDiagram(data, title) {
    const steps = data.process_steps || [];
    if (steps.length === 0) return null;

    let diagram = `sequenceDiagram
    participant User
    participant Process
`;
    
    steps.forEach((step, index) => {
      diagram += `    User->>Process: Step ${index + 1}: ${step}\n`;
      diagram += `    Process-->>User: ${step} Complete\n`;
    });

    return diagram;
  }

  static generateGraphDiagram(data, title) {
    const relationships = data.comparison_data || [];
    if (relationships.length === 0) return null;

    let diagram = `graph LR
    A[${title}]
`;
    
    relationships.forEach((rel, index) => {
      const nodeId = String.fromCharCode(66 + index);
      diagram += `    A --> ${nodeId}[${rel.name || `Item ${index + 1}`}]\n`;
    });

    return diagram;
  }
}

export default QueryAnalyzer;
