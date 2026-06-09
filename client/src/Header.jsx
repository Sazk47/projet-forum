import { useState, useEffect } from 'react';

function Header() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8080/api/auth/user', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                setUser(data.user);
            })
            .catch(err => console.error('Erreur lors de la récupération de l\'utilisateur:', err));
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = 'http://localhost:8080/';
            } else {
                alert('Erreur lors de la déconnexion');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la déconnexion');
        }
    };

    return (
        <header style={styles.header}>
            <h1>Forum</h1>
            <div style={styles.userSection}>
                {user ? (
                    <>
                        <span>Bienvenue {user.username}</span>
                        <button onClick={handleLogout} style={styles.logoutBtn}>Déconnexion</button>
                    </>
                ) : (
                    <a href="http://localhost:8080/html/login.html" style={styles.loginBtn}>Connexion</a>
                )}
            </div>
        </header>
    );
}

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        backgroundColor: '#333',
        color: 'white',
        marginBottom: '20px',
        borderRadius: '4px'
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    logoutBtn: {
        padding: '8px 16px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    loginBtn: {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        textDecoration: 'none',
        display: 'inline-block'
    }
};

export default Header;
