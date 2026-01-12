// Vérifier l'authentification
const currentUser = JSON.parse(sessionStorage.getItem('jdr_current_user'));
if (!currentUser || currentUser.role !== 'gm') {
    window.location.href = 'login.html';
}

// Afficher les informations du GM
document.getElementById('username-display').textContent = `🎭 ${currentUser.username} (GM)`;

// Configuration du canvas
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 650;

let bgImage = null;
let gridSize = 50;
let monsters = [];
let draggingToken = null;
let dragOffset = { x: 0, y: 0 };

// Initialiser ou charger l'état du jeu
function initGameState() {
    let gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
    
    if (!gameState.tokens) {
        gameState.tokens = [];
    }
    if (!gameState.bgImage) {
        gameState.bgImage = null;
    }
    if (!gameState.gridSize) {
        gameState.gridSize = 50;
    }
    
    localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
    return gameState;
}

// Charger l'état du jeu
function loadGameState() {
    const gameState = initGameState();
    
    // Charger l'image de fond
    if (gameState.bgImage) {
        bgImage = new Image();
        bgImage.onload = () => drawGrid();
        bgImage.src = gameState.bgImage;
    }
    
    // Charger la taille de grille
    gridSize = gameState.gridSize;
    document.getElementById('gridSize').value = gridSize;
    
    drawGrid();
}

// Sauvegarder l'état du jeu
function saveGameState() {
    const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
    localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
}

// Dessiner la grille et les tokens
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fond
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#3a2a1a');
        gradient.addColorStop(1, '#2a1a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Grille
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Dessiner tous les tokens
    const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
    const tokens = gameState.tokens || [];
    
    tokens.forEach(token => {
        const img = new Image();
        img.src = token.avatar;
        
        // Effet différent pour joueurs et monstres
        if (token.type === 'player') {
            ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
            ctx.shadowBlur = 15;
        }
        
        ctx.drawImage(img, token.x, token.y, token.width, token.height);
        ctx.shadowBlur = 0;
        
        // Nom
        ctx.fillStyle = token.type === 'player' ? '#00ff00' : '#ff6b6b';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(token.name || token.username, token.x + token.width / 2, token.y - 5);
    });
}

// Charger l'image de fond
document.getElementById('bgImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            bgImage = new Image();
            bgImage.onload = () => {
                const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
                gameState.bgImage = event.target.result;
                localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
                drawGrid();
            };
            bgImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Charger les monstres
document.getElementById('monsterImages').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                monsters.push({
                    img: img,
                    src: event.target.result,
                    name: file.name.replace('.png', '')
                });
                addMonsterToLibrary(img, event.target.result, file.name);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

// Ajouter un monstre à la bibliothèque
function addMonsterToLibrary(img, src, name) {
    const div = document.createElement('div');
    div.className = 'token-item';
    const imgEl = document.createElement('img');
    imgEl.src = src;
    imgEl.title = name;
    div.appendChild(imgEl);
    
    div.addEventListener('mousedown', (e) => {
        draggingToken = {
            avatar: src,
            width: gridSize,
            height: gridSize,
            type: 'monster',
            name: name.replace('.png', '')
        };
    });
    
    document.getElementById('monsterLibrary').appendChild(div);
}

// Charger et afficher les joueurs
function loadPlayers() {
    const users = JSON.parse(localStorage.getItem('jdr_users') || '[]');
    const players = users.filter(u => u.role === 'player');
    
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `
            <img src="${player.avatar}" alt="${player.username}">
            <span>${player.username}</span>
        `;
        playerList.appendChild(div);
    });
}

// Ajouter les joueurs à la carte
function addPlayersToMap() {
    const users = JSON.parse(localStorage.getItem('jdr_users') || '[]');
    const players = users.filter(u => u.role === 'player');
    
    const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
    let tokens = gameState.tokens || [];
    
    // Retirer les anciens tokens de joueurs
    tokens = tokens.filter(t => t.type !== 'player');
    
    // Ajouter les joueurs en ligne
    players.forEach((player, index) => {
        const x = 50 + (index * gridSize * 2);
        const y = 50;
        
        tokens.push({
            username: player.username,
            avatar: player.avatar,
            x: x,
            y: y,
            width: gridSize,
            height: gridSize,
            type: 'player'
        });
    });
    
    gameState.tokens = tokens;
    localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
    drawGrid();
    
    alert(`${players.length} joueur(s) ajouté(s) à la carte!`);
}

// Gestion du drag and drop
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clic droit pour supprimer
    if (e.button === 2) {
        const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
        let tokens = gameState.tokens || [];
        
        tokens = tokens.filter(token => {
            return !(x >= token.x && x <= token.x + token.width &&
                   y >= token.y && y <= token.y + token.height);
        });
        
        gameState.tokens = tokens;
        localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
        drawGrid();
        return;
    }

    // Sélectionner un token existant
    const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
    const tokens = gameState.tokens || [];
    
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        if (x >= token.x && x <= token.x + token.width &&
            y >= token.y && y <= token.y + token.height) {
            draggingToken = { ...token, index: i };
            dragOffset.x = x - token.x;
            dragOffset.y = y - token.y;
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (draggingToken) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;
        
        drawGrid();
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 20;
        
        const img = new Image();
        img.src = draggingToken.avatar;
        ctx.drawImage(img, x, y, draggingToken.width, draggingToken.height);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (draggingToken) {
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left - dragOffset.x;
        let y = e.clientY - rect.top - dragOffset.y;

        // Snap to grid
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;

        const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
        let tokens = gameState.tokens || [];
        
        // Si c'est un token existant, le mettre à jour
        if (draggingToken.index !== undefined) {
            tokens.splice(draggingToken.index, 1);
        }
        
        // Ajouter le token
        tokens.push({
            username: draggingToken.username,
            avatar: draggingToken.avatar,
            x: x,
            y: y,
            width: draggingToken.width,
            height: draggingToken.height,
            type: draggingToken.type,
            name: draggingToken.name
        });

        gameState.tokens = tokens;
        localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
        
        draggingToken = null;
        dragOffset = { x: 0, y: 0 };
        drawGrid();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Changer la taille de grille
document.getElementById('gridSize').addEventListener('change', (e) => {
    gridSize = parseInt(e.target.value);
    const gameState = JSON.parse(localStorage.getItem('jdr_game_state') || '{}');
    gameState.gridSize = gridSize;
    localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
    drawGrid();
});

// Réinitialiser la carte
function clearMap() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toute la carte ?')) {
        const gameState = {
            tokens: [],
            bgImage: null,
            gridSize: 50
        };
        localStorage.setItem('jdr_game_state', JSON.stringify(gameState));
        bgImage = null;
        gridSize = 50;
        document.getElementById('gridSize').value = 50;
        drawGrid();
    }
}

// Déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        sessionStorage.removeItem('jdr_current_user');
        window.location.href = 'login.html';
    }
}

// Initialisation
loadGameState();
loadPlayers();