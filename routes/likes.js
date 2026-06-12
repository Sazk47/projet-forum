const db = require('../database');
const requireAuth = require('../middleware/auth');

module.exports = (req, res, urlPath, method) => {

    // Vérification méthode non autorisée
    if (urlPath === '/api/likes' && !['GET', 'POST'].includes(method)) {
        return res.sendError(405, `Méthode ${method} non autorisée sur ${urlPath}`);
    }

    // POST /api/likes
    if (method === 'POST' && urlPath === '/api/likes') {
        let user;
        try { user = requireAuth(req, res); } catch (err) { return res.sendError(err.status || 401, err.message); }

        const { post_id, comment_id, type } = req.body;

        if (!type || !['like', 'dislike'].includes(type)) {
            return res.sendError(400, 'Type invalide (like ou dislike requis)');
        }
        if (!post_id && !comment_id) {
            return res.sendError(400, 'post_id ou comment_id requis');
        }

        let existing;
        if (post_id) {
            existing = db.prepare('SELECT * FROM likes WHERE user_id = ? AND post_id = ?').get(user.id, post_id);
        } else {
            existing = db.prepare('SELECT * FROM likes WHERE user_id = ? AND comment_id = ?').get(user.id, comment_id);
        }

        // Même vote → on retire
        if (existing && existing.type === type) {
            db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
            return res.json(200, { message: 'Like retiré', action: 'removed' });
        }

        // Vote différent → on met à jour
        if (existing) {
            db.prepare('UPDATE likes SET type = ? WHERE id = ?').run(type, existing.id);
            return res.json(200, { message: 'Like mis à jour', action: 'updated' });
        }

        // Nouveau vote
        if (post_id) {
            db.prepare('INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, ?)').run(user.id, post_id, type);
        } else {
            db.prepare('INSERT INTO likes (user_id, comment_id, type) VALUES (?, ?, ?)').run(user.id, comment_id, type);
        }

        return res.json(201, { message: 'Like ajouté', action: 'added' });
    }

    // GET /api/likes?post_id=X ou ?comment_id=X
    if (method === 'GET' && urlPath === '/api/likes') {
        const params     = new URLSearchParams(req.url.split('?')[1] || '');
        const post_id    = params.get('post_id');
        const comment_id = params.get('comment_id');

        if (!post_id && !comment_id) return res.sendError(400, 'post_id ou comment_id requis');

        let counts;
        if (post_id) {
            counts = db.prepare(`
                SELECT type, COUNT(*) as count FROM likes WHERE post_id = ? GROUP BY type
            `).all(post_id);
        } else {
            counts = db.prepare(`
                SELECT type, COUNT(*) as count FROM likes WHERE comment_id = ? GROUP BY type
            `).all(comment_id);
        }

        const result = { likes: 0, dislikes: 0, user_vote: null };
        counts.forEach(row => {
            if (row.type === 'like')    result.likes    = row.count;
            if (row.type === 'dislike') result.dislikes = row.count;
        });

        // Vote de l'utilisateur connecté si session présente
        const cookie    = req.headers.cookie || '';
        const sessionId = cookie.split(';').find(c => c.trim().startsWith('session_id='))?.split('=')[1];

        if (sessionId) {
            const session = db.prepare(`
                SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')
            `).get(sessionId);

            if (session) {
                const userVote = post_id
                    ? db.prepare('SELECT type FROM likes WHERE user_id = ? AND post_id = ?').get(session.user_id, post_id)
                    : db.prepare('SELECT type FROM likes WHERE user_id = ? AND comment_id = ?').get(session.user_id, comment_id);
                result.user_vote = userVote?.type || null;
            }
        }

        return res.json(200, result);
    }

    res.sendError(404, `Route ${method} ${urlPath} introuvable`);
};