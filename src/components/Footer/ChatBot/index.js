import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import axios from 'axios';
import './ChatBot.scss';
const apiKey = process.env.REACT_APP_OPENAI_API_KEY

const ChatBot = ({showPopoutBox, setShowPopoutBox}) => {
  const [messages, setMessages] = useState([
    { text: 'What can I assist you with?', isBot: true }
  ]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const updated = [...messages, { text, isBot: false }];
    setMessages(updated);

    try {
      const { data } = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'text-davinci-003',
          prompt: text,
          max_tokens: 60,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      )

      const reply = data.choices[0].text.trim();
      setMessages([...updated, { text: reply, isBot: true }]);

    } catch (err) {
      // setMessages([...updated, { text: err.toString(), isBot: true }]);
      setMessages([...updated, { text: "Oops, something went wrong.", isBot: true }]);
    }
  };

  return (
    <div className="chatbot">
      <ChatHeader title="MUSTANG ASSISTANT" 
        showPopoutBox={showPopoutBox} 
        setShowPopoutBox={setShowPopoutBox}
      />

      <MessageList messages={messages} showPopoutBox={showPopoutBox}/>

      <ChatInput onSend={sendMessage}/>
    </div>
  );
};

export default ChatBot;
