import React, { useState, useEffect } from 'react';
import Chat from './Chat';

const QUEEN_COLORS = {
  rose:       '#ff6b9d',
  cat:        '#f97316',
  dog:        '#14b8a6',
  pancake:    '#b45309',
  moon:       '#818cf8',
  butterfly:  '#a855f7',
  sunflower:  '#eab308',
  heart:      '#ef4444',
  rainbow:    '#06b6d4',
  cake:       '#f87171',
  icecream:   '#84cc16',
  starfish:   '#f59e0b',
  strawberry: '#fb7185',
  peacock:    '#d4a017',
  books:      '#c084fc',
  ladybug:    '#dc2626',
};

const CARD_LABELS = {
  knight: { top: '⚔️', label: 'אביר' },
  dragon: { top: '🐉', label: 'דרקון' },
  potion: { top: '🧪', label: 'שיקוי' },
  wand:   { top: '🪄', label: 'שרביט' },
  jester: { top: '🃏', label: 'ליצן' },
};

export default function GameBoard({ state, playerId, players, myName, onAction, error, chatMessages, onChat }) {
  const [selected, setSelected] = useState([]);
  const [pendingPlay, setPendingPlay] = useState(null);
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

  // Build a map: queenId -> ownerName (for awake queens)
  const queenOwnerMap = {};
  for (const pid of state.playerOrder) {
    for (const q of state.players[pid].awakeQueens) {
      queenOwnerMap[q.id] = { name: getName(pid), isMe: pid === playerId };
    }
  }

  // Count special cards in my hand (for display)
  const handCounts = myHand.reduce((acc, c) => {
    if (c.type !== 'number') acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  // ---- Action handlers ----
  function selectCard(card) {
    if (!isMyTurn || phase !== 'play') return;
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
    setSelected(prev =>
      prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
    );
    setPendingPlay(null);
  }

  function playKing(queenIndex) {
    onAction({ type: 'play_king', cardId: pendingPlay.cardId, queenIndex });
    setPendingPlay(null); setSelected([]);
  }
  function playKnight(targetPlayerId, queenId) {
    onAction({ type: 'play_knight', cardId: pendingPlay.cardId, targetPlayerId, queenId });
    setPendingPlay(null); setSelected([]);
  }
  function playPotion(targetPlayerId, queenId) {
    onAction({ type: 'play_potion', cardId: pendingPlay.cardId, targetPlayerId, queenId });
    setPendingPlay(null); setSelected([]);
  }
  function playJester() {
    onAction({ type: 'play_jester', cardId: pendingPlay.cardId });
    setPendingPlay(null); setSelected([]);
  }
  function discardSelected() {
    if (selected.length === 0) return;
    onAction({ type: 'discard', cardIds: selected });
    setSelected([]);
  }
  function respondDragon(use, cardId) { onAction({ type: 'respond_dragon', use, cardId }); }
  function respondWand(use, cardId) { onAction({ type: 'respond_wand', use, cardId }); }
  function pickJesterQueen(queenIndex) { onAction({ type: 'jester_queen', queenIndex }); }
  function pickRoseBonus(queenIndex) { onAction({ type: 'rose_bonus', queenIndex }); }

  // ---- Instruction ----
  function getInstruction() {
    if (state.winner) return message;
    // Waiting phases — defender side
    if (phase === 'waiting_dragon' && state.pendingAction?.toPlayer === playerId) {
      const has = myHand.find(c => c.type === 'dragon');
      return has ? `${getName(state.pendingAction.fromPlayer)} שולח אביר! יש לך דרקון - האם לעצור?`
                 : `${getName(state.pendingAction.fromPlayer)} שולח אביר ואין לך דרקון.`;
    }
    if (phase === 'waiting_wand' && state.pendingAction?.toPlayer === playerId) {
      const has = myHand.find(c => c.type === 'wand');
      return has ? `${getName(state.pendingAction.fromPlayer)} מנסה להרדים מלכה! יש לך שרביט - האם להגן?`
                 : `${getName(state.pendingAction.fromPlayer)} מרדים מלכה ואין לך שרביט.`;
    }
    // Waiting phases — attacker side (waiting for opponent to respond)
    if (phase === 'waiting_dragon' && state.pendingAction?.fromPlayer === playerId)
      return `⏳ ממתין לתגובת ${getName(state.pendingAction.toPlayer)}...`;
    if (phase === 'waiting_wand' && state.pendingAction?.fromPlayer === playerId)
      return `⏳ ממתין לתגובת ${getName(state.pendingAction.toPlayer)}...`;
    if (phase === 'waiting_jester_queen' && state.pendingAction?.toPlayer === playerId)
      return 'הליצן בחר אותך! בחר מלכה לישנה להעיר 👇';
    if (phase === 'waiting_jester_queen' && state.pendingAction?.fromPlayer === playerId)
      return `⏳ ממתין ל${getName(state.pendingAction.toPlayer)} לבחור מלכה...`;
    if (phase === 'waiting_rose' && state.pendingAction?.playerId === playerId)
      return 'מלכת הוורדים! בחר מלכה נוספת 🌹';
    if (!isMyTurn) return `התור של ${getName(state.currentPlayer)}...`;
    if (pendingPlay?.type === 'king') return 'בחר מלכה לישנה להעיר 👇';
    if (pendingPlay?.type === 'knight') return '⚔️ בחר מלכה ערה של יריב לגנוב (למעלה)';
    if (pendingPlay?.type === 'potion') return '🧪 בחר מלכה ערה של יריב להרדים (למעלה)';
    if (pendingPlay?.type === 'jester') return '🃏 לחץ "שחק ליצן" לחשוף קלף מהקופה';
    if (selected.length > 0) return 'לחץ "השלך" להשתמש בקלפים שנבחרו';
    return 'בחר קלף לשחק, או בחר קלפים להשלכה';
  }

  const instruction = getInstruction();

  // ---- Render: Queen Card (awake, face up) ----
  function QueenCard({ queen, onClick, dimmed, small, ownerLabel }) {
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
        {ownerLabel && <div className="queen-owner" style={{ color }}>{ownerLabel}</div>}
      </div>
    );
  }

  // ---- Render: Board slot (sleeping or awake) ----
  function QueenBoardSlot({ queen, index }) {
    // Check if this queen is awake (owned by someone)
    if (queen && queenOwnerMap[queen.id]) {
      // Queen is awake - show face up with owner
      const owner = queenOwnerMap[queen.id];
      return (
        <QueenCard
          queen={queen}
          small
          ownerLabel={owner.isMe ? 'שלי ✓' : owner.name}
        />
      );
    }

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

  // ---- Render: Hand Card ----
  function HandCard({ card }) {
    const isSelected = selected.includes(card.id);
    const info = CARD_LABELS[card.type];
    const isKing = card.type === 'king';
    return (
      <div
        className={`hand-card ${isSelected ? 'selected' : ''} ${isMyTurn && phase === 'play' ? 'playable' : ''} ${(info || isKing) ? 'special-card' : ''}`}
        onClick={() => selectCard(card)}
        title={isKing ? card.name : undefined}
      >
        {isKing ? (
          <>
            <div className="card-top-icon">♚</div>
            <div className="card-special-label king-name">{card.name || 'מלך'}</div>
          </>
        ) : info ? (
          <>
            <div className="card-top-icon">{info.top}</div>
            <div className="card-special-label">{info.label}</div>
            {handCounts[card.type] > 1 && <div className="card-count">×{handCounts[card.type]}</div>}
          </>
        ) : (
          <div className="card-number">{card.value}</div>
        )}
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

  const allQueens = [...state.sleepingQueens];
  const myPoints = (me?.awakeQueens || []).reduce((s, q) => s + q.points, 0);
  const targeting = pendingPlay?.type === 'knight' || pendingPlay?.type === 'potion';
  const needDefense =
    (phase === 'waiting_dragon' && state.pendingAction?.toPlayer === playerId) ||
    (phase === 'waiting_wand'   && state.pendingAction?.toPlayer === playerId);

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-header">
        <h2>👑 חלומות</h2>
        <div className="deck-info">קופה: {state.drawPileCount} קלפים</div>
      </div>

      {/* Defense alert — sticky, very prominent */}
      {needDefense && (
        <div className="defense-alert">
          <DefensePrompt />
        </div>
      )}

      {/* Turn banner */}
      <div className={`instruction-banner ${isMyTurn || needDefense ? 'my-turn' : ''}`}>
        {isMyTurn && !needDefense && <span className="turn-pulse">▶ </span>}
        {instruction}
      </div>

      {error && <div className="error-toast">{error}</div>}

      {/* ===== MY AREA — top ===== */}
      <div className={`my-area ${isMyTurn ? 'my-turn-area' : ''}`}>
        <div className="my-header">
          <strong>👤 {myName}</strong>
          <span className="pts-badge">{myPoints} נק'</span>
          <span className="queen-count-badge">♛×{(me?.awakeQueens || []).length}</span>
        </div>

        {/* My awake queens */}
        {(me?.awakeQueens || []).length > 0 && (
          <div className="my-queens">
            {(me.awakeQueens).map(queen => (
              <QueenCard key={queen.id} queen={queen} small />
            ))}
          </div>
        )}

        {/* Hand */}
        <div className="hand-area">
          <div className="hand-label">הקלפים שלי:</div>
          <div className="hand-cards">
            {myHand.map(card => <HandCard key={card.id} card={card} />)}
          </div>

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

      {/* Discard pile — near top */}
      {(state.discardPile?.length > 0) && (
        <div className="discard-area">
          <div className="discard-title">🗂️ קופת השלכות ({state.discardPile.length} קלפים)</div>
          <div className="discard-row">
            {[...state.discardPile].reverse().map((card, i) => (
              <div key={i} className="discard-card">
                {card.type === 'number' ? (
                  <span className="discard-number">{card.value}</span>
                ) : card.type === 'king' ? (
                  <><span className="discard-icon">♚</span><span className="discard-label">{card.name || 'מלך'}</span></>
                ) : (
                  <><span className="discard-icon">{CARD_LABELS[card.type]?.top || '?'}</span>
                    <span className="discard-label">{CARD_LABELS[card.type]?.label || card.type}</span></>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opponents */}
      <div className={`opponents-area ${targeting ? 'targeting' : ''}`}>
        {targeting && !state.playerOrder.filter(pid => pid !== playerId).some(pid => state.players[pid].awakeQueens.length > 0) && (
          <div className="no-target-warning">
            ⚠️ לאף יריב אין מלכות ערות כרגע — לחץ "בטל בחירה"
          </div>
        )}
        {state.playerOrder.filter(pid => pid !== playerId).map(pid => {
          const p = state.players[pid];
          const pts = p.awakeQueens.reduce((s, q) => s + q.points, 0);
          return (
            <div key={pid} className={`opponent ${state.currentPlayer === pid ? 'active' : ''} ${targeting ? 'targetable' : ''}`}>
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
                    dimmed={false}
                    onClick={targeting ? () => (
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
        <h3>מלכות ישנות 💤</h3>
        <div className="queens-grid">
          {allQueens.map((queen, i) => (
            <QueenBoardSlot key={i} queen={queen} index={i} />
          ))}
        </div>
      </div>

      {/* Log */}
      <div className="game-log">
        {[...(state.log || [])].reverse().map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
      </div>

      {state.winner && (
        <div className="win-overlay">
          <div className="win-box">
            <div className="win-emoji">👑</div>
            <h2>{message}</h2>
          </div>
        </div>
      )}

      <Chat messages={chatMessages || []} onSend={onChat} myName={myName} />
    </div>
  );
}
