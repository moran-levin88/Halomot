// ==================== QUEENS ====================
const QUEENS = [
  { id: 'rose',        name: 'מלכת הוורדים',    points: 5,  special: 'rose' },
  { id: 'cat',         name: 'מלכת החתולים',    points: 15, special: 'cat' },
  { id: 'dog',         name: 'מלכת הכלבלבים',   points: 15, special: 'dog' },
  { id: 'pancake',     name: 'מלכת החביתיות',   points: 15 },
  { id: 'moon',        name: 'מלכת הירח',       points: 10 },
  { id: 'butterfly',   name: 'מלכת הפרפרים',    points: 10 },
  { id: 'sunflower',   name: 'מלכת החמניות',    points: 10 },
  { id: 'heart',       name: 'מלכת הלבבות',     points: 20 },
  { id: 'rainbow',     name: 'מלכת הקשת',       points: 5  },
  { id: 'cake',        name: 'מלכת העוגות',      points: 5  },
  { id: 'icecream',    name: 'מלכת הגלידה',     points: 5  },
  { id: 'starfish',    name: 'מלכת כוכבי הים',  points: 5  },
  { id: 'strawberry',  name: 'מלכת התותים',     points: 10, special: 'strawberry' },
  { id: 'peacock',     name: 'מלכת הטווס',      points: 10 },
  { id: 'books',       name: 'מלכת הספרים',     points: 15 },
  { id: 'ladybug',     name: 'מלכת החיפושיות',  points: 10 },
];

// ==================== DECK CREATION ====================
function createDeck() {
  const deck = [];
  // 10 kings (each unique)
  const kings = [
    { id: 'king_puzzles',  type: 'king', name: 'מלך הפאזלים' },
    { id: 'king_beatnik',  type: 'king', name: 'מלך הבטיק' },
    { id: 'king_magic',    type: 'king', name: 'מלך הכובעים' },
    { id: 'king_tools',    type: 'king', name: 'מלך כלי העבודה' },
    { id: 'king_nature',   type: 'king', name: 'מלך העוגיות' },
    { id: 'king_fire',     type: 'king', name: 'מלך האש' },
    { id: 'king_turtles',  type: 'king', name: 'מלך הצבים' },
    { id: 'king_gum',      type: 'king', name: 'מלך המסטיק' },
    { id: 'king_pasta',    type: 'king', name: 'מלך הפסטה' },
    { id: 'king_chess',    type: 'king', name: 'מלך השחמט' },
  ];
  for (const k of kings) deck.push(k);
  // 5 jesters
  for (let i = 0; i < 5; i++) deck.push({ id: `jester_${i}`, type: 'jester' });
  // 4 knights
  for (let i = 0; i < 4; i++) deck.push({ id: `knight_${i}`, type: 'knight' });
  // 4 sleeping potions
  for (let i = 0; i < 4; i++) deck.push({ id: `potion_${i}`, type: 'potion' });
  // 3 wands
  for (let i = 0; i < 3; i++) deck.push({ id: `wand_${i}`, type: 'wand' });
  // 3 dragons
  for (let i = 0; i < 3; i++) deck.push({ id: `dragon_${i}`, type: 'dragon' });
  // 4 of each number 1-10
  for (let n = 1; n <= 10; n++) {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `num_${n}_${i}`, type: 'number', value: n });
    }
  }
  return shuffle(deck);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ==================== GAME STATE ====================
function createGame(playerIds) {
  const deck = createDeck();
  const queens = shuffle([...QUEENS]);

  const players = {};
  for (const id of playerIds) {
    players[id] = { hand: deck.splice(0, 5), awakeQueens: [] };
  }

  return {
    players,
    drawPile: deck,
    discardPile: [],
    sleepingQueens: queens, // array, index = position on table
    currentPlayerIndex: 0,
    playerOrder: playerIds,
    phase: 'play', // 'play' | 'waiting_dragon' | 'waiting_wand'
    pendingAction: null, // { type, fromPlayer, toPlayer, card, queenId }
    winner: null,
    log: [],
  };
}

// ==================== HELPERS ====================
function currentPlayer(game) {
  return game.playerOrder[game.currentPlayerIndex];
}

function nextTurn(game) {
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerOrder.length;
  game.phase = 'play';
  game.pendingAction = null;
}

function drawCards(game, playerId, count) {
  for (let i = 0; i < count; i++) {
    if (game.drawPile.length === 0) {
      game.drawPile = shuffle(game.discardPile);
      game.discardPile = [];
    }
    if (game.drawPile.length > 0) {
      game.players[playerId].hand.push(game.drawPile.shift());
    }
  }
}

function fillHand(game, playerId) {
  const deficit = 5 - game.players[playerId].hand.length;
  if (deficit > 0) drawCards(game, playerId, deficit);
}

function removeCardFromHand(game, playerId, cardId) {
  const hand = game.players[playerId].hand;
  const idx = hand.findIndex(c => c.id === cardId);
  if (idx === -1) return null;
  return hand.splice(idx, 1)[0];
}

function wakeQueen(game, playerId, queenIndex) {
  const queen = game.sleepingQueens[queenIndex];
  if (!queen) return null;
  game.sleepingQueens[queenIndex] = null;
  game.players[playerId].awakeQueens.push(queen);
  return queen;
}

function putQueenToSleep(game, fromPlayerId, queenId) {
  const hand = game.players[fromPlayerId].awakeQueens;
  const idx = hand.findIndex(q => q.id === queenId);
  if (idx === -1) return false;
  const [queen] = hand.splice(idx, 1);
  // find first null slot or push to end
  const slot = game.sleepingQueens.findIndex(q => q === null);
  if (slot !== -1) game.sleepingQueens[slot] = queen;
  else game.sleepingQueens.push(queen);
  return true;
}

function stealQueen(game, fromPlayerId, toPlayerId, queenId) {
  const fromHand = game.players[fromPlayerId].awakeQueens;
  const idx = fromHand.findIndex(q => q.id === queenId);
  if (idx === -1) return false;
  const [queen] = fromHand.splice(idx, 1);
  game.players[toPlayerId].awakeQueens.push(queen);
  return true;
}

function hasCatDogConflict(existingQueens, newQueen) {
  if (!newQueen) return false;
  return (
    (newQueen.special === 'cat' && existingQueens.some(q => q.special === 'dog')) ||
    (newQueen.special === 'dog' && existingQueens.some(q => q.special === 'cat'))
  );
}

function checkWin(game, playerId) {
  const n = game.playerOrder.length;
  const needQueens = n <= 3 ? 5 : 4;
  const needPoints = n <= 3 ? 50 : 40;
  const queens = game.players[playerId].awakeQueens;
  const points = queens.reduce((s, q) => s + q.points, 0);
  if (queens.length >= needQueens || points >= needPoints) return true;
  // all queens awake?
  if (game.sleepingQueens.every(q => q === null)) return true;
  return false;
}

function getWinnerIfAllAwake(game) {
  if (!game.sleepingQueens.every(q => q === null)) return null;
  let best = null, bestPts = -1;
  for (const pid of game.playerOrder) {
    const pts = game.players[pid].awakeQueens.reduce((s, q) => s + q.points, 0);
    if (pts > bestPts) { bestPts = pts; best = pid; }
  }
  return best;
}

// ==================== ACTIONS ====================
function playAction(game, playerId, action) {
  if (game.winner) return { ok: false, error: 'המשחק נגמר' };
  if (game.phase !== 'play') return { ok: false, error: 'ממתין לתגובה' };
  if (currentPlayer(game) !== playerId) return { ok: false, error: 'לא התור שלך' };

  switch (action.type) {
    case 'play_king': return playKing(game, playerId, action);
    case 'play_knight': return playKnight(game, playerId, action);
    case 'play_potion': return playPotion(game, playerId, action);
    case 'play_jester': return playJester(game, playerId, action);
    case 'discard': return playDiscard(game, playerId, action);
    default: return { ok: false, error: 'פעולה לא מוכרת' };
  }
}

function playKing(game, playerId, action) {
  const card = removeCardFromHand(game, playerId, action.cardId);
  if (!card || card.type !== 'king') return { ok: false, error: 'קלף לא תקין' };
  if (action.queenIndex === undefined || game.sleepingQueens[action.queenIndex] === null)
    return { ok: false, error: 'מלכה לא נמצאת' };

  game.discardPile.push(card);
  const pendingQueen = game.sleepingQueens[action.queenIndex];
  if (hasCatDogConflict(game.players[playerId].awakeQueens, pendingQueen)) {
    game.log.push(`חתול וכלב לא יכולים יחד - ${pendingQueen.name} נשארת ישנה`);
    fillHand(game, playerId);
    nextTurn(game);
    return { ok: true, event: 'cat_dog_conflict' };
  }
  const queen = wakeQueen(game, playerId, action.queenIndex);
  game.log.push(`${playerId} העיר את ${queen.name}`);

  let extraQueenFromRose = false;
  if (queen.special === 'rose') {
    extraQueenFromRose = true;
    game.log.push('מלכת הוורדים - תבחר מלכה נוספת!');
    // client sends follow-up rose_bonus action
    game.phase = 'waiting_rose';
    game.pendingAction = { type: 'rose', playerId };
    fillHand(game, playerId);
    return { ok: true, event: 'rose_bonus', queen };
  }

  fillHand(game, playerId);
  const win = checkWin(game, playerId);
  if (win) {
    game.winner = playerId;
    return { ok: true, event: 'win', winner: playerId };
  }
  nextTurn(game);
  return { ok: true, event: 'king', queen };
}

function playRoseBonus(game, playerId, action) {
  if (game.phase !== 'waiting_rose') return { ok: false, error: 'לא בהמתנה לוורד' };
  if (game.pendingAction?.playerId !== playerId) return { ok: false, error: 'לא התור שלך' };
  if (action.queenIndex === undefined || game.sleepingQueens[action.queenIndex] === null)
    return { ok: false, error: 'מלכה לא נמצאת' };

  const pendingQueen = game.sleepingQueens[action.queenIndex];
  if (hasCatDogConflict(game.players[playerId].awakeQueens, pendingQueen)) {
    game.log.push(`חתול וכלב לא יכולים יחד - ${pendingQueen.name} נשארת ישנה`);
    game.phase = 'play';
    game.pendingAction = null;
    nextTurn(game);
    return { ok: true, event: 'cat_dog_conflict' };
  }
  const queen = wakeQueen(game, playerId, action.queenIndex);
  game.log.push(`${playerId} העיר את ${queen.name} (בונוס ורד)`);
  game.phase = 'play';
  game.pendingAction = null;

  const win = checkWin(game, playerId);
  if (win) { game.winner = playerId; return { ok: true, event: 'win', winner: playerId }; }
  nextTurn(game);
  return { ok: true, event: 'rose_bonus_done', queen };
}

function playKnight(game, playerId, action) {
  const card = removeCardFromHand(game, playerId, action.cardId);
  if (!card || card.type !== 'knight') return { ok: false, error: 'קלף לא תקין' };
  if (!action.targetPlayerId || !action.queenId) return { ok: false, error: 'חסרים פרטים' };
  if (action.targetPlayerId === playerId) return { ok: false, error: 'לא יכול לגנוב מעצמך' };
  const targetQueens = game.players[action.targetPlayerId]?.awakeQueens;
  if (!targetQueens?.find(q => q.id === action.queenId)) return { ok: false, error: 'מלכה לא נמצאת' };

  game.discardPile.push(card);
  game.phase = 'waiting_dragon';
  game.pendingAction = {
    type: 'knight',
    fromPlayer: playerId,
    toPlayer: action.targetPlayerId,
    queenId: action.queenId,
  };
  game.log.push(`${playerId} שולח אביר לגנוב מלכה מ${action.targetPlayerId}`);
  return { ok: true, event: 'knight_pending', pendingAction: game.pendingAction };
}

function respondDragon(game, playerId, action) {
  if (game.phase !== 'waiting_dragon') return { ok: false, error: 'לא בהמתנה לדרקון' };
  if (game.pendingAction?.toPlayer !== playerId) return { ok: false, error: 'לא הצד הנכון' };

  if (action.use) {
    const card = removeCardFromHand(game, playerId, action.cardId);
    if (!card || card.type !== 'dragon') return { ok: false, error: 'קלף דרקון לא נמצא' };
    game.discardPile.push(card);
    drawCards(game, game.pendingAction.fromPlayer, 1);
    drawCards(game, playerId, 1);
    game.log.push(`${playerId} עצר את האביר עם דרקון`);
    // turn continues from left of knight player
    const knightIdx = game.playerOrder.indexOf(game.pendingAction.fromPlayer);
    game.currentPlayerIndex = (knightIdx + 1) % game.playerOrder.length;
    game.phase = 'play';
    game.pendingAction = null;
    return { ok: true, event: 'dragon_blocked' };
  } else {
    // no dragon - execute steal
    const { fromPlayer, toPlayer, queenId } = game.pendingAction;
    const queen = game.players[toPlayer].awakeQueens.find(q => q.id === queenId);
    // check cat/dog conflict
    if (queen) {
      const ownerQueens = game.players[fromPlayer].awakeQueens;
      if ((queen.special === 'cat' && ownerQueens.find(q => q.special === 'dog')) ||
          (queen.special === 'dog' && ownerQueens.find(q => q.special === 'cat'))) {
        // can't hold both - put stolen queen to sleep
        stealThenSleep(game, toPlayer, fromPlayer, queenId);
        game.log.push(`${fromPlayer} גנב מלכה אך חתול וכלב לא יכולים יחד - המלכה חזרה לישון`);
        fillHand(game, fromPlayer);
        nextTurn(game);
        return { ok: true, event: 'cat_dog_conflict' };
      }
    }
    stealQueen(game, toPlayer, fromPlayer, queenId);
    game.log.push(`${fromPlayer} גנב את מלכה מ${toPlayer}`);
    fillHand(game, fromPlayer);
    const win = checkWin(game, fromPlayer);
    if (win) { game.winner = fromPlayer; nextTurn(game); return { ok: true, event: 'win', winner: fromPlayer }; }
    nextTurn(game);
    return { ok: true, event: 'knight_success' };
  }
}

function stealThenSleep(game, fromPlayerId, toPlayerId, queenId) {
  const fromHand = game.players[fromPlayerId].awakeQueens;
  const idx = fromHand.findIndex(q => q.id === queenId);
  if (idx === -1) return;
  const [queen] = fromHand.splice(idx, 1);
  const slot = game.sleepingQueens.findIndex(q => q === null);
  if (slot !== -1) game.sleepingQueens[slot] = queen;
  else game.sleepingQueens.push(queen);
}

function playPotion(game, playerId, action) {
  const card = removeCardFromHand(game, playerId, action.cardId);
  if (!card || card.type !== 'potion') return { ok: false, error: 'קלף לא תקין' };
  if (!action.targetPlayerId || !action.queenId) return { ok: false, error: 'חסרים פרטים' };
  if (action.targetPlayerId === playerId) return { ok: false, error: 'לא יכול להרדים מלכה שלך' };
  const targetQueen = game.players[action.targetPlayerId]?.awakeQueens.find(q => q.id === action.queenId);
  if (targetQueen?.special === 'strawberry') {
    // return card to hand - action is invalid
    game.players[playerId].hand.push(card);
    return { ok: false, error: 'לא ניתן להרדים את מלכת התותים!' };
  }

  game.discardPile.push(card);
  game.phase = 'waiting_wand';
  game.pendingAction = {
    type: 'potion',
    fromPlayer: playerId,
    toPlayer: action.targetPlayerId,
    queenId: action.queenId,
  };
  game.log.push(`${playerId} מנסה להרדים מלכה של ${action.targetPlayerId}`);
  return { ok: true, event: 'potion_pending', pendingAction: game.pendingAction };
}

function respondWand(game, playerId, action) {
  if (game.phase !== 'waiting_wand') return { ok: false, error: 'לא בהמתנה לשרביט' };
  if (game.pendingAction?.toPlayer !== playerId) return { ok: false, error: 'לא הצד הנכון' };

  if (action.use) {
    const card = removeCardFromHand(game, playerId, action.cardId);
    if (!card || card.type !== 'wand') return { ok: false, error: 'שרביט לא נמצא' };
    game.discardPile.push(card);
    drawCards(game, game.pendingAction.fromPlayer, 1);
    drawCards(game, playerId, 1);
    game.log.push(`${playerId} הגן עם שרביט`);
    const potionIdx = game.playerOrder.indexOf(game.pendingAction.fromPlayer);
    game.currentPlayerIndex = (potionIdx + 1) % game.playerOrder.length;
    game.phase = 'play';
    game.pendingAction = null;
    return { ok: true, event: 'wand_blocked' };
  } else {
    const { fromPlayer, toPlayer, queenId } = game.pendingAction;
    putQueenToSleep(game, toPlayer, queenId);
    game.log.push(`מלכה של ${toPlayer} הורדמה`);
    fillHand(game, fromPlayer);
    nextTurn(game);
    return { ok: true, event: 'potion_success' };
  }
}

function playJester(game, playerId, action) {
  const card = removeCardFromHand(game, playerId, action.cardId);
  if (!card || card.type !== 'jester') return { ok: false, error: 'קלף לא תקין' };
  game.discardPile.push(card);

  if (game.drawPile.length === 0) {
    game.drawPile = shuffle(game.discardPile);
    game.discardPile = [];
  }
  const flipped = game.drawPile.shift();
  game.log.push(`${playerId} שיחק ליצן - נחשף: ${flipped.type}${flipped.value ? ' ' + flipped.value : ''}`);

  const powerTypes = ['king', 'knight', 'dragon', 'potion', 'wand', 'jester'];
  if (powerTypes.includes(flipped.type)) {
    // Special card: player keeps it, turn passes to next player
    game.players[playerId].hand.push(flipped);
    fillHand(game, playerId);
    nextTurn(game);
    return { ok: true, event: 'jester_power', card: flipped };
  } else {
    // number card: count left to find who wakes a queen
    const num = flipped.value;
    game.discardPile.push(flipped);
    const startIdx = game.playerOrder.indexOf(playerId);
    const targetIdx = (startIdx + num - 1) % game.playerOrder.length;
    const targetPlayer = game.playerOrder[targetIdx];
    // target can wake a queen - send event, wait for response
    game.phase = 'waiting_jester_queen';
    game.pendingAction = { type: 'jester', fromPlayer: playerId, toPlayer: targetPlayer, number: num };
    fillHand(game, playerId);
    return { ok: true, event: 'jester_number', number: num, targetPlayer };
  }
}

function respondJesterQueen(game, playerId, action) {
  if (game.phase !== 'waiting_jester_queen') return { ok: false, error: 'לא בהמתנה לליצן' };
  if (game.pendingAction?.toPlayer !== playerId) return { ok: false, error: 'לא הצד הנכון' };
  if (action.queenIndex === undefined || game.sleepingQueens[action.queenIndex] === null)
    return { ok: false, error: 'מלכה לא נמצאת' };

  const pendingQueen = game.sleepingQueens[action.queenIndex];
  if (hasCatDogConflict(game.players[playerId].awakeQueens, pendingQueen)) {
    game.log.push(`חתול וכלב לא יכולים יחד - ${pendingQueen.name} נשארת ישנה`);
    game.phase = 'play';
    game.pendingAction = null;
    nextTurn(game);
    return { ok: true, event: 'cat_dog_conflict' };
  }
  const queen = wakeQueen(game, playerId, action.queenIndex);
  game.log.push(`${playerId} זכה להעיר מלכה מהליצן: ${queen.name}`);
  game.phase = 'play';
  game.pendingAction = null;

  if (queen.special === 'rose') {
    game.phase = 'waiting_rose';
    game.pendingAction = { type: 'rose', playerId };
    return { ok: true, event: 'rose_bonus', queen };
  }

  const win = checkWin(game, playerId);
  if (win) { game.winner = playerId; return { ok: true, event: 'win', winner: playerId }; }
  nextTurn(game);
  return { ok: true, event: 'jester_queen_done', queen };
}

function playDiscard(game, playerId, action) {
  // action.cardIds: array of card IDs to discard
  const { cardIds } = action;
  if (!cardIds || cardIds.length === 0) return { ok: false, error: 'חסרים קלפים' };

  const hand = game.players[playerId].hand;
  const cards = cardIds.map(id => hand.find(c => c.id === id)).filter(Boolean);
  if (cards.length !== cardIds.length) return { ok: false, error: 'קלפים לא נמצאו' };

  const numberCards = cards.filter(c => c.type === 'number');
  const otherCards = cards.filter(c => c.type !== 'number');

  if (cards.length === 1) {
    // single card of any type
  } else if (cards.length === 2 && numberCards.length === 2 && numberCards[0].value === numberCards[1].value) {
    // pair
  } else if (numberCards.length >= 3 && otherCards.length === 0) {
    // must form addition equation
    const nums = numberCards.map(c => c.value).sort((a, b) => a - b);
    const sum = nums.slice(0, -1).reduce((a, b) => a + b, 0);
    if (sum !== nums[nums.length - 1]) return { ok: false, error: 'התרגיל לא נכון' };
  } else {
    return { ok: false, error: 'שילוב לא חוקי' };
  }

  // remove from hand
  for (const card of cards) {
    const idx = hand.findIndex(c => c.id === card.id);
    hand.splice(idx, 1);
    game.discardPile.push(card);
  }

  fillHand(game, playerId);
  nextTurn(game);
  return { ok: true, event: 'discard', count: cards.length };
}

// ==================== REMOVE PLAYER ====================
function removePlayerFromGame(game, playerId, playerName) {
  if (!game.players[playerId]) return;

  // Put their awake queens back to sleep
  for (const queen of game.players[playerId].awakeQueens) {
    const slot = game.sleepingQueens.findIndex(q => q === null);
    if (slot !== -1) game.sleepingQueens[slot] = queen;
    else game.sleepingQueens.push(queen);
  }

  // Remove from playerOrder and players map
  game.playerOrder = game.playerOrder.filter(id => id !== playerId);
  delete game.players[playerId];
  game.log.push(`${playerName} עזב את המשחק`);

  if (game.playerOrder.length === 0) return;

  // Fix currentPlayerIndex if out of bounds
  if (game.currentPlayerIndex >= game.playerOrder.length) {
    game.currentPlayerIndex = 0;
  }

  // Resolve stuck pending phases involving the leaving player
  const pa = game.pendingAction;
  if (!pa) return;

  if (pa.fromPlayer === playerId || pa.toPlayer === playerId) {
    // Unblock: if the leaving player was the attacker, just cancel
    // If they were the defender, attacker's action succeeds automatically
    if (game.phase === 'waiting_dragon' || game.phase === 'waiting_wand') {
      if (pa.toPlayer === playerId) {
        // Defender left — execute the attack
        if (game.phase === 'waiting_dragon') {
          stealQueen(game, pa.toPlayer, pa.fromPlayer, pa.queenId);
          game.log.push(`${pa.queenId} נגנבה כי הסולחן עזב`);
        } else {
          // waiting_wand — queen goes to sleep but defender already gone, just clear
        }
      }
      // Either way, clear and move on
      const attackerStillIn = game.playerOrder.includes(pa.fromPlayer);
      if (attackerStillIn) {
        const idx = game.playerOrder.indexOf(pa.fromPlayer);
        game.currentPlayerIndex = (idx + 1) % game.playerOrder.length;
      }
    } else if (game.phase === 'waiting_jester_queen' || game.phase === 'waiting_rose') {
      // Just skip
    }
    game.phase = 'play';
    game.pendingAction = null;
  }
}

// ==================== EXPORTS ====================
module.exports = {
  createGame,
  currentPlayer,
  playAction,
  respondDragon,
  respondWand,
  respondJesterQueen,
  playRoseBonus,
  getWinnerIfAllAwake,
  removePlayerFromGame,
};
