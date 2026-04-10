import React, { useState } from 'react';
import Chat from './Chat';

export default function Lobby({ roomId, players, isHost, onStart, error, chatMessages, onChat, myName }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lobby">
      <h1>👑 חלומות</h1>

      <div className="share-box">
        <p>שלח לחברים את הקוד:</p>
        <div className="room-code-row">
          <strong className="room-code-big">{roomId}</strong>
          <button className="btn btn-secondary" onClick={copyCode}>
            {copied ? '✓ הועתק' : 'העתק קוד'}
          </button>
        </div>
        <p className="share-hint">הם נכנסים ל-halomot.vercel.app ומקישים את הקוד</p>
      </div>

      <div className="player-list">
        <h3>שחקנים ({players.length}/5):</h3>
        {players.map((p, i) => (
          <div key={p.id} className="player-row">
            <span className="player-num">{i + 1}</span>
            <span className="player-name">{p.name}</span>
            {i === 0 && <span className="badge">מארח</span>}
          </div>
        ))}
        {players.length < 2 && (
          <p className="waiting">ממתין לשחקנים נוספים...</p>
        )}
      </div>

      {isHost && (
        <button
          className="btn btn-primary btn-large"
          onClick={onStart}
          disabled={players.length < 2}
        >
          🎮 התחל משחק
        </button>
      )}
      {!isHost && <p className="waiting">ממתין למארח שיתחיל את המשחק...</p>}

      {error && <p className="error">{error}</p>}

      <Chat messages={chatMessages || []} onSend={onChat} myName={myName} />
    </div>
  );
}
