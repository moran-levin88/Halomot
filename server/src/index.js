const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Prevent server crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
const {
  createGame, currentPlayer, playAction,
  respondDragon, respondWand, respondJesterQueen, playRoseBonus,
  removePlayerFromGame,
} = require('./gameLogic');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  allowEIO3: true,
});

// rooms: { [roomId]: { id, players: [{id, name, socketId}], game, host } }
const rooms = {};
// Grace period timers before removing disconnected players
const disconnectTimers = {};

function getRoomView(room, forPlayerId) {
  if (!room.game) return null;
  const g = room.game;
  // Return full state but hide other players' hands
  const players = {};
  for (const pid of g.playerOrder) {
    players[pid] = {
      name: room.players.find(p => p.id === pid)?.name || pid,
      awakeQueens: g.players[pid].awakeQueens,
      handCount: g.players[pid].hand.length,
      hand: pid === forPlayerId ? g.players[pid].hand : undefined,
    };
  }
  // Replace player IDs with names in log entries
  const nameMap = {};
  for (const p of room.players) nameMap[p.id] = p.name;
  const log = g.log.slice(-15).map(entry => {
    let s = entry;
    for (const [id, name] of Object.entries(nameMap)) s = s.split(id).join(name);
    return s;
  });

  return {
    players,
    playerOrder: g.playerOrder,
    sleepingQueens: g.sleepingQueens,
    drawPileCount: g.drawPile.length,
    discardPile: g.discardPile.slice(-20),
    currentPlayer: currentPlayer(g),
    phase: g.phase,
    pendingAction: g.pendingAction,
    winner: g.winner,
    log,
  };
}

function broadcastRoom(room) {
  for (const p of room.players) {
    const socket = io.sockets.sockets.get(p.socketId);
    if (socket) {
      socket.emit('game_state', getRoomView(room, p.id));
    }
  }
}

// ==================== SOCKET EVENTS ====================
io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  // Wrap every handler so a crash in one game doesn't kill the server
  const safe = (fn) => (...args) => {
    try { fn(...args); }
    catch (e) {
      console.error('Socket handler error:', e);
      const cb = args[args.length - 1];
      if (typeof cb === 'function') cb({ ok: false, error: 'שגיאת שרת פנימית' });
    }
  };

  socket.on('create_room', safe(({ name }, cb) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const playerId = uuidv4();
    rooms[roomId] = {
      id: roomId,
      host: playerId,
      players: [{ id: playerId, name, socketId: socket.id }],
      game: null,
    };
    socket.join(roomId);
    socket.data = { roomId, playerId };
    cb({ ok: true, roomId, playerId });
    io.to(roomId).emit('room_update', {
      roomId,
      players: rooms[roomId].players.map(p => ({ id: p.id, name: p.name })),
      host: rooms[roomId].host,
    });
  }));

  socket.on('join_room', safe(({ roomId, name }, cb) => {
    const room = rooms[roomId];
    if (!room) return cb({ ok: false, error: 'חדר לא קיים — בקש מהמארח ליצור חדר חדש' });
    if (room.game) return cb({ ok: false, error: 'משחק כבר התחיל' });
    if (room.players.length >= 5) return cb({ ok: false, error: 'החדר מלא' });

    const playerId = uuidv4();
    room.players.push({ id: playerId, name, socketId: socket.id });
    socket.join(roomId);
    socket.data = { roomId, playerId };
    cb({ ok: true, playerId });
    io.to(roomId).emit('room_update', {
      roomId,
      players: room.players.map(p => ({ id: p.id, name: p.name })),
      host: room.host,
    });
  }));

  socket.on('start_game', safe((_, cb) => {
    const { roomId, playerId } = socket.data || {};
    const room = rooms[roomId];
    if (!room) return cb?.({ ok: false, error: 'חדר לא קיים' });
    if (room.host !== playerId) return cb?.({ ok: false, error: 'רק המארח יכול להתחיל' });
    if (room.players.length < 2) return cb?.({ ok: false, error: 'צריך לפחות 2 שחקנים' });

    room.game = createGame(room.players.map(p => p.id));
    cb?.({ ok: true });
    broadcastRoom(room);
  }));

  socket.on('chat_message', safe(({ text }) => {
    const { roomId, playerId } = socket.data || {};
    const room = rooms[roomId];
    if (!room || !text?.trim()) return;
    const name = room.players.find(p => p.id === playerId)?.name || '?';
    io.to(roomId).emit('chat_message', { name, text: text.trim(), time: Date.now() });
  }));

  socket.on('game_action', safe((action, cb) => {
    const { roomId, playerId } = socket.data || {};
    const room = rooms[roomId];
    if (!room?.game) return cb?.({ ok: false, error: 'אין משחק פעיל' });

    let result;
    switch (action.type) {
      case 'respond_dragon':
        result = respondDragon(room.game, playerId, action);
        break;
      case 'respond_wand':
        result = respondWand(room.game, playerId, action);
        break;
      case 'jester_queen':
        result = respondJesterQueen(room.game, playerId, action);
        break;
      case 'rose_bonus':
        result = playRoseBonus(room.game, playerId, action);
        break;
      default:
        result = playAction(room.game, playerId, action);
    }

    cb?.(result);
    broadcastRoom(room);
  }));

  socket.on('rejoin_room', safe(({ roomId, playerId }, cb) => {
    if (disconnectTimers[playerId]) {
      clearTimeout(disconnectTimers[playerId]);
      delete disconnectTimers[playerId];
    }
    const room = rooms[roomId];
    if (!room) return cb?.({ ok: false, error: 'חדר לא קיים' });
    const player = room.players.find(p => p.id === playerId);
    if (!player) return cb?.({ ok: false, error: 'שחקן לא נמצא' });

    player.socketId = socket.id;
    socket.join(roomId);
    socket.data = { roomId, playerId };
    cb?.({ ok: true, isHost: room.host === playerId });

    if (room.game) {
      socket.emit('game_state', getRoomView(room, playerId));
    } else {
      io.to(roomId).emit('room_update', {
        roomId,
        players: room.players.map(p => ({ id: p.id, name: p.name })),
        host: room.host,
      });
    }
  }));

  socket.on('disconnect', safe(() => {
    const { roomId, playerId } = socket.data || {};
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];

    disconnectTimers[playerId] = setTimeout(() => {
      delete disconnectTimers[playerId];
      if (!rooms[roomId]) return;

      const playerName = room.players.find(p => p.id === playerId)?.name || playerId;
      room.players = room.players.filter(p => p.id !== playerId);

      if (room.players.length === 0) {
        delete rooms[roomId];
        return;
      }

      if (room.host === playerId) room.host = room.players[0].id;

      if (room.game) {
        // Remove from active game and unblock any stuck phase
        removePlayerFromGame(room.game, playerId, playerName);
        if (room.game.playerOrder.length < 2) {
          // Only one player left — they win
          room.game.winner = room.game.playerOrder[0];
          room.game.log.push(`${playerName} עזב את המשחק - ${room.players[0].name} ניצח!`);
        }
        broadcastRoom(room);
      } else {
        io.to(roomId).emit('room_update', {
          roomId,
          players: room.players.map(p => ({ id: p.id, name: p.name })),
          host: room.host,
        });
      }
    }, 5 * 60 * 1000); // 5 minutes grace — covers phone screen-off
  }));
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
