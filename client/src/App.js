import { useState, useEffect } from 'react';
import './App.css';
import Posts from './Posts';
import CreatePost from './CreatePost';
import Auth from './Auth';
import Footer from './Footer';

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
  if (!visible) return null;
  return (
    <div className="toast toast--visible">
      ✓ Post publié avec succès
    </div>
  );
}

function AboutModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(4px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '36px', maxWidth: '540px',
        width: '90%', position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '18px', lineHeight: 1
        }}>✕</button>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: '800', color: 'var(--accent-light)', marginBottom: '16px' }}>
          À propos
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>
          Bienvenue sur notre forum communautaire ! Ce projet a été conçu dans le cadre d'un projet étudiant pour apprendre le développement web côté serveur, la gestion de bases de données, et la containerisation avec Docker.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>
          Le forum permet aux utilisateurs de créer des posts, commenter, liker ou disliker du contenu, et de filtrer les discussions par catégories.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7' }}>
          Développé avec{' '}
          <span style={{ color: 'var(--accent-light)' }}>Node.js</span>,{' '}
          <span style={{ color: 'var(--accent-light)' }}>SQLite</span>,{' '}
          <span style={{ color: 'var(--accent-light)' }}>React</span> et{' '}
          <span style={{ color: 'var(--accent-light)' }}>Docker</span>.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTrigger, setToastTrigger] = useState(0);
  const [user, setUser]                 = useState(null);
  const [authChecked, setAuthChecked]   = useState(false);
  const [showAuth, setShowAuth]         = useState(false);
  const [showAbout, setShowAbout]       = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

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
      .then(data => {
        setUser(data.user);
        setShowAuth(false);
      });
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

  const requireAuth = (callback) => {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    callback && callback();
    return true;
  };

  if (!authChecked) return <div>Chargement...</div>;

  if (showAuth) {
    return <Auth onLoginSuccess={handleLoginSuccess} onClose={() => setShowAuth(false)} />;
  }

  return (
    <>
      <nav className="navbar">
        <div
          className="navbar-brand"
          onClick={() => setResetTrigger(n => n + 1)}
          style={{ cursor: 'pointer' }}
        >
          <ForumLogo />
          <h1>Forum</h1>
        </div>
        <div className="navbar-right">
          <button
            onClick={() => setShowAbout(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}
          >
            À propos
          </button>
          {user ? (
            <>
              <span>Bonjour, {user.username}</span>
              <button onClick={handleLogout}>Se déconnecter</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)}>Se connecter</button>
          )}
        </div>
      </nav>

      <div className="app-wrapper">
        {user && <CreatePost onPostCreated={handlePostCreated} />}
        <Posts
          toastTrigger={toastTrigger}
          user={user}
          requireAuth={requireAuth}
          resetTrigger={resetTrigger}
        />
      </div>

      <Footer />

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <Toast visible={toastVisible} />
    </>
  );
}

export default App;