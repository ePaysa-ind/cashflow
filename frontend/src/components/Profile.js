import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';

const Profile = ({ onClose, userProfile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    industry: '',
    zip: '',
    revenue: '',
    employees: '',
    fiscalYear: '',
    role: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Required fields for 100% completion
  const requiredFields = ['fullName', 'email', 'company', 'industry', 'role'];
  const optionalFields = ['zip', 'revenue', 'employees', 'fiscalYear', 'phone'];

  useEffect(() => {
    // Load existing profile data
    if (userProfile) {
      setFormData({
        ...formData,
        ...userProfile,
        email: userProfile.email || auth.currentUser?.email || ''
      });
    }
  }, [userProfile]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    const totalFields = requiredFields.length + optionalFields.length;
    let filledFields = 0;
    
    requiredFields.forEach(field => {
      if (formData[field]?.trim()) filledFields++;
    });
    
    optionalFields.forEach(field => {
      if (formData[field]?.trim()) filledFields++;
    });
    
    return Math.round((filledFields / totalFields) * 100);
  };

  // Get missing required fields
  const getMissingFields = () => {
    return requiredFields.filter(field => !formData[field]?.trim());
  };

  const completionPercentage = calculateCompletion();
  const missingFields = getMissingFields();
  const isComplete = missingFields.length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Phone validation (optional)
    if (formData.phone && !/^\d{3}-?\d{3}-?\d{4}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        // Generate initials
        const nameParts = formData.fullName.trim().split(' ');
        const initials = nameParts.length >= 2 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : formData.fullName.slice(0, 2).toUpperCase();
        
        const profileData = {
          ...formData,
          initials,
          profileComplete: isComplete,
          completionPercentage,
          lastUpdated: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem(`qash_profile_${user.uid}`, JSON.stringify(profileData));
        
        // Call parent update function
        if (onProfileUpdate) {
          onProfileUpdate(profileData);
        }
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          if (isComplete && onClose) {
            onClose();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const fieldLabels = {
    fullName: 'Full Name',
    email: 'Email Address',
    company: 'Company Name',
    industry: 'Industry',
    role: 'Your Role',
    zip: 'ZIP Code',
    revenue: 'Annual Revenue',
    employees: 'Number of Employees',
    fiscalYear: 'Fiscal Year End',
    phone: 'Phone Number'
  };

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Real Estate', 'Education', 'Hospitality', 'Transportation', 'Other'
  ];

  const revenueOptions = [
    'Less than $1M', '$1M - $5M', '$5M - $10M', '$10M - $50M', 
    '$50M - $100M', '$100M - $500M', 'Over $500M'
  ];

  const employeeOptions = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', 'Over 1000'
  ];

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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              margin: '0 0 8px 0',
              color: '#111827'
            }}>
              Start a 30 day free trial
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ 
                fontSize: '16px',
                color: completionPercentage === 100 ? '#10B981' : '#F59E0B',
                fontWeight: '500'
              }}>
                {completionPercentage}% Complete
              </span>
              {missingFields.length > 0 && (
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  Missing: {missingFields.map(f => fieldLabels[f]).join(', ')}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '0 24px' }}>
          <div style={{
            height: '8px',
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              backgroundColor: completionPercentage === 100 ? '#10B981' : '#F59E0B',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {/* Personal Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#374151'
            }}>
              Personal Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.fullName} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.fullName ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.fullName && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.email} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.email ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.email && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.role} *
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. CFO, Finance Director"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.role ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.role && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.role}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.phone}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="123-456-7890"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.phone ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.phone && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#374151'
            }}>
              Company Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.company} *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.company ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.company && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.company}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.industry} *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.industry ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Industry</option>
                  {industryOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.industry && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                    {errors.industry}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.revenue}
                </label>
                <select
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Revenue Range</option>
                  {revenueOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.employees}
                </label>
                <select
                  name="employees"
                  value={formData.employees}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Team Size</option>
                  {employeeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.zip}
                </label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="12345"
                  maxLength="5"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {fieldLabels.fiscalYear}
                </label>
                <select
                  name="fiscalYear"
                  value={formData.fiscalYear}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div style={{
              padding: '12px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              marginBottom: '16px',
              color: '#DC2626',
              fontSize: '14px'
            }}>
              {errors.submit}
            </div>
          )}

          {showSuccess && (
            <div style={{
              padding: '12px',
              backgroundColor: '#D1FAE5',
              border: '1px solid #A7F3D0',
              borderRadius: '6px',
              marginBottom: '16px',
              color: '#10B981',
              fontSize: '14px'
            }}>
              Profile saved successfully!
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: '#6B7280' 
          }}>
            * Required fields
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: saving ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;