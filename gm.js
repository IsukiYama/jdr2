// Vérifier l'authentification
const currentUser = JSON.parse(sessionStorage.getItem('jdr_current_user'));
const currentParty = sessionStorage.getItem('jdr_current_party');

if (!currentUser || !currentParty) {
    window.location.href = 'index.html';
}

// Afficher les informations du GM
document.getElementById('username-display').textContent = `🎭 ${currentUser.username}`;

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

// Fonction pour récupérer l'avatar depuis IndexedDB
function getAvatarFromIDB(party, username) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(`jdr_avatars_${party}`, 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('avatars')) {
                resolve(null);
                return;
            }
            const transaction = db.transaction(['avatars'], 'readonly');
            const store = transaction.objectStore('avatars');
            const getRequest = store.get(username);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// Initialiser ou charger l'état du jeu (par partie)
function initGameState() {
    const stateKey = `jdr_game_state_${currentParty}`;
    let gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    
    if (!gameState.tokens) {
        gameState.tokens = [];
    }
    if (!gameState.bgImage) {
        gameState.bgImage = null;
    }
    if (!gameState.gridSize) {
        gameState.gridSize = 50;
    }
    
    localStorage.setItem(stateKey, JSON.stringify(gameState));
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
    const stateKey = `jdr_game_state_${currentParty}`;
    const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    localStorage.setItem(stateKey, JSON.stringify(gameState));
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
    const stateKey = `jdr_game_state_${currentParty}`;
    const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
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
                const stateKey = `jdr_game_state_${currentParty}`;
                const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
                gameState.bgImage = event.target.result;
                localStorage.setItem(stateKey, JSON.stringify(gameState));
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
async function loadPlayers() {
    const usersKey = `jdr_users_${currentParty}`;
    const users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    const players = users.filter(u => u.role === 'player');
    
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    
    if (players.length === 0) {
        playerList.innerHTML = '<p style="color: #d4af37; font-size: 0.9em; text-align: center;">Aucun joueur inscrit</p>';
        return;
    }
    
    for (const player of players) {
        const avatar = await getAvatarFromIDB(currentParty, player.username);
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `
            <img src="${avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}" alt="${player.username}">
            <span>${player.username}</span>
        `;
        playerList.appendChild(div);
    }
}

// Ajouter les joueurs à la carte
async function addPlayersToMap() {
    const usersKey = `jdr_users_${currentParty}`;
    const users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    const players = users.filter(u => u.role === 'player');
    
    const stateKey = `jdr_game_state_${currentParty}`;
    const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    let tokens = gameState.tokens || [];
    
    // Retirer les anciens tokens de joueurs
    tokens = tokens.filter(t => t.type !== 'player');
    
    // Ajouter les joueurs avec leurs avatars depuis IndexedDB
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const avatar = await getAvatarFromIDB(currentParty, player.username);
        
        if (avatar) {
            const x = 50 + (i * gridSize * 2);
            const y = 50;
            
            tokens.push({
                username: player.username,
                avatar: avatar,
                x: x,
                y: y,
                width: gridSize,
                height: gridSize,
                type: 'player'
            });
        }
    }
    
    gameState.tokens = tokens;
    localStorage.setItem(stateKey, JSON.stringify(gameState));
    drawGrid();
    
    alert(`${players.length} joueur(s) ajouté(s) à la carte!`);
}

// Ajouter mon personnage
async function addMyCharacter() {
    const avatar = await getAvatarFromIDB(currentParty, currentUser.username);
    
    if (!avatar) {
        alert('Avatar non trouvé. Veuillez vous reconnecter.');
        return;
    }
    
    const stateKey = `jdr_game_state_${currentParty}`;
    const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    let tokens = gameState.tokens || [];
    
    // Vérifier si le personnage est déjà sur la carte
    const existing = tokens.find(t => t.username === currentUser.username && t.type === 'player');
    if (existing) {
        alert('Votre personnage est déjà sur la carte!');
        return;
    }
    
    // Ajouter le personnage
    tokens.push({
        username: currentUser.username,
        avatar: avatar,
        x: 50,
        y: 50,
        width: gridSize,
        height: gridSize,
        type: 'player'
    });
    
    gameState.tokens = tokens;
    localStorage.setItem(stateKey, JSON.stringify(gameState));
    drawGrid();
    
    alert('Votre personnage a été ajouté à la carte!');
}

// Fonction pour réinitialiser les joueurs
function resetPlayers() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les joueurs de la partie ?')) {
        const usersKey = `jdr_users_${currentParty}`;
        localStorage.removeItem(usersKey);
        
        // Retirer aussi les tokens joueurs de la carte
        const stateKey = `jdr_game_state_${currentParty}`;
        const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
        gameState.tokens = (gameState.tokens || []).filter(t => t.type !== 'player');
        localStorage.setItem(stateKey, JSON.stringify(gameState));
        
        loadPlayers();
        drawGrid();
        alert('Tous les joueurs ont été réinitialisés!');
    }
}

// Gestion du drag and drop
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clic droit pour supprimer
    if (e.button === 2) {
        const stateKey = `jdr_game_state_${currentParty}`;
        const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
        let tokens = gameState.tokens || [];
        
        tokens = tokens.filter(token => {
            return !(x >= token.x && x <= token.x + token.width &&
                   y >= token.y && y <= token.y + token.height);
        });
        
        gameState.tokens = tokens;
        localStorage.setItem(stateKey, JSON.stringify(gameState));
        drawGrid();
        return;
    }

    // Sélectionner un token existant
    const stateKey = `jdr_game_state_${currentParty}`;
    const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
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

        const stateKey = `jdr_game_state_${currentParty}`;
        const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
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
        localStorage.setItem(stateKey, JSON.stringify(gameState));
        
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
    const stateKey = `jdr_game_state_${currentParty}`;
    const gameState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    gameState.gridSize = gridSize;
    localStorage.setItem(stateKey, JSON.stringify(gameState));
    drawGrid();
});

// Réinitialiser la carte
function clearMap() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toute la carte ?')) {
        const stateKey = `jdr_game_state_${currentParty}`;
        const gameState = {
            tokens: [],
            bgImage: null,
            gridSize: 50
        };
        localStorage.setItem(stateKey, JSON.stringify(gameState));
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
        sessionStorage.removeItem('jdr_current_party');
        window.location.href = 'index.html';
    }
}

// Auto-actualisation pour voir les changements en temps réel
setInterval(() => {
    loadPlayers();
    drawGrid();
}, 2000);

// Initialisation
loadGameState();
loadPlayers();