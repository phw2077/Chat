import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';

export const Message = ({ msg, renderMath }) => {
  const messageRef = useRef(null);

  useEffect(() => {
    if (msg.sender === 'assistant' && messageRef.current) {
      renderMath(messageRef.current);
    }
  }, [msg.text, renderMath]);

  return (
    <div className={`message ${msg.sender}`}>
      <div className="message-content">
        <div 
          ref={messageRef}
          className="message-text" 
          dangerouslySetInnerHTML={{ 
            __html: msg.sender === 'assistant' 
              ? marked.parse(msg.text, { breaks: true }) 
              : msg.text 
          }} 
        />
      </div>
    </div>
  );
};
