// utils/dataParser.js
export class DataParser {
  static parseResearchData(reportText, domain) {
    const parsed = {
      key_metrics: [],
      timeline_data: [],
      comparison_data: [],
      trend_data: [],
      insights: [],
      facts: [],
      process_steps: [],
      statistics: [],
      entities: [],
      relationships: []
    };

    if (!reportText) return parsed;

    // Extract numbers and metrics
    const numberPattern = /\$?\d+\.?\d*\s*(billion|million|thousand|percent|%|B|M|K)?/gi;
    const numbers = reportText.match(numberPattern) || [];
    
    numbers.slice(0, 8).forEach((match, index) => {
      parsed.key_metrics.push({
        value: match,
        label: `Metric ${index + 1}`,
        description: this.extractContextAroundNumber(reportText, match)
      });
    });

    // Extract years and create timeline data
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years = [...new Set(reportText.match(yearPattern) || [])];
    
    years.slice(0, 10).forEach(year => {
      const context = this.extractContextAroundYear(reportText, year);
      parsed.timeline_data.push({
        year: parseInt(year),
        event: context || `Event in ${year}`,
        description: context
      });
    });

    // Extract key insights (sentences with important keywords)
    const sentences = reportText.split(/[.!?]+/);
    const insightKeywords = [
      "important", "significant", "key", "major", "notable", "remarkable", 
      "crucial", "essential", "critical", "primary", "main", "leading"
    ];
    
    sentences.forEach(sentence => {
      if (insightKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 200) {
          parsed.insights.push({
            text: trimmed,
            importance: this.calculateImportanceScore(trimmed, insightKeywords)
          });
        }
      }
    });

    // Extract process steps (numbered or bulleted lists)
    const stepPatterns = [
      /\d+\.\s*([^.]+)/g,
      /•\s*([^•]+)/g,
      /\*\s*([^*]+)/g,
      /-\s*([^-\n]+)/g
    ];

    stepPatterns.forEach(pattern => {
      const matches = reportText.match(pattern) || [];
      matches.slice(0, 8).forEach(match => {
        const step = match.replace(/^\d+\.\s*|^[•*-]\s*/, '').trim();
        if (step.length > 10 && step.length < 150) {
          parsed.process_steps.push({
            step: step,
            order: parsed.process_steps.length + 1
          });
        }
      });
    });

    // Extract statistics
    const statPattern = /(\d+(?:\.\d+)?)\s*%?\s*(of|in|are|were|have|show|indicate|report)/gi;
    const stats = reportText.match(statPattern) || [];
    
    stats.slice(0, 6).forEach(stat => {
      parsed.statistics.push({
        value: stat,
        context: this.extractContextAroundStat(reportText, stat)
      });
    });

    // Extract entities (proper nouns)
    const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const entities = [...new Set(reportText.match(entityPattern) || [])];
    
    entities.slice(0, 15).forEach(entity => {
      if (entity.length > 2) {
        parsed.entities.push({
          name: entity,
          frequency: this.countOccurrences(reportText, entity),
          context: this.extractContextAroundEntity(reportText, entity)
        });
      }
    });

    // Sort and limit results
    parsed.insights = parsed.insights
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);
    
    parsed.entities = parsed.entities
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    parsed.timeline_data = parsed.timeline_data
      .sort((a, b) => a.year - b.year)
      .slice(0, 8);

    return parsed;
  }

  static extractContextAroundNumber(text, number) {
    const index = text.indexOf(number);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + number.length + 50);
    return text.substring(start, end).replace(number, `**${number}**`);
  }

  static extractContextAroundYear(text, year) {
    const sentences = text.split(/[.!?]+/);
    const sentence = sentences.find(s => s.includes(year));
    return sentence ? sentence.trim().substring(0, 100) : '';
  }

  static extractContextAroundStat(text, stat) {
    const index = text.indexOf(stat);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + stat.length + 30);
    return text.substring(start, end);
  }

  static extractContextAroundEntity(text, entity) {
    const sentences = text.split(/[.!?]+/);
    const sentence = sentences.find(s => s.includes(entity));
    return sentence ? sentence.trim().substring(0, 120) : '';
  }

  static calculateImportanceScore(text, keywords) {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) score += 1;
    });
    return score + (text.length > 50 ? 1 : 0);
  }

  static countOccurrences(text, word) {
    const regex = new RegExp(word, 'gi');
    return (text.match(regex) || []).length;
  }

  static generateChartData(parsedData, chartType) {
    switch (chartType) {
      case 'bar':
        return this.generateBarChartData(parsedData);
      case 'line':
        return this.generateLineChartData(parsedData);
      case 'doughnut':
        return this.generateDoughnutChartData(parsedData);
      case 'radar':
        return this.generateRadarChartData(parsedData);
      case 'timeline':
        return this.generateTimelineChartData(parsedData);
      case 'bubble':
        return this.generateBubbleChartData(parsedData);
      default:
        return this.generateBarChartData(parsedData);
    }
  }

  static generateBarChartData(parsedData) {
    const metrics = parsedData.key_metrics.slice(0, 6);
    if (metrics.length === 0) return null;

    return {
      labels: metrics.map((m, i) => m.label || `Metric ${i + 1}`),
      datasets: [{
        label: 'Key Metrics',
        data: metrics.map(m => this.extractNumber(m.value)),
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c',
          '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
        ],
        borderColor: '#667eea',
        borderWidth: 2
      }]
    };
  }

  static generateLineChartData(parsedData) {
    const timeline = parsedData.timeline_data.slice(0, 8);
    if (timeline.length === 0) return null;

    return {
      labels: timeline.map(t => t.year.toString()),
      datasets: [{
        label: 'Timeline Events',
        data: timeline.map((_, i) => i + 1),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }

  static generateDoughnutChartData(parsedData) {
    const entities = parsedData.entities.slice(0, 5);
    if (entities.length === 0) return null;

    return {
      labels: entities.map(e => e.name),
      datasets: [{
        data: entities.map(e => e.frequency),
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'
        ],
        borderWidth: 0
      }]
    };
  }

  static generateRadarChartData(parsedData) {
    const insights = parsedData.insights.slice(0, 6);
    if (insights.length === 0) return null;

    return {
      labels: insights.map((_, i) => `Insight ${i + 1}`),
      datasets: [{
        label: 'Importance Score',
        data: insights.map(insight => insight.importance || 1),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        pointBackgroundColor: '#667eea'
      }]
    };
  }

  static generateTimelineChartData(parsedData) {
    return this.generateLineChartData(parsedData);
  }

  static generateBubbleChartData(parsedData) {
    const entities = parsedData.entities.slice(0, 8);
    if (entities.length === 0) return null;

    return {
      datasets: [{
        label: 'Entity Analysis',
        data: entities.map((entity, i) => ({
          x: i + 1,
          y: entity.frequency,
          r: Math.min(entity.name.length * 2, 20)
        })),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea'
      }]
    };
  }

  static extractNumber(text) {
    const match = text.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : 0;
  }
}

export default DataParser;
