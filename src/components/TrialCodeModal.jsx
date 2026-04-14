// src/components/TrialCodeModal.jsx

import { useState } from 'react';
import './TrialCodeModal.css';

export default function TrialCodeModal({ userId, email, onSuccess, isOpen, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingSlots, setRemainingSlots] = useState(null);

  const handleApplyCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // First, validate the code
      const validateRes = await fetch('/api/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          code: code.trim().toUpperCase()
        })
      });

      const validateData = await validateRes.json();

      if (!validateData.success) {
        setError(validateData.error || 'Invalid code');
        setLoading(false);
        return;
      }

      setRemainingSlots(validateData.remainingSlots);

      // If valid, apply the code to the user
      const applyRes = await fetch('/api/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          code: code.trim().toUpperCase(),
          userId: userId,
          email: email
        })
      });

      const applyData = await applyRes.json();

      if (!applyData.success) {
        setError(applyData.error || 'Failed to apply code');
        setLoading(false);
        return;
      }

      setSuccess('🎉 Trial code applied successfully! You now have full access for 30 days.');
      setCode('');
      
      // Call callback after 2 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content trial-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>🎁 Apply Free Trial Code</h2>
        <p className="modal-subtitle">Enter your trial code to get full access for 30 days</p>

        <div className="trial-input-group">
          <input
            type="text"
            placeholder="Enter trial code (e.g., TAXFREE-DEMO)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
            className="trial-input"
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleApplyCode()}
          />
          
          <button
            onClick={handleApplyCode}
            disabled={!code.trim() || loading}
            className="trial-button"
          >
            {loading ? 'Validating...' : 'Apply Code'}
          </button>
        </div>

        {remainingSlots !== null && (
          <div className="info-box">
            <p>⏳ {remainingSlots} slots remaining for this code</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>{success}</p>
          </div>
        )}

        <div className="trial-features">
          <h3>With Trial Access You Get:</h3>
          <ul>
            <li>✓ Full GST Filing (GSTR-1, GSTR-3B)</li>
            <li>✓ E-Invoice Generation</li>
            <li>✓ E-Way Bill Creation</li>
            <li>✓ GSTIN Lookup</li>
            <li>✓ Compliance Tracking</li>
            <li>✓ 30 Days Full Access</li>
          </ul>
        </div>

        <p className="trial-note">
          Don't have a code? <a href="/pricing">View pricing plans</a>
        </p>
      </div>
    </div>
  );
}
