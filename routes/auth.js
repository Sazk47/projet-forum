const db = require('../database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const ALLOWED_METHODS = {
    '/api/auth/register': ['POST'],
    '/api/auth/login':    ['POST'],
    '/api/auth/logout':   ['POST'],
    '/api/auth/user':     ['GET'],
};

module.exports = async (req, res, urlPath, method) => {

    // Vérification méthode non autorisée
    if (ALLOWED_METHODS[urlPath] && !ALLOWED_METHODS[urlPath].includes(method)) {
        return res.sendError(405, `Méthode ${method} non autorisée sur ${urlPath}`);
    }

    // POST /api/auth/register
    if (urlPath === '/api/auth/register' && method === 'POST') {
        const { username, email, password } = req.body;

        if (!username || !email || !password) return res.sendError(400, 'Champs manquants');

        const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existing) return res.sendError(409, 'Email ou username déjà utilisé');

        const hash = await bcrypt.hash(password, 10);
        db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);

        return res.json(201, { message: 'Compte créé avec succès' });
    }

    // POST /api/auth/login
    if (urlPath === '/api/auth/login' && method === 'POST') {
        const { email, password } = req.body;

        if (!email || !password) return res.sendError(400, 'Champs manquants');

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.sendError(401, 'Email ou mot de passe incorrect');
        }

        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, user.id, expiresAt);

        res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; Path=/; SameSite=Strict`);
        return res.json(200, { message: 'Connecté avec succès' });
    }

    // POST /api/auth/logout
    if (urlPath === '/api/auth/logout' && method === 'POST') {
        const cookie    = req.headers.cookie || '';
        const sessionId = cookie.split(';').find(c => c.trim().startsWith('session_id='))?.split('=')[1];
        if (sessionId) db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

        res.setHeader('Set-Cookie', 'session_id=; HttpOnly; Path=/; Max-Age=0');
        return res.json(200, { message: 'Déconnecté avec succès' });
    }

    // GET /api/auth/user
    if (urlPath === '/api/auth/user' && method === 'GET') {
        const cookie    = req.headers.cookie || '';
        const sessionId = cookie.split(';').find(c => c.trim().startsWith('session_id='))?.split('=')[1];

        if (!sessionId) return res.json(200, { user: null });

        const session = db.prepare(`
            SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')
        `).get(sessionId);

        if (!session) return res.json(200, { user: null });

        const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(session.user_id);
        return res.json(200, { user: user || null });
    }

    res.sendError(404, `Route ${method} ${urlPath} introuvable`);
};