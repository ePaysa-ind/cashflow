/**
 * Chat Section Component
 * 
 * Purpose: Interactive chat interface for document Q&A
 * Features: Message history, collapsible messages, AI responses
 * 
 * @component
 * @version 1.0.0
 */

import React from 'react';
import { icons } from '../utils/icons';

const ChatSection = ({ 
  chatHistory, 
  chatInput, 
  setChatInput, 
  isChatLoading, 
  handleChatSubmit,
  expandedMessages,
  setExpandedMessages 
}) => {
  
  const toggleMessage = (index) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #d0d0d0', paddingTop: '20px' }}>
      <h3 style={{ color: '#333', fontSize: '16px', margin: '0 0 15px 0' }}>
        Ask Questions About Your Documents
      </h3>
      
      {/* Chat History */}
      <div style={{ 
        maxHeight: '300px', 
        overflowY: 'auto', 
        marginBottom: '15px',
        backgroundColor: '#f9fafb',
        border: '1px solid #d0d0d0',
        borderRadius: '8px',
        padding: '10px'
      }}>
        {chatHistory.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No questions asked yet. Start by asking about your documents!
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: msg.type === 'user' ? '#3b82f6' : '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {msg.type === 'user' ? 'U' : 'A'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    backgroundColor: msg.type === 'user' ? '#e0e7ff' : '#ecfdf5',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    {msg.message.length > 200 && !expandedMessages[index] ? (
                      <>
                        {msg.message.substring(0, 200)}...
                        <button
                          onClick={() => toggleMessage(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginLeft: '4px'
                          }}
                        >
                          Show more
                        </button>
                      </>
                    ) : (
                      <>
                        {msg.message}
                        {msg.message.length > 200 && (
                          <button
                            onClick={() => toggleMessage(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginLeft: '4px'
                            }}
                          >
                            Show less
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isChatLoading && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '10px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              A
            </div>
            <div style={{
              backgroundColor: '#ecfdf5',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about cash flow, trends, or specific items..."
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          disabled={isChatLoading}
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isChatLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: !chatInput.trim() || isChatLoading ? '#e5e7eb' : '#3b82f6',
            color: !chatInput.trim() || isChatLoading ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: !chatInput.trim() || isChatLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatSection;