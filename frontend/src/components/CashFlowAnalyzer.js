import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CashFlowAnalyzer.css';

function CashFlowAnalyzer() {
  const [files, setFiles] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [processingStatus, setProcessingStatus] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      console.log('Backend health:', response.data);
    } catch (err) {
      setError('Backend server is not running. Please start the server on port 5000.');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    
    if (totalSize > 10 * 1024 * 1024) {
      setError('Total file size exceeds 10MB limit');
      return;
    }

    const newQueue = selectedFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      status: 'pending',
      progress: 0,
      error: null
    }));

    setUploadQueue(prev => [...prev, ...newQueue]);
    setError('');
  };

  const handleUpload = async () => {
    if (uploadQueue.length === 0) return;

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    const pendingFiles = uploadQueue.filter(item => item.status === 'pending');
    
    pendingFiles.forEach(item => {
      formData.append('documents', item.file);
    });

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            overall: percentCompleted
          }));
        }
      });

      setAnalysis(response.data);
      setUploadQueue(prev => prev.map(item => 
        pendingFiles.find(p => p.id === item.id) 
          ? { ...item, status: 'completed' }
          : item
      ));
      setFiles(pendingFiles.map(item => item.file));
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during analysis');
      setUploadQueue(prev => prev.map(item => 
        pendingFiles.find(p => p.id === item.id) 
          ? { ...item, status: 'failed', error: err.response?.data?.error }
          : item
      ));
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !files.length) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: chatInput,
        documentContext: analysis?.text || ''
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const removeFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearAnalysis = () => {
    setFiles([]);
    setUploadQueue([]);
    setAnalysis(null);
    setChatMessages([]);
    setError('');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">MoneyLens</h1>
      </header>

      <div className="content-wrapper">
        <div className="upload-section">
          <div className="upload-card">
            <h2 className="section-title">Upload Documents</h2>
            
            <div className="file-input-wrapper">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.csv,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                className="file-input"
                id="file-upload"
                disabled={loading}
              />
              <label htmlFor="file-upload" className="file-input-label">
                <span className="upload-icon">📁</span>
                <span>Choose Files</span>
              </label>
            </div>

            {uploadQueue.length > 0 && (
              <div className="upload-queue">
                <h3 className="queue-title">Upload Queue ({uploadQueue.length})</h3>
                {uploadQueue.map(item => (
                  <div key={item.id} className={`queue-item ${item.status}`}>
                    <span className="file-name">{item.file.name}</span>
                    <span className="file-size">
                      ({(item.file.size / 1024).toFixed(1)} KB)
                    </span>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                    {item.status === 'pending' && (
                      <button 
                        onClick={() => removeFromQueue(item.id)}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadQueue.some(item => item.status === 'pending') && (
              <button 
                onClick={handleUpload} 
                disabled={loading}
                className="upload-btn"
              >
                {loading ? 'Analyzing...' : 'Analyze Documents'}
              </button>
            )}

            {loading && uploadProgress.overall && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress.overall}%` }}
                />
                <span className="progress-text">{uploadProgress.overall}%</span>
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="results-section">
          {analysis && (
            <>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3 className="metric-title">Total Exposure</h3>
                  <p className="metric-value">${analysis.metrics?.totalExposure || '0'}</p>
                  <p className="metric-subtitle">Accounts Payable</p>
                </div>
                <div className="metric-card">
                  <h3 className="metric-title">Avg Timeline</h3>
                  <p className="metric-value">{analysis.metrics?.avgTimeline || '30'} days</p>
                  <p className="metric-subtitle">Payment Terms</p>
                </div>
                <div className="metric-card">
                  <h3 className="metric-title">Risk Level</h3>
                  <p className="metric-value risk-medium">{analysis.metrics?.riskLevel || 'Medium'}</p>
                  <p className="metric-subtitle">Cash Flow Risk</p>
                </div>
                <div className="metric-card">
                  <h3 className="metric-title">Next Due</h3>
                  <p className="metric-value">{analysis.metrics?.nextDue || '7'} days</p>
                  <p className="metric-subtitle">Urgent Payment</p>
                </div>
              </div>

              <div className="analysis-card">
                <h2 className="section-title">Moneylens Analysis</h2>
                <div className="analysis-content">
                  {analysis.analysis?.split('\n').map((line, index) => (
                    <p key={index} className="analysis-line">{line}</p>
                  ))}
                </div>
              </div>

              {analysis.predictions && (
                <div className="predictions-card">
                  <h2 className="section-title">Cash Flow Predictions</h2>
                  <div className="predictions-content">
                    {analysis.predictions.split('\n').map((line, index) => (
                      <p key={index} className="prediction-line">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="charts-section">
                <button 
                  className="toggle-charts-btn"
                  onClick={() => setShowCharts(!showCharts)}
                >
                  {showCharts ? '📊 Hide' : '📊 Show'} Financial Insights
                </button>
                
                {showCharts && (
                  <div className="charts-grid">
                    <div className="chart-placeholder">
                      <h3>Cash Flow Trend</h3>
                      <div className="chart-content">Chart visualization here</div>
                    </div>
                    <div className="chart-placeholder">
                      <h3>Payment Distribution</h3>
                      <div className="chart-content">Chart visualization here</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-section">
                <h2 className="section-title">Ask Moneylens</h2>
                
                <div className="nudge-cards">
                  <button className="nudge-card" onClick={() => setChatInput("What are the key financial risks?")}>
                    What are the key risks?
                  </button>
                  <button className="nudge-card" onClick={() => setChatInput("How can I improve cash flow?")}>
                    Improve cash flow?
                  </button>
                  <button className="nudge-card" onClick={() => setChatInput("What payments are due soon?")}>
                    Upcoming payments?
                  </button>
                </div>

                <div className="chat-messages">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="chat-message assistant loading">
                      <div className="message-content">Analyzing your question...</div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="chat-form">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your financial documents..."
                    className="chat-input"
                    disabled={isChatLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={isChatLoading || !chatInput.trim()}
                    className="chat-submit"
                  >
                    Send
                  </button>
                </form>
              </div>

              <button onClick={clearAnalysis} className="clear-btn">
                Clear Analysis
              </button>
            </>
          )}

          {!analysis && !loading && (
            <div className="empty-state">
              <h2>Welcome to MoneyLens</h2>
              <p>Upload your financial documents to get AI-powered cash flow analysis and predictions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CashFlowAnalyzer;