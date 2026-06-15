import './App.css'
import { useState, useEffect } from 'react';
import Posts from './Posts';
import CreatePost from './CreatePost';
import Auth from './Auth';

const ForumLogo = () => (
  <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="url(#grad)"/>
    <path d="M8 10C8 8.9 8.9 8 10 8H26C27.1 8 28 8.9 28 10V20C28 21.1 27.1 22 26 22H20L15 28V22H10C8.9 22 8 21.1 8 20V10Z"
          fill="white" fillOpacity="0.92"/>
    <circle cx="13" cy="15" r="1.5" fill="#6c63ff"/>
    <circle cx="18" cy="15" r="1.5" fill="#6c63ff"/>
    <circle cx="23" cy="15" r="1.5" fill="#6c63ff"/>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6c63ff"/>
        <stop offset="100%" stopColor="#a89cff"/>
      </linearGradient>
    </defs>
  </svg>
);

function Toast({ visible }) {
  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`}>
      ✓ Post publié avec succès
    </div>
  );
}

function App() {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTrigger, setToastTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const handleLoginSuccess = () => {
    fetch('http://localhost:8080/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.user));
  };

  const handleLogout = async () => {
    await fetch('http://localhost:8080/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  const handlePostCreated = () => {
    setToastVisible(true);
    setToastTrigger(n => n + 1);
    setTimeout(() => setToastVisible(false), 3000);
  };

  if (!authChecked) return <div>Chargement...</div>;

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  require('./App.css');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <ForumLogo />
          <h1>Forum</h1>
        </div>
        <div className="navbar-right">
          <span>Bonjour, {user.username}</span>
          <button onClick={handleLogout}>Se déconnecter</button>
        </div>
      </nav>

      <div className="app-wrapper">
        <CreatePost onPostCreated={handlePostCreated} />
        <Posts toastTrigger={toastTrigger} />
      </div>

      <Toast visible={toastVisible} />
    </>
  );
}

export default App;