const db = require('../database');

module.exports = (req, res) => {
    const cookie = req.headers.cookie || '';
    const sessionId = cookie.split(';')
                            .find(c => c.trim().startsWith('session_id='))
                            ?.split('=')[1];

    if (!sessionId) {
        res.json(401, { error: 'Non connecté' });
        return null;
    }

    const session = db.prepare(`
        SELECT users.* FROM sessions
        JOIN users ON sessions.user_id = users.id
        WHERE sessions.id = ?
        AND sessions.expires_at > datetime('now')
    `).get(sessionId);

    if (!session) {
        res.json(401, { error: 'Session expirée ou invalide' });
        return null;
    }

    return session;
};