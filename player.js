// Vérifier l'authentification
const currentUser = JSON.parse(sessionStorage.getItem('jdr_current_user'));
const currentParty = sessionStorage.getItem('jdr_current_party');
if (!currentUser || currentUser.role !== 'player' || !currentParty) {
    window.location.href = 'index.html';
}

// Afficher les informations du joueur
document.getElementById('username-display').textContent = `🗡️ ${currentUser.username} (Joueur)`;
document.getElementById('player-avatar').innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" style="max-width: 100px;">`;

// Fonction de déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        sessionStorage.removeItem('jdr_current_user');
        window.location.href = 'index.html';
    }
}

// Fonction pour actualiser la carte
function refreshMap() {
    // TODO: Implémenter l'actualisation de la carte
    alert('Actualisation de la carte (non implémentée)');
}