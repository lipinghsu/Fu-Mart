import React from 'react';
import { BiBot } from 'react-icons/bi';
import ChatBotIcon from '../../../../assets/bb-icon.png'
import MinimizeIcon from '../../../../assets/minimize-icon.png'


const ChatHeader = ({ title, setShowPopoutBox, showPopoutBox }) => {

  const togglePopoutBox = () => {
    setShowPopoutBox(!showPopoutBox);
  };
  
  return(
    <div className="chatbot-header">
      <div className='bot-icon'>
        <img src={ChatBotIcon}/>
      </div>
      <div className="header-title">{title}</div>
      <div className="header-actions" onClick={togglePopoutBox}>
        <img src={MinimizeIcon} />
      </div>
    </div>
  );
}

export default ChatHeader;