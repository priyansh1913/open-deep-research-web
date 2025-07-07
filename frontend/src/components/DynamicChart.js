// components/DynamicChart.js
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  BubbleController,
  ScatterController
} from 'chart.js';
import { Bar, Line, Doughnut, Radar, Bubble, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  BubbleController,
  ScatterController,
  Title,
  Tooltip,
  Legend
);

const DynamicChart = ({ type, data, title, className = "" }) => {
  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    scales: type !== 'doughnut' && type !== 'radar' ? {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif'
          }
        }
      }
    } : undefined
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />;
      case 'radar':
        return <Radar data={data} options={chartOptions} />;
      case 'bubble':
        return <Bubble data={data} options={chartOptions} />;
      case 'scatter':
        return <Scatter data={data} options={chartOptions} />;
      default:
        return <Bar data={data} options={chartOptions} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="h-64 w-full">
        {renderChart()}
      </div>
    </div>
  );
};

export default DynamicChart;
