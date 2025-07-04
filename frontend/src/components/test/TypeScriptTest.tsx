import React from 'react';

interface TypeScriptTestProps {
  user?: any;
}

export const TypeScriptTest: React.FC<TypeScriptTestProps> = ({ user }) => {
  return (
    <div style={{
      background: '#E3DBD6',
      padding: '1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      border: '2px solid #C58C72'
    }}>
      <h4 style={{ color: '#43362D', margin: 0 }}>
        🚀 TypeScript is Working! 
      </h4>
      <p style={{ color: '#666', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
        Types are loaded, components are working!
      </p>
    </div>
  );
};