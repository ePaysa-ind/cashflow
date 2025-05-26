import React from 'react';

const UploadLimitModal = ({ 
  isOpen, 
  onClose, 
  uploadsUsed, 
  uploadLimit, 
  daysUntilReset,
  onUpgrade,
  userTier = 'free' 
}) => {
  if (!isOpen) return null;

  const getResetDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '480px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#111827' 
          }}>
            Monthly Upload Limit Reached
          </h2>
          <p style={{ 
            color: '#6B7280', 
            fontSize: '16px',
            margin: 0 
          }}>
            You've used all {uploadLimit} uploads for this month
          </p>
        </div>

        {/* Status */}
        <div style={{
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>Uploads used</span>
            <span style={{ color: '#111827', fontWeight: '600' }}>
              {uploadsUsed} / {uploadLimit}
            </span>
          </div>
          
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#DC2626',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <p style={{ 
            marginTop: '12px', 
            fontSize: '14px', 
            color: '#6B7280',
            margin: '12px 0 0 0'
          }}>
            Your limit resets on {getResetDate()} ({daysUntilReset} days)
          </p>
        </div>

        {/* What you can still do */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#111827'
          }}>
            You can still:
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#6B7280',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li>View and re-analyze your previous documents</li>
            <li>Export your analysis results</li>
            <li>Chat with Qash about analyzed documents</li>
            <li>Access all your saved reports</li>
          </ul>
        </div>

        {/* Upgrade benefits */}
        <div style={{
          backgroundColor: '#EFF6FF',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #DBEAFE'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.09 8.26L21 9.27L16.5 13.97L17.59 21L12 17.77L6.41 21L7.5 13.97L3 9.27L9.91 8.26L12 2Z" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upgrade to Pro
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#1E40AF',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li><strong>Unlimited</strong> document uploads</li>
            <li>Priority processing speed</li>
            <li>Advanced analytics features</li>
            <li>API access for integrations</li>
            <li>Dedicated support</li>
          </ul>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#F9FAFB';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Continue with Free
          </button>
          <button
            onClick={onUpgrade}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3B82F6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2563EB';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3B82F6';
            }}
          >
            Upgrade to Pro
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadLimitModal;