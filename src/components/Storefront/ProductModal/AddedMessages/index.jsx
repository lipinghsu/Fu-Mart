import React from 'react';

const AddedMessages = ({
  showAdded = false,
  showUpdated = false,
  addedText = 'Added to bag',
  updatedText = 'Quantity updated!',
}) => {
  const expanded = showAdded || showUpdated;
  if (!expanded) return null;

  return (
    <div className={`message-container ${expanded ? 'expanded' : ''}`}>
      {showUpdated && (
        <div className="added-message">
          <span>{updatedText}</span>
        </div>
      )}
      {showAdded && (
        <div className="added-message">
          <span>{addedText}</span>
        </div>
      )}
    </div>
  );
};

export default AddedMessages;
