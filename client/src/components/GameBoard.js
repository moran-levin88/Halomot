import React, { useState, useEffect } from 'react';

const QUEEN_COLORS = {
  rose: '#ff6b9d',
  cat: '#a78bfa',
  dog: '#60a5fa',
  pancake: '#fbbf24',
  cookie: '#d97706',
  sun: '#f59e0b',
  moon: '#818cf8',
  star: '#34d399',
  ladybug: '#f87171',
  strawberry: '#fb7185',
  ice: '#93c5fd',
  cake: '#c084fc',
};

const CARD_LABELS = {
  king: '♚ מלך',
  knight: '⚔️ אביר',
  dragon: '🐉 דרקון',
  potion: '🧪 שיקוי',
  wand: '🪄 שרביט',
  jester: '🃏 ליצן',
};

export default function GameBoard({ state, playerId, players, myName, onAction, error }) {
  const [selected, setSelected] = useState([]); // selected card IDs
  const [pendingPlay, setPendingPlay] = useState(null); // { type: 'king'|'knight'|'potion', card }
  const [message, setMessage] = useState('');

  const me = state.players[playerId];
  const isMyTurn = state.currentPlayer === playerId;
  const phase = state.phase;

  useEffect(() => {
    setSelected([]);
    setPendingPlay(null);
  }, [state.currentPlayer]);

  useEffect(() => {
    if (state.winner) {
      const winnerData = players.find(p => p.id === state.winner);
      setMessage(state.winner === playerId
        ? '🎉 ניצחת! כל הכבוד!'
        : `👑 ${winnerData?.name || state.winner} ניצח!`);
    }
  }, [state.winner, playerId, players]);

  const myHand = me?.hand || [];
  const getName = (pid) => players.find(p => p.id === pid)?.name || pid;

  // ---- Action handlers ----

  function selectCard(card) {
    if (!isMyTurn || phase !== 'play') return;
    // If clicking a power card - initiate action
    if (['king', 'knight', 'potion', 'jester'].includes(card.type)) {
      if (selected.includes(card.id)) {
        setSelected([]);
        setPendingPlay(null);
      } else {
        setSelected([card.id]);
        setPendingPlay({ type: card.type, cardId: card.id });
      }
      return;
    }
    // Number cards - multi-select for discard
    setSelected(prev =>
      prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
    );
    setPendingPlay(null);
  }

  function playKing(queenIndex) {
    onAction({ type: 'play_king', cardId: pendingPlay.cardId, queenIndex });
    setPendingPlay(null);
    setSelected([]);
  }

  function playKnight(targetPlayerId, queenId) {
    onAction({ type: 'play_knight', cardId: pendingPlay.cardId, targetPlayerId, queenId });
    setPendingPlay(null);
    setSelected([]);
  }

  function playPotion(targetPlayerId, queenId) {
    onAction({ type: 'play_potion', cardId: pendingPlay.cardId, targetPlayerId, queenId });
    setPendingPlay(null);
    setSelected([]);
  }

  function playJester() {
    onAction({ type: 'play_jester', cardId: pendingPlay.cardId });
    setPendingPlay(null);
    setSelected([]);
  }

  function discardSelected() {
    if (selected.length === 0) return;
    onAction({ type: 'discard', cardIds: selected });
    setSelected([]);
  }

  function respondDragon(use, cardId) {
    onAction({ type: 'respond_dragon', use, cardId });
  }

  function respondWand(use, cardId) {
    onAction({ type: 'respond_wand', use, cardId });
  }

  function pickJesterQueen(queenIndex) {
    onAction({ type: 'jester_queen', queenIndex });
  }

  function pickRoseBonus(queenIndex) {
    onAction({ type: 'rose_bonus', queenIndex });
  }

  // ---- Instruction text ----
  function getInstruction() {
    if (state.winner) return message;
    if (phase === 'waiting_dragon' && state.pendingAction?.toPlayer === playerId) {
      const dragonCard = myHand.find(c => c.type === 'dragon');
      return dragonCard
        ? `${getName(state.pendingAction.fromPlayer)} שולח אביר! יש לך דרקון - האם לעצור?`
        : `${getName(state.pendingAction.fromPlayer)} שולח אביר ואין לך דרקון.`;
    }
    if (phase === 'waiting_wand' && state.pendingAction?.toPlayer === playerId) {
      const wandCard = myHand.find(c => c.type === 'wand');
      return wandCard
        ? `${getName(state.pendingAction.fromPlayer)} מנסה להרדים מלכה! יש לך שרביט - האם להגן?`
        : `${getName(state.pendingAction.fromPlayer)} מרדים מלכה ואין לך שרביט.`;
    }
    if (phase === 'waiting_jester_queen' && state.pendingAction?.toPlayer === playerId)
      return 'הליצן בחר אותך! בחר מלכה לישנה להעיר 👇';
    if (phase === 'waiting_rose' && state.pendingAction?.playerId === playerId)
      return 'מלכת הוורדים! בחר מלכה נוספת 🌹';
    if (!isMyTurn) return `התור של ${getName(state.currentPlayer)}...`;
    if (pendingPlay?.type === 'king') return 'בחר מלכה לישנה להעיר 👇';
    if (pendingPlay?.type === 'knight') return 'בחר מלכה של יריב לגנוב ⚔️';
    if (pendingPlay?.type === 'potion') return 'בחר מלכה של יריב להרדים 🧪';
    if (pendingPlay?.type === 'jester') return 'לחץ "שחק ליצן" לזרוק את הקוביה 🃏';
    if (selected.length > 0) return 'לחץ "השלך" להשתמש בקלפים שנבחרו';
    return 'בחר קלף לשחק, או בחר קלפים להשלכה';
  }

  const instruction = getInstruction();

  // ---- Render helpers ----
  function QueenCard({ queen, onClick, dimmed, small }) {
    const color = QUEEN_COLORS[queen.id] || '#888';
    return (
      <div
        className={`queen-card ${dimmed ? 'dimmed' : ''} ${small ? 'small' : ''} ${onClick ? 'clickable' : ''}`}
        style={{ borderColor: color, background: `${color}22` }}
        onClick={onClick}
        title={queen.name}
      >
        <div className="queen-emoji" style={{ color }}>♛</div>
        <div className="queen-name">{queen.name}</div>
        <div className="queen-pts">{queen.points} נק'</div>
      </div>
    );
  }

  function SleepingQueenSlot({ queen, index }) {
    const canWake = (pendingPlay?.type === 'king' && isMyTurn) ||
      (phase === 'waiting_jester_queen' && state.pendingAction?.toPlayer === playerId) ||
      (phase === 'waiting_rose' && state.pendingAction?.playerId === playerId);

    if (!queen) return <div className="queen-slot empty" />;
    return (
      <div
        className={`queen-slot sleeping ${canWake ? 'can-wake' : ''}`}
        onClick={() => canWake ? (
          phase === 'waiting_jester_queen' ? pickJesterQueen(index) :
          phase === 'waiting_rose' ? pickRoseBonus(index) :
          playKing(index)
        ) : null}
        title={canWake ? 'לחץ להעיר' : 'מלכה ישנה'}
      >
        <div className="sleeping-crown">♛</div>
        <div className="sleeping-label">ישנה</div>
      </div>
    );
  }

  function HandCard({ card }) {
    const isSelected = selected.includes(card.id);
    const label = card.type === 'number' ? card.value : CARD_LABELS[card.type] || card.type;
    return (
      <div
        className={`hand-card ${isSelected ? 'selected' : ''} ${isMyTurn && phase === 'play' ? 'playable' : ''}`}
        onClick={() => selectCard(card)}
        title={card.type}
      >
        <div className="card-label">{label}</div>
        <div className="card-type">{card.type === 'number' ? '🔢' : ''}</div>
      </div>
    );
  }

  // ---- Defense prompt ----
  function DefensePrompt() {
    if (phase === 'waiting_dragon' && state.pendingAction?.toPlayer === playerId) {
      const dragon = myHand.find(c => c.type === 'dragon');
      return (
        <div className="defense-prompt">
          <p>{instruction}</p>
          {dragon
            ? <><button className="btn btn-danger" onClick={() => respondDragon(true, dragon.id)}>🐉 שחק דרקון!</button>
               <button className="btn btn-ghost" onClick={() => respondDragon(false, null)}>אל תעצור</button></>
            : <button className="btn btn-ghost" onClick={() => respondDragon(false, null)}>אישור (אין דרקון)</button>
          }
        </div>
      );
    }
    if (phase === 'waiting_wand' && state.pendingAction?.toPlayer === playerId) {
      const wand = myHand.find(c => c.type === 'wand');
      return (
        <div className="defense-prompt">
          <p>{instruction}</p>
          {wand
            ? <><button className="btn btn-primary" onClick={() => respondWand(true, wand.id)}>🪄 שחק שרביט!</button>
               <button className="btn btn-ghost" onClick={() => respondWand(false, null)}>אל תגן</button></>
            : <button className="btn btn-ghost" onClick={() => respondWand(false, null)}>אישור (אין שרביט)</button>
          }
        </div>
      );
    }
    return null;
  }

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-header">
        <h2>👑 חלומות</h2>
        <div className="deck-info">קופה: {state.drawPileCount} קלפים</div>
      </div>

      {/* Instruction banner */}
      <div className={`instruction-banner ${isMyTurn ? 'my-turn' : ''}`}>
        {instruction}
      </div>

      {/* Error */}
      {error && <div className="error-toast">{error}</div>}

      {/* Defense prompt */}
      <DefensePrompt />

      {/* Opponents */}
      <div className="opponents-area">
        {state.playerOrder.filter(pid => pid !== playerId).map(pid => {
          const p = state.players[pid];
          const pts = p.awakeQueens.reduce((s, q) => s + q.points, 0);
          const canStealFromHere = pendingPlay?.type === 'knight' || pendingPlay?.type === 'potion';
          return (
            <div key={pid} className={`opponent ${state.currentPlayer === pid ? 'active' : ''}`}>
              <div className="opponent-header">
                <strong>{getName(pid)}</strong>
                <span className="pts-badge">{pts} נק'</span>
                <span className="hand-count">🃏×{p.handCount}</span>
              </div>
              <div className="opponent-queens">
                {p.awakeQueens.length === 0 && <span className="no-queens">אין מלכות</span>}
                {p.awakeQueens.map(queen => (
                  <QueenCard
                    key={queen.id}
                    queen={queen}
                    small
                    dimmed={!canStealFromHere}
                    onClick={canStealFromHere ? () => (
                      pendingPlay.type === 'knight'
                        ? playKnight(pid, queen.id)
                        : playPotion(pid, queen.id)
                    ) : null}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sleeping queens grid */}
      <div className="sleeping-area">
        <h3>מלכות ישנות</h3>
        <div className="queens-grid">
          {state.sleepingQueens.map((queen, i) => (
            <SleepingQueenSlot key={i} queen={queen} index={i} />
          ))}
        </div>
      </div>

      {/* My area */}
      <div className="my-area">
        <div className="my-header">
          <strong>{myName} (אתה)</strong>
          <span className="pts-badge">{(me?.awakeQueens || []).reduce((s, q) => s + q.points, 0)} נק'</span>
        </div>

        {/* My awake queens */}
        <div className="my-queens">
          {(me?.awakeQueens || []).map(queen => (
            <QueenCard key={queen.id} queen={queen} small />
          ))}
          {me?.awakeQueens.length === 0 && <span className="no-queens">עדיין אין מלכות</span>}
        </div>

        {/* Hand */}
        <div className="hand-area">
          <div className="hand-cards">
            {myHand.map(card => <HandCard key={card.id} card={card} />)}
          </div>

          {/* Actions */}
          {isMyTurn && phase === 'play' && (
            <div className="action-buttons">
              {pendingPlay?.type === 'jester' && (
                <button className="btn btn-primary" onClick={playJester}>🃏 שחק ליצן</button>
              )}
              {selected.length > 0 && !pendingPlay && (
                <button className="btn btn-secondary" onClick={discardSelected}>
                  השלך {selected.length} קלפ{selected.length > 1 ? 'ים' : ''} ומשוך חדשים
                </button>
              )}
              {selected.length > 0 && (
                <button className="btn btn-ghost" onClick={() => { setSelected([]); setPendingPlay(null); }}>
                  בטל בחירה
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log */}
      <div className="game-log">
        {[...(state.log || [])].reverse().map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
      </div>

      {/* Win overlay */}
      {state.winner && (
        <div className="win-overlay">
          <div className="win-box">
            <div className="win-emoji">👑</div>
            <h2>{message}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
