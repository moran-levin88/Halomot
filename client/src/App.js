import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [myName, setMyName] = useState('');

  useEffect(() => {
    socket.connect();
    socket.on('room_update', ({ players: pl, host }) => {
      setPlayers(pl);
    });
    socket.on('game_state', (state) => {
      setGameState(state);
      if (state) setScreen('game');
    });
    return () => {
      socket.off('room_update');
      socket.off('game_state');
    };
  }, []);

  // update isHost when players/playerId changes
  useEffect(() => {
    if (!players.length || !playerId) return;
  }, [players, playerId]);

  const createRoom = useCallback((name) => {
    socket.emit('create_room', { name }, (res) => {
      if (!res.ok) return setError(res.error);
      setRoomId(res.roomId);
      setPlayerId(res.playerId);
      setIsHost(true);
      setMyName(name);
      setScreen('lobby');
    });
  }, []);

  const joinRoom = useCallback((name, room) => {
    socket.emit('join_room', { roomId: room, name }, (res) => {
      if (!res.ok) return setError(res.error);
      setRoomId(room);
      setPlayerId(res.playerId);
      setIsHost(false);
      setMyName(name);
      setScreen('lobby');
    });
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start_game', {}, (res) => {
      if (res && !res.ok) setError(res.error);
    });
  }, []);

  const sendAction = useCallback((action) => {
    socket.emit('game_action', action, (res) => {
      if (res && !res.ok) setError(res.error);
      else setError('');
    });
  }, []);

  return (
    <div className="app" dir="rtl">
      {screen === 'home' && (
        <HomeScreen onCreate={createRoom} onJoin={joinRoom} error={error} />
      )}
      {screen === 'lobby' && (
        <Lobby
          roomId={roomId}
          players={players}
          isHost={isHost}
          onStart={startGame}
          error={error}
        />
      )}
      {screen === 'game' && gameState && (
        <GameBoard
          state={gameState}
          playerId={playerId}
          players={players}
          myName={myName}
          onAction={sendAction}
          error={error}
        />
      )}
    </div>
  );
}

function HomeScreen({ onCreate, onJoin, error }) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState('');

  return (
    <div className="home">
      <div className="home-header">
        <h1>👑 חלומות</h1>
        <p className="subtitle">Sleeping Queens — שחק אונליין עם חברים</p>
      </div>

      {!mode && (
        <div className="home-buttons">
          <button className="btn btn-primary" onClick={() => setMode('create')}>✨ צור חדר חדש</button>
          <button className="btn btn-secondary" onClick={() => setMode('join')}>🔗 הצטרף לחדר</button>
        </div>
      )}

      {mode === 'create' && (
        <div className="form-box">
          <h2>צור חדר</h2>
          <input
            className="text-input"
            placeholder="השם שלך"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name && onCreate(name)}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => name && onCreate(name)} disabled={!name}>צור חדר</button>
            <button className="btn btn-ghost" onClick={() => setMode('')}>חזרה</button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="form-box">
          <h2>הצטרף לחדר</h2>
          <input className="text-input" placeholder="השם שלך" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <input
            className="text-input code-input"
            placeholder="קוד חדר (לדוגמה: ABC123)"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => name && joinCode && onJoin(name, joinCode)} disabled={!name || joinCode.length < 6}>הצטרף</button>
            <button className="btn btn-ghost" onClick={() => setMode('')}>חזרה</button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
