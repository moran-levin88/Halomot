import React from 'react';

export default function Lobby({ roomId, players, isHost, onStart, error }) {
  const link = `${window.location.origin}?room=${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="lobby">
      <h1>👑 חלומות</h1>
      <div className="room-code">
        <span>קוד חדר:</span>
        <strong>{roomId}</strong>
      </div>

      <div className="share-box">
        <p>שלח לחברים:</p>
        <div className="share-row">
          <input className="text-input share-link" readOnly value={link} />
          <button className="btn btn-secondary" onClick={copyLink}>העתק</button>
        </div>
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
    </div>
  );
}
