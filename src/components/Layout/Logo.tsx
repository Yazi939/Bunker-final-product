import React from 'react';

const Logo: React.FC = () => {
  return (
    <div style={{ padding: '10px', textAlign: 'center' }}>
      <img
        src="/brand-logo.png"
        alt="Bunker Boats"
        style={{ maxWidth: '180px', width: '100%', height: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
};

export default Logo; 