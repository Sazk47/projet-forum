const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

// Formulaire de connexion
document.querySelector('.sign-in-container form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.querySelector('.sign-in-container input[type="email"]').value;
    const password = document.querySelector('.sign-in-container input[type="password"]').value;

    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = 'http://localhost:3000';
        } else {
            alert('Erreur: ' + (data.error || 'Connexion echouee'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion');
    }
});

// Formulaire d'inscription
document.querySelector('.sign-up-container form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.querySelector('.sign-up-container input[type="text"]').value;
    const email = document.querySelector('.sign-up-container input[type="email"]').value;
    const password = document.querySelector('.sign-up-container input[type="password"]').value;

    try {
        const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Compte cree avec succes. Connectez-vous.');
            document.querySelector('.sign-in-container input[type="email"]').value = email;
            document.querySelector('.sign-in-container input[type="password"]').value = password;
            container.classList.remove("right-panel-active");
        } else {
            alert('Erreur: ' + (data.error || 'Inscription echouee'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'inscription');
    }
});
