import React from 'react';
import { PlusIcon, TrashIcon } from './Icons';

export const Sidebar = ({ 
  sessions, 
  currentSessionId, 
  setCurrentSessionId, 
  sidebarOpen, 
  setSidebarOpen, 
  handleNewChat, 
  deleteSession 
}) => {
  return (
    <>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <PlusIcon />
            新建对话
          </button>
        </div>
        <div className="history-list">
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={`history-item ${s.id === currentSessionId ? 'active' : ''}`}
              onClick={() => { 
                setCurrentSessionId(s.id); 
                if(window.innerWidth < 768) setSidebarOpen(false); 
              }}
            >
              <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{s.title}</span>
              <button className="delete-chat-btn" onClick={(e) => deleteSession(e, s.id)} title="删除">
                <TrashIcon width="14" height="14" />
              </button>
            </div>
          ))}
        </div>
      </div>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </>
  );
};
