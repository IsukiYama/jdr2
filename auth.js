// Gestion des onglets
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    });
});

// Prévisualisation de l'avatar
document.getElementById('register-avatar').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('avatar-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
        };
        reader.readAsDataURL(file);
    }
});

// Fonction d'inscription
function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const role = document.getElementById('register-role').value;
    const avatarFile = document.getElementById('register-avatar').files[0];
    const errorDiv = document.getElementById('register-error');
    
    errorDiv.classList.remove('show');
    
    // Validations
    if (!username || !password || !confirm) {
        showError('register-error', 'Tous les champs sont requis');
        return;
    }
    
    if (username.length < 3) {
        showError('register-error', 'Le nom doit contenir au moins 3 caractères');
        return;
    }
    
    if (password.length < 6) {
        showError('register-error', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    if (password !== confirm) {
        showError('register-error', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (!avatarFile) {
        showError('register-error', 'Veuillez choisir une figurine');
        return;
    }
    
    // Récupérer les utilisateurs existants
    let users = JSON.parse(localStorage.getItem('jdr_users') || '[]');
    
    // Vérifier si l'utilisateur existe déjà
    if (users.find(u => u.username === username)) {
        showError('register-error', 'Ce nom d\'utilisateur existe déjà');
        return;
    }
    
    // Lire l'avatar
    const reader = new FileReader();
    reader.onload = (event) => {
        const user = {
            username: username,
            password: password, // En production, il faut hasher le mot de passe!
            role: role,
            avatar: event.target.result,
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        localStorage.setItem('jdr_users', JSON.stringify(users));
        
        alert('✅ Personnage créé avec succès! Vous pouvez maintenant vous connecter.');
        
        // Basculer vers la connexion
        document.querySelector('[data-tab="login"]').click();
        document.getElementById('login-username').value = username;
    };
    reader.readAsDataURL(avatarFile);
}

// Fonction de connexion
function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    if (!username || !password) {
        showError('login-error', 'Veuillez remplir tous les champs');
        return;
    }
    
    // Récupérer les utilisateurs
    const users = JSON.parse(localStorage.getItem('jdr_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showError('login-error', 'Nom d\'utilisateur ou mot de passe incorrect');
        return;
    }
    
    // Sauvegarder la session
    sessionStorage.setItem('jdr_current_user', JSON.stringify(user));
    
    // Rediriger vers la page appropriée
    if (user.role === 'gm') {
        window.location.href = 'gm.html';
    } else {
        window.location.href = 'player.html';
    }
}

// Fonction d'affichage des erreurs
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

// Permettre la connexion avec Enter
document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

document.getElementById('register-confirm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegister();
});