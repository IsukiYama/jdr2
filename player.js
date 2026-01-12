// Vérifier l'authentification
const currentUser = JSON.parse(sessionStorage.getItem('jdr_current_user'));
const currentParty = sessionStorage.getItem('jdr_current_party');
if (!currentUser || !currentParty) {
    window.location.href = 'index.html';
}

if (currentUser.role !== 'player') {
    window.location.href = 'gm.html';
}

// Afficher les informations de l'utilisateur
document.getElementById('username-display').textContent = `🎭 ${currentUser.username}`;
document.getElementById('party-display').textContent = currentParty;

// Canal de diffusion pour les mises à jour en temps réel
const broadcastChannel = new BroadcastChannel(`jdr_party_${currentParty}`);
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

let bgImage = null;
let gridSize = 50;

// Redimensionner le canvas
function resizeCanvas() {
    setTimeout(() => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawGrid();
    }, 100);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    resizeCanvas();
    loadGameState();
});

// Charger l'état du jeu
function loadGameState() {
    const gameState = JSON.parse(localStorage.getItem(`jdr_game_state_${currentParty}`) || '{}');

    // Charger l'image de fond
    if (gameState.bgImage) {
        bgImage = new Image();
        bgImage.onload = () => drawGrid();
        bgImage.src = gameState.bgImage;
    }

    // Charger la taille de grille
    gridSize = Math.max(10, gameState.gridSize || 50);

    drawGrid();
}

// Écouter les mises à jour du GM
broadcastChannel.onmessage = (event) => {
    if (event.data.type === 'gameStateUpdate') {
        const gameState = event.data.data;

        // Mettre à jour l'image de fond
        if (gameState.bgImage !== (bgImage ? bgImage.src : null)) {
            if (gameState.bgImage) {
                bgImage = new Image();
                bgImage.onload = () => drawGrid();
                bgImage.src = gameState.bgImage;
            } else {
                bgImage = null;
                drawGrid();
            }
        }

        // Mettre à jour la taille de grille
        if (gameState.gridSize !== gridSize) {
            gridSize = Math.max(10, gameState.gridSize || 50);
            drawGrid();
        }

        // Redessiner pour les tokens
        drawGrid();
    }
};

// Dessiner la grille et les tokens
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fond
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#4a3a2a');
        gradient.addColorStop(1, '#3a2a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Grille
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.lineWidth = 1;

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
    const gameState = JSON.parse(localStorage.getItem(`jdr_game_state_${currentParty}`) || '{}');
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

// Fonction de déconnexion
function logout() {
    sessionStorage.removeItem('jdr_current_user');
    sessionStorage.removeItem('jdr_current_party');
    window.location.href = 'index.html';
}