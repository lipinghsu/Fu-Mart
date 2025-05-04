// MessageItem.js
import React from 'react';
import ChatBotIcon from '../../../../../assets/bb-icon.png';
import TypingIndicator from './../../TypingIndicator';

const MessageItem = ({ text, isBot, isTypingSlot }) => (
  <div className={`message-item ${isBot ? 'bot' : 'user'}`}>
    {isBot && <img src={ChatBotIcon} className='bot-icon-message-bubble' alt="bot" />}
    <div className="message-bubble">
      <div className='message-content'>
        {isTypingSlot
          ? <TypingIndicator />   // <-- floaty three‐dots
          : text                  // <-- normal message
        }
      </div>
    </div>
  </div>
);

export default MessageItem;
