import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [chatResponse, setChatResponse] = useState('');

  const API_URL = 'http://localhost:5000/api';
  const maxFiles = 2;
  const maxSize = 20 * 1024 * 1024; // 20MB

  const currentSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const limitsReached = uploadedFiles.length >= maxFiles || currentSize >= maxSize;

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      console.log('Backend health:', response.data);
    } catch (err) {
      console.error('Backend health check failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (limitsReached) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (limitsReached) {
      setError('Upload limit reached. Cannot add more files.');
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    if (limitsReached) {
      setError('Upload limit reached. Cannot add more files.');
      e.target.value = '';
      return;
    }
    
    const files = Array.from(e.target.files);
    handleFiles(files);
    e.target.value = '';
  };

  const handleFiles = (files) => {
    setError('');
    
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. You currently have ${uploadedFiles.length} files.`);
      return;
    }

    const newSize = files.reduce((sum, f) => sum + f.size, 0);
    if (currentSize + newSize > maxSize) {
      const remainingSize = ((maxSize - currentSize) / (1024 * 1024)).toFixed(1);
      setError(`Total file size would exceed 20MB limit. You have ${remainingSize}MB remaining.`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        setError(`File "${file.name}" is already uploaded.`);
        return;
      }
      
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum file size is 20MB.`);
        return;
      }
      
      validFiles.push(file);
    }

    if (uploadedFiles.length + validFiles.length > maxFiles) {
      setError(`Cannot add ${validFiles.length} files. Maximum ${maxFiles} files allowed.`);
      return;
    }

    const finalSize = currentSize + validFiles.reduce((sum, f) => sum + f.size, 0);
    if (finalSize > maxSize) {
      setError('Adding these files would exceed 20MB limit.');
      return;
    }

    setUploadedFiles([...uploadedFiles, ...validFiles]);
  };

  const removeFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter(f => f.name !== fileName));
    if (uploadedFiles.length === 1) {
      setAnalysis(null);
    }
    setError('');
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    uploadedFiles.forEach(file => {
      console.log('Appending file:', file.name, 'Size:', file.size, 'Type:', file.type);
      formData.append('documents', file);
    });

    console.log('Sending request to:', `${API_URL}/analyze`);
    console.log('Number of files:', uploadedFiles.length);

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setAnalysis({
        files: response.data.files,
        totalFiles: response.data.totalFiles,
        text: response.data.files.map(f => f.fileName).join(', ') + ' analyzed',
        analysis: response.data.files.length > 0 ? response.data.files[0].analysis : null
      });
    } catch (err) {
      console.error('Upload Error Details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      console.error('Full error object:', err);
      setError(err.response?.data?.error || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) {
      setChatResponse('Please enter a question');
      return;
    }

    if (!analysis?.files?.length) {
      setChatResponse('Please analyze documents first before asking questions');
      return;
    }

    setIsChatLoading(true);

    try {
      console.log('Analysis state:', analysis);
      console.log('Sending chat request:', {
        query: chatInput,
        documents: analysis.files
      });

      const response = await axios.post(`${API_URL}/chat`, {
        query: chatInput,
        documents: analysis.files
      });

      setChatResponse(response.data.response);
      setChatInput('');
    } catch (err) {
      console.error('Chat Error Details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        requestData: {
          query: chatInput,
          documents: analysis?.files || []
        }
      });
      setChatResponse(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsChatLoading(false);
    }
  };

  const insertNudgeText = (text) => {
    setChatInput(text);
  };

  // Calculate enhanced CFO metrics from analysis data
  const getCFOMetrics = () => {
    if (!analysis?.files) return null;

    let totalAmount = 0;
    let highUrgencyCount = 0;
    let overdueCount = 0;
    let avgConfidence = 0;
    
    const validAnalyses = analysis.files.filter(f => f.analysis && !f.analysis.rawAnalysis);
    
    validAnalyses.forEach(file => {
      const data = file.analysis;
      
      // Extract numeric amount
      if (data.amount) {
        const numericAmount = parseFloat(data.amount.replace(/[^\d.-]/g, ''));
        if (!isNaN(numericAmount)) totalAmount += numericAmount;
      }
      
      // Count urgency levels
      if (data.urgencyLevel === 'HIGH') highUrgencyCount++;
      
      // Check if overdue
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate);
        if (dueDate < new Date() && !isNaN(dueDate)) overdueCount++;
      }
      
      // Average confidence
      if (data.confidence === 'HIGH') avgConfidence += 90;
      else if (data.confidence === 'MEDIUM') avgConfidence += 70;
      else avgConfidence += 50;
    });

    if (validAnalyses.length > 0) {
      avgConfidence = Math.round(avgConfidence / validAnalyses.length);
    }

    return {
      totalAmount,
      highUrgencyCount,
      overdueCount,
      avgConfidence,
      documentsProcessed: validAnalyses.length,
      executiveSummary: validAnalyses[0]?.analysis?.executiveSummary || {},
      riskAssessment: validAnalyses[0]?.analysis?.riskAssessment || {},
      actionableInsights: validAnalyses[0]?.analysis?.actionableInsights || {},
      alertsAndFlags: validAnalyses[0]?.analysis?.alertsAndFlags || {},
      boardReporting: validAnalyses[0]?.analysis?.boardReporting || {}
    };
  };

  // Format amount with proper units (millions/billions)
  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return amount >= 1000000000 
        ? `$${(amount / 1000000000).toFixed(1)}B`
        : `$${(amount / 1000000).toFixed(0)}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const cfoMetrics = getCFOMetrics();

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <button onClick={handleLogout} style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          zIndex: 1000
        }}>
          Logout
        </button>
        
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column - Upload & Chat */}
          <div style={{ width: '40%', padding: '20px', borderRight: '1px solid #d0d0d0', overflowY: 'auto' }}>
            {/* Upload Section */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#333', fontSize: '18px', marginBottom: '15px' }}>Document Analysis - 2 docs or 20MB max allowed</h2>
              
              {/* Format Icons */}
              <div style={{ marginBottom: '15px' }}>
                <span style={{ padding: '4px 8px', margin: '2px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '12px' }}>PDF</span>
                <span style={{ padding: '4px 8px', margin: '2px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '12px' }}>DOC</span>
                <span style={{ padding: '4px 8px', margin: '2px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '12px' }}>XLS</span>
                <span style={{ padding: '4px 8px', margin: '2px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '12px' }}>JPG</span>
                <span style={{ padding: '4px 8px', margin: '2px', backgroundColor: '#f8f9fa', border: '1px solid #d0d0d0', borderRadius: '4px', fontSize: '12px' }}>WEBP</span>
              </div>

              {/* Limits Status */}
              <div style={{ 
                padding: '12px', 
                marginBottom: '15px', 
                backgroundColor: limitsReached ? '#fff5f5' : '#f8fbff', 
                border: `1px solid ${limitsReached ? '#fecaca' : '#e3f2fd'}`,
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151'
              }}>
                Files: {uploadedFiles.length}/{maxFiles} | 
                Size: {(currentSize / (1024 * 1024)).toFixed(1)}/{(maxSize / (1024 * 1024)).toFixed(0)}MB
                {limitsReached && <span style={{ color: '#dc2626', marginLeft: '10px' }}>⚠ Limits reached</span>}
              </div>

              {/* Document List */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Uploaded Documents</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      fontSize: '13px'
                    }}>
                      <span>{index + 1}. {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      <button 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => removeFile(file.name)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !limitsReached && document.getElementById('file-input').click()}
                style={{ 
                  padding: '40px 20px',
                  border: '2px dashed #d0d0d0',
                  borderRadius: '8px',
                  textAlign: 'center',
                  backgroundColor: dragActive ? '#f0f9ff' : '#fafafa',
                  cursor: limitsReached ? 'not-allowed' : 'pointer',
                  marginBottom: '15px',
                  opacity: limitsReached ? 0.5 : 1
                }}
              >
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Drop files here or click to upload</p>
                <input
                  id="file-input"
                  type="file"
                  multiple={!limitsReached}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  disabled={limitsReached}
                />
              </div>

              {/* Analyze Button */}
              <button 
                onClick={handleAnalyze}
                disabled={uploadedFiles.length === 0 || loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: uploadedFiles.length === 0 || loading ? '#e5e7eb' : '#3b82f6',
                  color: uploadedFiles.length === 0 || loading ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: uploadedFiles.length === 0 || loading ? 'not-allowed' : 'pointer',
                  marginBottom: '15px'
                }}
              >
                {loading ? 'Analyzing...' : analysis ? 'Re-analyze Documents' : 'Analyze Documents'}
              </button>

              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div>
              <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '15px' }}>Ask questions about your documents</h3>
              
              {/* Nudge Cards */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <button 
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => insertNudgeText("What are the key financial risks?")}
                >
                  Financial Risks
                </button>
                <button 
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => insertNudgeText("What actions should the board take?")}
                >
                  Board Actions
                </button>
              </div>

              {/* Chat Form */}
              <form onSubmit={handleChatSubmit}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your question here..."
                  disabled={isChatLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    marginBottom: '10px'
                  }}
                />
                
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: isChatLoading || !chatInput.trim() ? '#e5e7eb' : '#10b981',
                    color: isChatLoading || !chatInput.trim() ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: isChatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isChatLoading ? 'Processing...' : 'Send Question'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - CFO Dashboard & Analysis */}
          <div style={{ width: '60%', padding: '20px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
            {/* CFO Executive Dashboard */}
            {analysis && cfoMetrics && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>CFO Executive Dashboard</h2>
                    <button 
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '4px',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                      onClick={() => setShowGlossary(!showGlossary)}
                    >
                      ℹ️ Glossary
                    </button>
                  </div>
                </div>

                {/* Glossary Panel - Compact */}
                {showGlossary && (
                  <div style={{
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #d0d0d0',
                    fontSize: '12px'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1f2937' }}>Financial Metrics Glossary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><strong>Revenue Growth:</strong> YoY % change</div>
                      <div><strong>Gross Margin:</strong> (Revenue - COGS) / Revenue</div>
                      <div><strong>DSO:</strong> Days Sales Outstanding</div>
                      <div><strong>Working Capital:</strong> Current Assets - Liabilities</div>
                    </div>
                  </div>
                )}

                {/* CFO Summary Cards */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px', 
                  marginBottom: '24px' 
                }}>
                  {/* Cash Management */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>💰 CASH POSITION</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {formatAmount(cfoMetrics.totalAmount)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669' }}>Available Liquidity</div>
                  </div>

                  {/* Revenue Health */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>📊 REVENUE GROWTH</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {cfoMetrics.executiveSummary?.revenueGrowth || 'N/A'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0891b2' }}>YoY Performance</div>
                  </div>

                  {/* Risk Level */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>⚖️ RISK ASSESSMENT</div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: cfoMetrics.riskAssessment?.creditRisk === 'HIGH' ? '#dc2626' : 
                             cfoMetrics.riskAssessment?.creditRisk === 'MEDIUM' ? '#d97706' : '#059669'
                    }}>
                      {cfoMetrics.riskAssessment?.creditRisk || 'LOW'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Credit Risk Level</div>
                  </div>

                  {/* Confidence Score */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>🎯 CONFIDENCE</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {cfoMetrics.avgConfidence}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#7c3aed' }}>Analysis Accuracy</div>
                  </div>
                </div>

                {/* CFO Detailed Sections - Further reduced */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {/* P&L Health - Smaller */}
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    minHeight: '85px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', marginRight: '4px' }}>📈</span>
                      <h4 style={{ margin: 0, fontSize: '12px', color: '#1f2937', fontWeight: '600' }}>P&L HEALTH</h4>
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                      {cfoMetrics.executiveSummary?.revenueGrowth ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Revenue:</span> 
                          <span style={{ color: '#059669', fontWeight: '500' }}>{cfoMetrics.executiveSummary.revenueGrowth} ↗️</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10px' }}>Upload P&L for metrics</div>
                      )}
                      {cfoMetrics.executiveSummary?.grossMargin ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Gross:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.grossMargin}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '10px' }}>Margin data N/A</div>
                      )}
                      {cfoMetrics.executiveSummary?.operatingMargin && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>Operating:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.operatingMargin}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Balance Sheet - Smaller */}
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: 'white', 
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    minHeight: '85px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', marginRight: '4px' }}>⚖️</span>
                      <h4 style={{ margin: 0, fontSize: '12px', color: '#1f2937', fontWeight: '600' }}>BALANCE SHEET</h4>
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                      {cfoMetrics.executiveSummary?.workingCapital ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Working Cap:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.workingCapital}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '10px' }}>Upload balance sheet</div>
                      )}
                      {cfoMetrics.executiveSummary?.currentRatio ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: '#6b7280' }}>Current:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.currentRatio}</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '10px' }}>Ratio N/A</div>
                      )}
                      {cfoMetrics.executiveSummary?.dso ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#6b7280' }}>DSO:</span> 
                          <span style={{ color: '#1f2937', fontWeight: '500' }}>{cfoMetrics.executiveSummary.dso} days</span>
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '10px' }}>DSO N/A</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alerts & Actions - Enhanced with highlighting */}
                {(cfoMetrics.alertsAndFlags?.criticalIssues || cfoMetrics.actionableInsights?.immediate30Days) && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    border: '2px solid #dc2626',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#dc2626', fontWeight: 'bold' }}>🚨 CRITICAL CFO ACTION ITEMS</h4>
                    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                      {cfoMetrics.alertsAndFlags?.criticalIssues && (
                        <div style={{ 
                          padding: '12px 16px', 
                          backgroundColor: '#fef2f2', 
                          border: '2px solid #dc2626',
                          borderRadius: '6px',
                          marginBottom: '10px'
                        }}>
                          <strong style={{ color: '#dc2626', fontSize: '14px' }}>🔥 CRITICAL:</strong> 
                          <div style={{ color: '#991b1b', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.alertsAndFlags.criticalIssues}</div>
                        </div>
                      )}
                      {cfoMetrics.actionableInsights?.immediate30Days && (
                        <div style={{ 
                          padding: '12px 16px', 
                          backgroundColor: '#eff6ff', 
                          border: '2px solid #2563eb',
                          borderRadius: '6px'
                        }}>
                          <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>⏰ NEXT 30 DAYS:</strong> 
                          <div style={{ color: '#1e40af', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.actionableInsights.immediate30Days}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Analysis Table */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', color: '#1f2937', marginBottom: '16px' }}>Detailed Financial Analysis</h3>
              <div style={{ 
                backgroundColor: 'white', 
                border: '1px solid #d0d0d0', 
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #d0d0d0' }}>Document</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #d0d0d0' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #d0d0d0' }}>Due Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #d0d0d0' }}>Priority</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #d0d0d0' }}>Action Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                          Upload documents to see detailed analysis
                        </td>
                      </tr>
                    ) : analysis && analysis.files ? (
                      analysis.files.map((file, index) => {
                        const data = file.analysis;
                        
                        if (file.error) {
                          return (
                            <tr key={index}>
                              <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>{file.fileName}</td>
                              <td colSpan="4" style={{ padding: '12px', fontSize: '13px', color: '#dc2626', borderBottom: '1px solid #e5e7eb' }}>Error: {file.error}</td>
                            </tr>
                          );
                        }
                        
                        if (!data || data.rawAnalysis) {
                          return (
                            <tr key={index}>
                              <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>{file.fileName}</td>
                              <td colSpan="4" style={{ padding: '12px', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Analysis in progress...</td>
                            </tr>
                          );
                        }
                        
                        return (
                          <tr key={index}>
                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>{file.fileName}</td>
                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>{data.amount || 'N/A'}</td>
                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>{data.dueDate || 'N/A'}</td>
                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                              <span style={{ 
                                color: data.urgencyLevel === 'HIGH' ? '#dc2626' : 
                                       data.urgencyLevel === 'MEDIUM' ? '#d97706' : '#059669',
                                fontWeight: '500'
                              }}>
                                {data.urgencyLevel || 'LOW'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>{data.recommendedAction || 'No action required'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                          Click "Analyze Documents" to see results
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Strategic Insights - Enhanced highlighting */}
              {cfoMetrics && cfoMetrics.actionableInsights && Object.keys(cfoMetrics.actionableInsights).length > 0 && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '16px', 
                  backgroundColor: 'white', 
                  border: '2px solid #059669',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#059669', fontWeight: 'bold' }}>📋 KEY STRATEGIC CFO INSIGHTS</h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {cfoMetrics.actionableInsights.strategicDecisions && (
                      <div style={{ 
                        marginBottom: '10px',
                        padding: '8px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px'
                      }}>
                        <strong style={{ color: '#059669' }}>🎯 Strategic Decisions:</strong> 
                        <div style={{ color: '#047857', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.actionableInsights.strategicDecisions}</div>
                      </div>
                    )}
                    {cfoMetrics.actionableInsights.cashManagement && (
                      <div style={{ 
                        marginBottom: '10px',
                        padding: '8px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px'
                      }}>
                        <strong style={{ color: '#059669' }}>💰 Cash Management:</strong> 
                        <div style={{ color: '#047857', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.actionableInsights.cashManagement}</div>
                      </div>
                    )}
                    {cfoMetrics.actionableInsights.costOptimization && (
                      <div style={{ 
                        padding: '8px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px'
                      }}>
                        <strong style={{ color: '#059669' }}>✂️ Cost Optimization:</strong> 
                        <div style={{ color: '#047857', marginTop: '4px', fontWeight: '500' }}>{cfoMetrics.actionableInsights.costOptimization}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Footer - Outside columns */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: 'white', 
          borderTop: '1px solid #d0d0d0',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1f2937' }}>Reference</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
            CFO Executive Document Analyzer powered by Claude AI | Enhanced financial insights | Maximum 2 files or 20MB total
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;