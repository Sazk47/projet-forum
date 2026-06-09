const db = require('../database');

module.exports = (req, res) => {
    const cookie = req.headers.cookie || '';
    const sessionId = cookie.split(';')
                            .find(c => c.trim().startsWith('session_id='))
                            ?.split('=')[1];

    if (!sessionId) {
        const err = new Error('Non connecté');
        err.status = 401;
        throw err;
    }

    const session = db.prepare(`
        SELECT users.* FROM sessions
        JOIN users ON sessions.user_id = users.id
        WHERE sessions.id = ?
        AND sessions.expires_at > datetime('now')
    `).get(sessionId);

    if (!session) {
        const err = new Error('Session expirée ou invalide');
        err.status = 401;
        throw err;
    }

    return session;
};
