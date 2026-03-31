import React from 'react';
import { Message } from './Message';
import { SendIcon } from './Icons';

export const ChatContainer = ({ 
  messages, 
  isLoading, 
  input, 
  setInput, 
  handleSend, 
  handleKeyPress, 
  messagesEndRef,
  renderMath
}) => {
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="icon">✨</div>
            <p>有什么我可以帮您的吗？</p>
          </div>
        )}
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} renderMath={renderMath} />
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container-wrapper">
        <div className="input-container">
          <textarea
            value={input}
            onChange={e => { 
              setInput(e.target.value); 
              e.target.style.height='auto'; 
              e.target.style.height=e.target.scrollHeight+'px'; 
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter a prompt here"
            className="input"
            rows={1}
          />
          <button 
            className="send-btn" 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
