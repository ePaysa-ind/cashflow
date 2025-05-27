/**
 * Executive Summary Component
 * 
 * Purpose: Display high-level financial analysis with graphical overview
 * Features: Key metrics, visual indicators, summary insights
 * 
 * @component
 * @version 1.0.0
 */

import React from 'react';
import { icons } from '../utils/icons';

const ExecutiveSummary = ({ analysis }) => {
  if (!analysis || !analysis.files || analysis.files.length === 0) {
    return null;
  }

  // Extract metrics from analysis
  const getCFOMetrics = () => {
    let totalAmount = 0;
    let highUrgencyCount = 0;
    let overdueCount = 0;
    let avgConfidence = 0;
    
    const validAnalyses = analysis.files.filter(f => f.analysis && !f.analysis.rawAnalysis);
    
    validAnalyses.forEach(file => {
      const data = file.analysis;
      
      if (data.amount) {
        const numericAmount = parseFloat(data.amount.replace(/[^\d.-]/g, ''));
        if (!isNaN(numericAmount)) totalAmount += numericAmount;
      }
      
      if (data.urgencyLevel === 'HIGH') highUrgencyCount++;
      
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate);
        if (dueDate < new Date() && !isNaN(dueDate)) overdueCount++;
      }
      
      if (data.confidence === 'HIGH') avgConfidence += 90;
      else if (data.confidence === 'MEDIUM') avgConfidence += 70;
      else avgConfidence += 50;
    });

    if (validAnalyses.length > 0) {
      avgConfidence = Math.round(avgConfidence / validAnalyses.length);
    }

    const executiveSummary = validAnalyses[0]?.analysis?.executiveSummary || {};
    const hasFinancialMetrics = !!(executiveSummary.revenueGrowth || 
                                   executiveSummary.grossMargin ||
                                   executiveSummary.workingCapital);

    return {
      totalAmount,
      highUrgencyCount,
      overdueCount,
      avgConfidence,
      documentsProcessed: validAnalyses.length,
      executiveSummary,
      hasFinancialMetrics
    };
  };

  const metrics = getCFOMetrics();

  // Simple bar chart component
  const BarChart = ({ value, maxValue, label, color }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
          <span style={{ fontSize: '12px', fontWeight: '500', color }}>{value}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '18px', 
        fontWeight: '600',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 3V17H17M7 14V10M11 14V6M15 14V8"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Executive Summary
      </h3>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Documents Processed */}
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Documents Analyzed
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            {metrics.documentsProcessed}
          </div>
        </div>

        {/* Total Amount */}
        {metrics.totalAmount > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Total Amount
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              ${metrics.totalAmount.toLocaleString()}
            </div>
          </div>
        )}

        {/* Confidence Score */}
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Confidence Score
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: metrics.avgConfidence >= 80 ? '#10b981' : 
                   metrics.avgConfidence >= 60 ? '#f59e0b' : '#dc2626'
          }}>
            {metrics.avgConfidence}%
          </div>
        </div>

        {/* Urgent Items */}
        {metrics.highUrgencyCount > 0 && (
          <div style={{
            backgroundColor: '#fef2f2',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>
              Urgent Items
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#dc2626' }}>
              {metrics.highUrgencyCount}
            </div>
          </div>
        )}
      </div>

      {/* Visual Charts Section */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
          Performance Metrics
        </h4>
        
        <BarChart 
          value={metrics.avgConfidence} 
          maxValue={100} 
          label="Analysis Confidence" 
          color="#3b82f6" 
        />
        
        {metrics.executiveSummary.revenueGrowth && (
          <BarChart 
            value={parseInt(metrics.executiveSummary.revenueGrowth)} 
            maxValue={100} 
            label="Revenue Growth" 
            color="#10b981" 
          />
        )}
        
        {metrics.executiveSummary.grossMargin && (
          <BarChart 
            value={parseInt(metrics.executiveSummary.grossMargin)} 
            maxValue={100} 
            label="Gross Margin" 
            color="#f59e0b" 
          />
        )}
      </div>

      {/* Financial Metrics */}
      {metrics.hasFinancialMetrics && (
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
            Key Financial Indicators
          </h4>
          
          {metrics.executiveSummary.revenueGrowth && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Revenue Growth: </span>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '500',
                color: parseFloat(metrics.executiveSummary.revenueGrowth) > 0 ? '#10b981' : '#dc2626'
              }}>
                {metrics.executiveSummary.revenueGrowth}
              </span>
            </div>
          )}

          {metrics.executiveSummary.grossMargin && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Gross Margin: </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                {metrics.executiveSummary.grossMargin}
              </span>
            </div>
          )}

          {metrics.executiveSummary.workingCapital && (
            <div>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Working Capital: </span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                {metrics.executiveSummary.workingCapital}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;