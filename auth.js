// Fonction pour sauvegarder l'avatar dans IndexedDB
function saveAvatarToIDB(party, username, avatar) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(`jdr_avatars_${party}`, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('avatars')) {
                db.createObjectStore('avatars');
            }
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['avatars'], 'readwrite');
            const store = transaction.objectStore('avatars');
            store.put(avatar, username);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// Fonction pour récupérer l'avatar depuis IndexedDB
function getAvatarFromIDB(party, username) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(`jdr_avatars_${party}`, 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['avatars'], 'readonly');
            const store = transaction.objectStore('avatars');
            const getRequest = store.get(username);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// Fonction de connexion
function handleLogin() {
    const party = document.getElementById('login-party').value.trim();
    const username = document.getElementById('login-username').value.trim();
    const avatarFile = document.getElementById('login-avatar').files[0];
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    if (!party || !username || !avatarFile) {
        showError('login-error', 'Veuillez remplir tous les champs');
        return;
    }
    
    // Récupérer les utilisateurs de la partie (CORRECTION: avec le nom de la partie)
    const usersKey = `jdr_users_${party}`;
    let users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    
    // Lire l'avatar uploadé
    const reader = new FileReader();
    reader.onload = (event) => {
        const uploadedAvatar = event.target.result;
        let user = users.find(u => u.username === username);
        
        if (!user) {
            // Créer le personnage si non trouvé
            user = {
                username: username,
                role: 'player',
                createdAt: new Date().toISOString()
            };
            users.push(user);
        }
        
        // Sauvegarder l'avatar dans IndexedDB
        saveAvatarToIDB(party, username, uploadedAvatar).then(() => {
            // Sauvegarder les utilisateurs avec le bon key
            localStorage.setItem(usersKey, JSON.stringify(users));
            
            // Sauvegarder la session
            sessionStorage.setItem('jdr_current_user', JSON.stringify(user));
            sessionStorage.setItem('jdr_current_party', party);
            
            // Rediriger vers la page GM
            window.location.href = 'gm.html';
        }).catch(err => {
            console.error('Erreur sauvegarde avatar:', err);
            showError('login-error', 'Erreur lors de la sauvegarde de l\'avatar');
        });
    };
    reader.readAsDataURL(avatarFile);
}

// Fonction d'affichage des erreurs
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}