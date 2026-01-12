

// Fonction de connexion
function handleLogin() {
    const party = document.getElementById('login-party').value.trim();
    const username = document.getElementById('login-username').value.trim();
    const role = document.getElementById('login-role').value;
    const avatarFile = document.getElementById('login-avatar').files[0];
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    if (!party || !username || !role || !avatarFile) {
        showError('login-error', 'Veuillez remplir tous les champs');
        return;
    }
    
    // Récupérer les utilisateurs de la partie
    const usersKey = `jdr_users_${party}`;
    let users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    
    // Lire l'avatar uploadé
    const reader = new FileReader();
    reader.onload = (event) => {
        const uploadedAvatar = event.target.result;
        let user = users.find(u => u.username === username && u.role === role);
        
        if (!user) {
            // Créer le personnage si non trouvé
            user = {
                username: username,
                role: role,
                avatar: uploadedAvatar,
                createdAt: new Date().toISOString()
            };
            users.push(user);
        } else {
            // Mettre à jour la figurine
            user.avatar = uploadedAvatar;
        }
        
        try {
            localStorage.setItem(usersKey, JSON.stringify(users));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('Quota de stockage dépassé. Utilisez des images PNG plus petites.');
                // Supprimer les avatars pour économiser de l'espace
                users.forEach(u => delete u.avatar);
                localStorage.setItem(usersKey, JSON.stringify(users));
            } else {
                throw e;
            }
        }
        
        // Sauvegarder la session
        sessionStorage.setItem('jdr_current_user', JSON.stringify(user));
        sessionStorage.setItem('jdr_current_party', party);
        
        // Rediriger vers la page appropriée
        if (user.role === 'gm') {
            window.location.href = 'gm.html';
        } else {
            window.location.href = 'player.html';
        }
    };
    reader.readAsDataURL(avatarFile);
}

// Fonction d'affichage des erreurs
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

