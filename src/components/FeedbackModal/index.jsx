import React, { useState } from 'react';
import './FeedbackModal.scss';
import { firestore } from '../../firebase/utils';


const FeedbackModal = ({ onClose }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter your feedback.');
      return;
    }
  
    const feedbackData = {
      message: message.trim(),
      timestamp: new Date(),
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        referrer: document.referrer,
      },
    };
  
    try {
      await firestore.collection('feedback').add(feedbackData);
      alert('Thank you for your feedback!');
      setMessage('');
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Feedback</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your feedback..."
            rows="5"
            required
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
