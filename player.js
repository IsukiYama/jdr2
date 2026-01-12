// Vérifier l'authentification
const currentUser = JSON.parse(sessionStorage.getItem('jdr_current_user'));
const currentParty = sessionStorage.getItem('jdr_current_party');
if (!currentUser || currentUser.role !== 'player' || !currentParty) {
    window.location.href = 'index.html';
}

// Canal de diffusion pour les mises à jour en temps réel
const broadcastChannel = new BroadcastChannel(`jdr_party_${currentParty}`);

// Écouter les mises à jour
broadcastChannel.onmessage = (event) => {
    if (event.data.type === 'gameStateUpdate') {
        // Mettre à jour l'état local
        localStorage.setItem(`jdr_game_state_${currentParty}`, JSON.stringify(event.data.data));
        // Charger l'image de fond si changée
        if (event.data.data.bgImage && event.data.data.bgImage !== (bgImage ? bgImage.src : null)) {
            bgImage = new Image();
            bgImage.onload = () => drawGrid();
            bgImage.src = event.data.data.bgImage;
        } else {
            drawGrid();
        }
    }
};

// Fonction de déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        sessionStorage.removeItem('jdr_current_user');
        window.location.href = 'index.html';
    }
}

// Configuration du canvas
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
let bgImage = null;
let gridSize = 50;

// Dessiner la grille et les tokens
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'image de fond
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }
    
    // Récupérer la taille de grille
    const gameState = JSON.parse(localStorage.getItem(`jdr_game_state_${currentParty}`) || '{}');
    gridSize = gameState.gridSize || 50;
    
    // Dessiner la grille
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Dessiner tous les tokens
    const tokens = gameState.tokens || [];
    
    tokens.forEach(token => {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, token.x, token.y, gridSize, gridSize);
            // Dessiner le nom
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.font = '12px Arial';
            ctx.strokeText(token.name, token.x + 5, token.y + gridSize - 5);
            ctx.fillText(token.name, token.x + 5, token.y + gridSize - 5);
        };
        img.src = token.avatar;
    });
}

// Fonction pour actualiser la carte
function refreshMap() {
    drawGrid();
}