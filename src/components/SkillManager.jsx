import React from 'react';
import { toolsList } from '../tools';

export const SkillManager = ({
  activeSkills,
  setActiveSkills,
  setShowSkillManager
}) => {
  const toggleSkill = (skillName) => {
    setActiveSkills(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(name => name !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
  };

  return (
    <div className="settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>🛠️ 技能中心</h2>
      </div>
      
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
        开启以下技能，让你的 AI 助手拥有更多能力。
      </p>

      <div className="skills-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {toolsList.map(tool => (
          <div key={tool.name} style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #eee'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
                {tool.name === 'calculator' ? '🧮 基础计算器' : tool.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                {tool.description}
              </p>
            </div>
            
            <button 
              onClick={() => toggleSkill(tool.name)}
              style={{
                marginLeft: '1rem',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                backgroundColor: activeSkills.includes(tool.name) ? '#10a37f' : '#e0e0e0',
                color: activeSkills.includes(tool.name) ? '#fff' : '#666',
                transition: 'all 0.2s'
              }}
            >
              {activeSkills.includes(tool.name) ? '已开启' : '未开启'}
            </button>
          </div>
        ))}
        
        {toolsList.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>
            目前还没有可用的技能
          </div>
        )}
      </div>

      <button 
        className="save-btn" 
        style={{ marginTop: '2rem' }}
        onClick={() => setShowSkillManager(false)}
      >
        完成
      </button>
    </div>
  );
};
