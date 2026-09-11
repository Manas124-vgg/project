import React from 'react';
import IceMap from './IceMap';
import ChatWidget from './ChatWidget';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080914',
        color: '#f1f2fa',
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(165, 177, 224, 0.15)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#45e0d0',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          >
            Antarctic Mission Control · SAR Sea-Ice Intelligence
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #f1f2fa 0%, #6ddcff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PolarPath
          </h1>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(69, 224, 208, 0.08)',
            border: '1px solid rgba(69, 224, 208, 0.25)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            color: '#45e0d0',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#45e0d0',
              boxShadow: '0 0 10px #45e0d0',
            }}
          />
          Live Telemetry Active
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <IceMap height="calc(100vh - 160px)" />
        <ChatWidget />
      </main>
    </div>
  );
}

export default App;