/**
 * Action Items Component
 * 
 * Purpose: Display prioritized recommendations and action items
 * Features: Urgency indicators, due dates, impact assessment
 * 
 * @component
 * @version 1.0.0
 */

import React from 'react';
import { icons } from '../utils/icons';

const ActionItems = ({ analysis }) => {
  if (!analysis || !analysis.files || analysis.files.length === 0) {
    return null;
  }

  // Collect all action items from all files
  const getAllActionItems = () => {
    const items = [];
    
    analysis.files.forEach((file, fileIndex) => {
      const fileAnalysis = file.analysis;
      if (!fileAnalysis || fileAnalysis.rawAnalysis) return;

      // Extract recommendations
      if (fileAnalysis.recommendations) {
        fileAnalysis.recommendations.forEach(rec => {
          items.push({
            type: 'recommendation',
            text: rec,
            urgency: 'MEDIUM',
            source: file.filename,
            fileIndex
          });
        });
      }

      // Extract action items
      if (fileAnalysis.actionItems) {
        fileAnalysis.actionItems.forEach(item => {
          items.push({
            type: 'action',
            text: item,
            urgency: fileAnalysis.urgencyLevel || 'MEDIUM',
            source: file.filename,
            fileIndex
          });
        });
      }

      // Extract from actionable insights
      if (fileAnalysis.actionableInsights) {
        Object.entries(fileAnalysis.actionableInsights).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            items.push({
              type: 'insight',
              category: key,
              text: value,
              urgency: key.includes('immediate') ? 'HIGH' : 'MEDIUM',
              source: file.filename,
              fileIndex
            });
          }
        });
      }

      // Check for overdue items
      if (fileAnalysis.dueDate) {
        const dueDate = new Date(fileAnalysis.dueDate);
        const today = new Date();
        if (dueDate < today && !isNaN(dueDate)) {
          items.push({
            type: 'overdue',
            text: `${fileAnalysis.documentType || 'Document'} is overdue (Due: ${dueDate.toLocaleDateString()})`,
            urgency: 'HIGH',
            source: file.filename,
            fileIndex,
            dueDate
          });
        }
      }
    });

    // Sort by urgency (HIGH first)
    return items.sort((a, b) => {
      const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
    });
  };

  const actionItems = getAllActionItems();

  if (actionItems.length === 0) {
    return null;
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'overdue': return icons.alert('#dc2626');
      case 'action': return icons.target('#3b82f6');
      case 'recommendation': return icons.clipboard('#10b981');
      case 'insight': return icons.arrowUpRight('#f59e0b');
      default: return icons.documents('#6b7280');
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {icons.target('#3b82f6')}
        Action Items & Recommendations
      </h3>

      {/* Summary Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Total Items: <span style={{ fontWeight: '600', color: '#1f2937' }}>
            {actionItems.length}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          High Priority: <span style={{ fontWeight: '600', color: '#dc2626' }}>
            {actionItems.filter(item => item.urgency === 'HIGH').length}
          </span>
        </div>
      </div>

      {/* Action Items List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {actionItems.map((item, index) => (
          <div key={index} style={{
            padding: '12px',
            marginBottom: '8px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            borderLeft: `3px solid ${getUrgencyColor(item.urgency)}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              {/* Icon */}
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {getTypeIcon(item.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#1f2937',
                  marginBottom: '4px',
                  lineHeight: '1.5'
                }}>
                  {item.text}
                </div>

                {/* Metadata */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  <span>Source: {item.source}</span>
                  {item.category && <span>Category: {item.category}</span>}
                  <span style={{ 
                    color: getUrgencyColor(item.urgency),
                    fontWeight: '500'
                  }}>
                    {item.urgency} Priority
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Actions */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => {
            const content = actionItems.map(item => 
              `[${item.urgency}] ${item.text} (Source: ${item.source})`
            ).join('\n');
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `action-items-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          {icons.cloud('white')}
          Export Action Items
        </button>
      </div>
    </div>
  );
};

export default ActionItems;