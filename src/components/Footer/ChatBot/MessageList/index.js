// MessageList.js
import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';


const MessageList = ({ messages, showPopoutBox, isTyping }) => {
  const endRef = useRef();

  useEffect(() => {
    if (showPopoutBox) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showPopoutBox]);

  return (
    <div className="chatbot-messages">
      {messages.map((m, i) => {
        // if we're typing and this is the *next* bot message slot, render typing
        const shouldShowTyping = isTyping && m.isBot && i === messages.length - 1;
        return (
          <MessageItem
            key={i}
            text={m.text}
            isBot={m.isBot}
            isTypingSlot={shouldShowTyping}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
