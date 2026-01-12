

// Fonction de connexion
function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const role = document.getElementById('login-role').value;
    const avatarFile = document.getElementById('login-avatar').files[0];
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    if (!username || !role || !avatarFile) {
        showError('login-error', 'Veuillez remplir tous les champs');
        return;
    }
    
    // Récupérer les utilisateurs
    let users = JSON.parse(localStorage.getItem('jdr_users') || '[]');
    
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
                createdAt: new Date().toISOString()
            };
            users.push(user);
        }
        
        localStorage.setItem('jdr_users', JSON.stringify(users));
        
        // Sauvegarder la session avec l'avatar
        const sessionUser = { ...user, avatar: uploadedAvatar };
        sessionStorage.setItem('jdr_current_user', JSON.stringify(sessionUser));
        
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

