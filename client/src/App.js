import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Read room code from URL (e.g. ?room=B8EEE3)
  const urlRoom = new URLSearchParams(window.location.search).get('room') || '';

  // Refs so reconnect handler can read latest state
  const roomIdRef = useRef(null);
  const playerIdRef = useRef(null);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      const rId = roomIdRef.current;
      const pId = playerIdRef.current;
      if (rId && pId) {
        socket.emit('rejoin_room', { roomId: rId, playerId: pId }, (res) => {
          if (!res?.ok) {
            setScreen('home');
            setError('החדר לא קיים יותר. צור חדר חדש.');
            setRoomId(null);
            setPlayerId(null);
          }
        });
      }
    });

    socket.on('room_update', ({ players: pl }) => {
      setPlayers(pl);
    });
    socket.on('game_state', (state) => {
      setGameState(state);
      if (state) setScreen('game');
    });
    return () => {
      socket.off('connect');
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
    setError('');
    socket.emit('join_room', { roomId: room, name }, (res) => {
      if (!res.ok) return setError(res.error);
      setRoomId(room);
      setPlayerId(res.playerId);
      setIsHost(false);
      setMyName(name);
      setError('');
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
        <HomeScreen onCreate={createRoom} onJoin={joinRoom} error={error} urlRoom={urlRoom} />
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

function HomeScreen({ onCreate, onJoin, error, urlRoom }) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState(urlRoom);
  const [mode, setMode] = useState(urlRoom ? 'join' : '');

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
