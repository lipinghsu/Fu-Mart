import React, { useState } from 'react';
import { LuArrowRight } from 'react-icons/lu';

const ChatInput = ({ onSend }) => {
  const [val, setVal] = useState('');
  const submit = () => { onSend(val); setVal(''); };

  return (
    <div className="chatbot-input">
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Type a message…"
      />
      
      <button onClick={submit} className="send-btn">
        <LuArrowRight />
      </button>
    </div>
  );
};

export default ChatInput;
