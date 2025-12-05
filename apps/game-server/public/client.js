const socket = io();

// State
let currentPlayerId = null;
let currentRoomId = null;
let roomState = null;      // NEW: Separate room state
let gameState = null;      // Game state (only when game is active)
let myHand = [];
let pendingWildCardIndex = null;
let hasDrawnThisTurn = false;
let previousPlayerIndex = -1;

// DOM Elements
const lobby = document.getElementById('lobby');
const waitingRoom = document.getElementById('waitingRoom');
const gameScreen = document.getElementById('gameScreen');
const colorPicker = document.getElementById('colorPicker');

const playerNameInput = document.getElementById('playerName');
const roomIdInput = document.getElementById('roomId');
const joinBtn = document.getElementById('joinBtn');
const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
const roomListDiv = document.getElementById('roomList');

const currentRoomIdSpan = document.getElementById('currentRoomId');
const gameRoomIdSpan = document.getElementById('gameRoomId');
const playersList = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');

const otherPlayers = document.getElementById('otherPlayers');
const yourHand = document.getElementById('yourHand');
const topCard = document.getElementById('topCard');
const currentColorSpan = document.getElementById('currentColor');
const deckSizeSpan = document.getElementById('deckSize');
const drawPile = document.getElementById('drawPile');
const unoBtn = document.getElementById('unoBtn');
const messagesDiv = document.getElementById('messages');

// Event Listeners
joinBtn.addEventListener('click', joinRoom);
startGameBtn.addEventListener('click', startGame);
leaveRoomBtn.addEventListener('click', leaveRoom);
drawPile.addEventListener('click', drawCard);
unoBtn.addEventListener('click', callUno);
refreshRoomsBtn.addEventListener('click', refreshRoomList);

// Allow Enter key to join
playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinRoom();
});
roomIdInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinRoom();
});

// Functions
function joinRoom() {
  const playerName = playerNameInput.value.trim();
  const roomId = roomIdInput.value.trim();

  if (!playerName) {
    showMessage('Please enter your name', 'error');
    return;
  }

  if (!roomId) {
    showMessage('Please enter a room ID', 'error');
    return;
  }

  socket.emit('command:common:room:join', { roomId, playerName });
}

function startGame() {
  socket.emit('command:uno:game:start');
}

function leaveRoom() {
  window.location.reload();
}

function refreshRoomList() {
  socket.emit('query:common:room:list');
}

function joinRoomFromList(roomId) {
  const playerName = playerNameInput.value.trim();
  
  if (!playerName) {
    showMessage('Please enter your name first', 'error');
    playerNameInput.focus();
    return;
  }
  
  socket.emit('command:common:room:join', { roomId, playerName });
}

function renderRoomList(rooms) {
  if (!rooms || rooms.length === 0) {
    roomListDiv.innerHTML = '<p class="no-rooms">No active rooms. Create one by entering a Room ID above!</p>';
    return;
  }
  
  roomListDiv.innerHTML = rooms.map(room => `
    <div class="room-item ${room.hasActiveGame ? 'in-game' : 'lobby'}">
      <div class="room-item-info">
        <div class="room-item-name">${room.roomId}</div>
        <div class="room-item-status">
          ${room.playerCount} player${room.playerCount !== 1 ? 's' : ''}
          ${room.hasActiveGame ? '🎮 In Game' : '⏳ Waiting'}
        </div>
      </div>
      <button class="btn btn-join" onclick="window.joinRoomFromList('${room.roomId}')" 
              ${room.hasActiveGame ? 'disabled title="Game in progress"' : ''}>
        ${room.hasActiveGame ? 'In Progress' : 'Join'}
      </button>
    </div>
  `).join('');
}

// Make function available globally
window.joinRoomFromList = joinRoomFromList;

function drawCard() {
  socket.emit('command:uno:card:draw');
}

function playCard(cardIndex) {
  const card = myHand[cardIndex];
  
  if (card.type === 'wild') {
    // Show color picker
    pendingWildCardIndex = cardIndex;
    colorPicker.classList.add('active');
  } else {
    socket.emit('command:uno:card:play', { cardIndex });
  }
}

function callUno() {
  socket.emit('command:uno:uno:call');
}

function chooseColor(color) {
  colorPicker.classList.remove('active');
  if (pendingWildCardIndex !== null) {
    socket.emit('command:uno:card:play', { 
      cardIndex: pendingWildCardIndex, 
      chosenColor: color 
    });
    pendingWildCardIndex = null;
  }
}

// Color picker buttons
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chooseColor(btn.dataset.color);
  });
});

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function showMessage(text, type = 'info', duration = 3000) {
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  messagesDiv.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, duration);
}

function renderWaitingRoom() {
  currentRoomIdSpan.textContent = currentRoomId;
  
  // Use roomState for waiting room (lobby)
  if (roomState && roomState.players) {
    playersList.innerHTML = roomState.players.map(player => `
      <div class="player-item">
        ${player.name} ${player.id === currentPlayerId ? '(You)' : ''}
        ${player.disconnected ? ' (Disconnected)' : ''}
      </div>
    `).join('');
    
    // Show player count
    const playerCountText = document.createElement('p');
    playerCountText.style.textAlign = 'center';
    playerCountText.style.marginTop = '15px';
    playerCountText.style.color = '#666';
    playerCountText.textContent = `${roomState.playerCount} player${roomState.playerCount !== 1 ? 's' : ''} in room (2-10 needed to start)`;
    playersList.appendChild(playerCountText);
  }
}

function renderGame() {
  if (!gameState) return;

  gameRoomIdSpan.textContent = currentRoomId;
  deckSizeSpan.textContent = gameState.deckSize;

  // Render top card
  if (gameState.topCard) {
    topCard.className = 'card card-' + gameState.topCard.color;
    topCard.textContent = getCardDisplay(gameState.topCard);
  }

  // Show current color
  if (gameState.currentColor) {
    currentColorSpan.textContent = gameState.currentColor.toUpperCase();
    currentColorSpan.style.color = getColorHex(gameState.currentColor);
    currentColorSpan.style.fontWeight = 'bold';
  }

  // Render other players
  const otherPlayersList = gameState.players.filter(p => p.id !== currentPlayerId);
  otherPlayers.innerHTML = otherPlayersList.map((player, index) => {
    const isCurrentPlayer = gameState.players[gameState.currentPlayerIndex].id === player.id;
    return `
      <div class="other-player ${isCurrentPlayer ? 'active' : ''} ${player.disconnected ? 'disconnected' : ''}">
        <div class="player-name">${player.name}${player.disconnected ? ' (Disconnected)' : ''}</div>
        <div class="card-count">${player.cardCount} cards</div>
        ${player.calledUno ? '<div class="uno-indicator">UNO!</div>' : ''}
      </div>
    `;
  }).join('');

  // Render your hand
  renderHand();
}

function renderHand() {
  if (!gameState) return;
  
  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayerId;

  let handHTML = myHand.map((card, index) => {
    const canPlay = isMyTurn && canPlayCard(card);
    return `
      <div class="card card-${card.color} ${canPlay ? 'playable' : ''}" 
           onclick="window.playCardClick(${index})"
           data-index="${index}">
        ${getCardDisplay(card)}
      </div>
    `;
  }).join('');

  // Add pass turn button if player drew but can't play
  if (isMyTurn && hasDrawnThisTurn) {
    handHTML += `
      <div class="pass-turn-container">
        <button class="btn btn-pass" onclick="window.passTurn()">Pass Turn</button>
        <p class="pass-hint">You drew a card but can't play. Pass your turn.</p>
      </div>
    `;
  }

  yourHand.innerHTML = handHTML;
}

// Make functions available globally for onclick
window.playCardClick = function(index) {
  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === currentPlayerId;
  if (isMyTurn) {
    playCard(index);
  }
};

window.passTurn = function() {
  socket.emit('command:uno:turn:pass');
  hasDrawnThisTurn = false;
};

function canPlayCard(card) {
  if (!gameState || !gameState.topCard) return false;

  if (card.type === 'wild') return true;
  if (card.color === gameState.currentColor) return true;
  if (card.value === gameState.topCard.value) return true;

  return false;
}

function getCardDisplay(card) {
  if (card.value === 'wild') return 'WILD';
  if (card.value === 'wild4') return 'WILD +4';
  if (card.value === 'skip') return '⊘';
  if (card.value === 'reverse') return '⇄';
  if (card.value === 'draw2') return '+2';
  return card.value;
}

function getColorHex(color) {
  const colors = {
    red: '#ff5555',
    blue: '#5555ff',
    green: '#55ff55',
    yellow: '#ffff55'
  };
  return colors[color] || '#333';
}

// Socket Events
socket.on('event:common:room:joined', (data) => {
  currentRoomId = data.roomId;
  currentPlayerId = data.playerId;
  // Don't change screen here - wait for room state to determine if we show waiting room or game
  showMessage('Joined room successfully!', 'success');
});

// NEW: Handle room state (separate from game state)
socket.on('state:room', (state) => {
  roomState = state;
  
  // If no active game, show waiting room
  if (!state.hasActiveGame) {
    showScreen(waitingRoom);
    renderWaitingRoom();
  }
  // If game is active, wait for game state before showing game screen
});

socket.on('error:common:room', (data) => {
  showMessage(data.message, 'error');
});

socket.on('state:uno:game', (state) => {
  // Reset draw flag when turn changes
  if (gameState && gameState.currentPlayerIndex !== state.currentPlayerIndex) {
    hasDrawnThisTurn = false;
  }
  
  gameState = state;
  previousPlayerIndex = state.currentPlayerIndex;
  
  // Game state only exists when game is active
  showScreen(gameScreen);
  renderGame();
});

socket.on('state:uno:hand', (hand) => {
  myHand = hand;
  renderHand();
});

socket.on('event:uno:game:started', () => {
  hasDrawnThisTurn = false;
  showScreen(gameScreen);
  showMessage('Game started!', 'success');
});

socket.on('event:common:room:player-joined', (data) => {
  showMessage(`${data.playerName} joined the room`, 'info');
  renderWaitingRoom();
});

socket.on('event:common:room:player-reconnected', (data) => {
  showMessage(`${data.playerName} reconnected to the game`, 'success');
  renderGame();
});

socket.on('event:common:room:player-left', (data) => {
  showMessage('A player left the room', 'info');
  // Room state update will handle screen switching
  if (roomState && !roomState.hasActiveGame) {
    renderWaitingRoom();
  } else if (gameState) {
    renderGame();
  }
});

socket.on('event:uno:card:played', (data) => {
  hasDrawnThisTurn = false; // Reset when any card is played
  const playerName = gameState.players.find(p => p.id === data.playerId)?.name || 'Player';
  showMessage(`${playerName} played ${getCardDisplay(data.card)}`, 'info', 2000);
  renderGame();
});

socket.on('event:uno:card:drawn', (data) => {
  hasDrawnThisTurn = true;
  showMessage('You drew a card', 'info', 1500);
  renderHand(); // Re-render to show pass button
});

socket.on('event:uno:turn:passed', (data) => {
  hasDrawnThisTurn = false;
  const playerName = gameState.players.find(p => p.id === data.playerId)?.name || 'Player';
  showMessage(`${playerName} passed their turn`, 'info', 2000);
  renderGame();
});

socket.on('event:uno:uno:called', (data) => {
  const playerName = gameState.players.find(p => p.id === data.playerId)?.name || 'Player';
  showMessage(`${playerName} called UNO!`, 'info', 2000);
  renderGame();
});

socket.on('event:uno:game:ended', (data) => {
  showMessage(`🎉 ${data.winner} wins the game!`, 'success', 5000);
  // Room state update will automatically show waiting room
  // No need to manually switch screens - server sends updated room state
});

// Error handlers for specific namespaces
socket.on('error:uno:game', (data) => {
  showMessage(data.message, 'error');
});

socket.on('error:uno:card', (data) => {
  const action = data.action ? ` ${data.action}` : '';
  showMessage(`Card${action} error: ${data.message}`, 'error');
});

socket.on('error:uno:uno', (data) => {
  showMessage(data.message, 'error');
});

socket.on('connect', () => {
  console.log('Connected to server');
  // Request room list on connect
  refreshRoomList();
});

socket.on('state:common:rooms', (rooms) => {
  renderRoomList(rooms);
});

socket.on('disconnect', () => {
  showMessage('Disconnected from server', 'error');
});

