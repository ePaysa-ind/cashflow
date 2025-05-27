/**
 * Detailed Analysis Component
 * 
 * Purpose: Display comprehensive financial analysis details
 * Features: Document type, key findings, line items, extracted data
 * 
 * @component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { icons } from '../utils/icons';

const DetailedAnalysis = ({ analysis }) => {
  const [expandedSections, setExpandedSections] = useState({});

  if (!analysis || !analysis.files || analysis.files.length === 0) {
    return null;
  }

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? value : `$${num.toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #d0d0d0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {icons.documents('#3b82f6')}
        Detailed Analysis
      </h3>

      {analysis.files.map((file, index) => {
        const fileAnalysis = file.analysis;
        const isExpanded = expandedSections[index];

        if (!fileAnalysis || fileAnalysis.rawAnalysis) {
          return null;
        }

        return (
          <div key={index} style={{
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {/* File Header */}
            <div 
              onClick={() => toggleSection(index)}
              style={{
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#1f2937',
                  marginBottom: '4px'
                }}>
                  {file.filename}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {fileAnalysis.documentType || 'Financial Document'} • 
                  {fileAnalysis.confidence || 'N/A'} Confidence
                </div>
              </div>
              <span style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                {icons.expand()}
              </span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={{ padding: '16px' }}>
                {/* Positives Card */}
                {fileAnalysis.keyInsights && fileAnalysis.keyInsights.length > 0 && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '14px', 
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM10.5 5.5L7 9L5.5 7.5"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Positive Findings
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#047857', fontSize: '13px' }}>
                      {fileAnalysis.keyInsights.map((insight, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Actions/Alerts Card */}
                {fileAnalysis.recommendations && fileAnalysis.recommendations.length > 0 && (
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '14px', 
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 1L1 14H15L8 1ZM8 6V9M8 11H8.01"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Actions & Recommendations
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#b45309', fontSize: '13px' }}>
                      {fileAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Document Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {fileAnalysis.companyName && (
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Company: </span>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>
                        {fileAnalysis.companyName}
                      </span>
                    </div>
                  )}
                  
                  {fileAnalysis.date && (
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Date: </span>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>
                        {formatDate(fileAnalysis.date)}
                      </span>
                    </div>
                  )}

                  {fileAnalysis.amount && (
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Amount: </span>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>
                        {formatCurrency(fileAnalysis.amount)}
                      </span>
                    </div>
                  )}

                  {fileAnalysis.dueDate && (
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Due Date: </span>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>
                        {formatDate(fileAnalysis.dueDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Findings */}
                {fileAnalysis.keyFindings && fileAnalysis.keyFindings.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '13px', 
                      color: '#374151',
                      fontWeight: '600'
                    }}>
                      Key Findings
                    </h5>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '20px',
                      fontSize: '13px',
                      color: '#4b5563'
                    }}>
                      {fileAnalysis.keyFindings.map((finding, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Line Items */}
                {fileAnalysis.lineItems && fileAnalysis.lineItems.length > 0 && (
                  <div>
                    <h5 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '13px', 
                      color: '#374151',
                      fontWeight: '600'
                    }}>
                      Line Items
                    </h5>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ 
                              textAlign: 'left', 
                              padding: '4px 8px',
                              color: '#6b7280'
                            }}>
                              Description
                            </th>
                            <th style={{ 
                              textAlign: 'right', 
                              padding: '4px 8px',
                              color: '#6b7280'
                            }}>
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileAnalysis.lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '4px 8px' }}>
                                {item.description || item.item || 'Item ' + (idx + 1)}
                              </td>
                              <td style={{ 
                                padding: '4px 8px', 
                                textAlign: 'right',
                                fontFamily: 'monospace'
                              }}>
                                {item.amount || item.value || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DetailedAnalysis;