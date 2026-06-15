import { useState } from 'react';
import './Auth.css';

function Auth({ onLoginSuccess }) {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        onLoginSuccess && onLoginSuccess();
      } else {
        setError(data.error || 'Connexion échouée');
      }
    } catch {
      setError('Erreur lors de la connexion');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Compte créé ! Connectez-vous.');
        setIsRightPanelActive(false);
      } else {
        setError(data.error || 'Inscription échouée');
      }
    } catch {
      setError("Erreur lors de l'inscription");
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-container${isRightPanelActive ? ' right-panel-active' : ''}`}>

        {/* Inscription */}
        <div className="auth-form-container auth-sign-up">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1 className="auth-title">Create Account</h1>
            <span className="auth-subtitle">Or use your email for registration</span>
            {error && <p className="auth-error">{error}</p>}
            {successMsg && <p className="auth-success">{successMsg}</p>}
            <input className="auth-input" type="text" name="username" placeholder="Name" required />
            <input className="auth-input" type="email" name="email" placeholder="Email" required />
            <input className="auth-input" type="password" name="password" placeholder="Password" required />
            <button className="auth-btn" type="submit">Sign Up</button>
          </form>
        </div>

        {/* Connexion */}
        <div className="auth-form-container auth-sign-in">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1 className="auth-title">Sign in</h1>
            <span className="auth-subtitle">Or use your account</span>
            {error && <p className="auth-error">{error}</p>}
            <input className="auth-input" type="email" name="email" placeholder="Email" required />
            <input className="auth-input" type="password" name="password" placeholder="Password" required />
            <button className="auth-btn" type="submit">Sign In</button>
          </form>
        </div>

        {/* Overlay */}
        <div className="auth-overlay-container">
          <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
              <h1 className="auth-title" style={{color:'white'}}>Welcome!</h1>
              <p>Login with your personal info</p>
              <button className="auth-btn ghost" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
              <h1 className="auth-title" style={{color:'white'}}>Hello!</h1>
              <p>Enter your personal details and start</p>
              <button className="auth-btn ghost" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Auth;