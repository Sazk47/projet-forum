const db = require('../database');
const requireAuth = require('../middleware/auth');

module.exports = (req, res, urlPath, method) => {


    if (method === 'POST' && urlPath === '/api/likes') {
        const user = requireAuth(req, res);
        if (!user) return;

        const { post_id, comment_id, type } = req.body;

        if (!type || !['like', 'dislike'].includes(type)) {
            return res.json(400, { error: 'Type invalide (like ou dislike requis)' });
        }

        if (!post_id && !comment_id) {
            return res.json(400, { error: 'post_id ou comment_id requis' });
        }


        let existing;
        if (post_id) {
            existing = db.prepare(`
                SELECT * FROM likes WHERE user_id = ? AND post_id = ?
            `).get(user.id, post_id);
        } else {
            existing = db.prepare(`
                SELECT * FROM likes WHERE user_id = ? AND comment_id = ?
            `).get(user.id, comment_id);
        }


        if (existing && existing.type === type) {
            db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
            return res.json(200, { message: 'Like retiré', action: 'removed' });
        }


        if (existing) {
            db.prepare('UPDATE likes SET type = ? WHERE id = ?').run(type, existing.id);
            return res.json(200, { message: 'Like mis à jour', action: 'updated' });
        }


        if (post_id) {
            db.prepare(`
                INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, ?)
            `).run(user.id, post_id, type);
        } else {
            db.prepare(`
                INSERT INTO likes (user_id, comment_id, type) VALUES (?, ?, ?)
            `).run(user.id, comment_id, type);
        }

        return res.json(201, { message: 'Like ajouté', action: 'added' });
    }


    if (method === 'GET' && urlPath === '/api/likes') {
        const query = req.url.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const post_id    = params.get('post_id');
        const comment_id = params.get('comment_id');

        if (!post_id && !comment_id) {
            return res.json(400, { error: 'post_id ou comment_id requis' });
        }

        let counts;
        if (post_id) {
            counts = db.prepare(`
                SELECT type, COUNT(*) as count
                FROM likes WHERE post_id = ?
                GROUP BY type
            `).all(post_id);
        } else {
            counts = db.prepare(`
                SELECT type, COUNT(*) as count
                FROM likes WHERE comment_id = ?
                GROUP BY type
            `).all(comment_id);
        }

        const result = { likes: 0, dislikes: 0, user_vote: null };
        counts.forEach(row => {
            if (row.type === 'like')    result.likes    = row.count;
            if (row.type === 'dislike') result.dislikes = row.count;
        });


        const cookie = req.headers.cookie || '';
        const sessionId = cookie.split(';')
            .find(c => c.trim().startsWith('session_id='))?.split('=')[1];

        if (sessionId) {
            const session = db.prepare(`
                SELECT user_id FROM sessions
                WHERE id = ? AND expires_at > datetime('now')
            `).get(sessionId);

            if (session) {
                let userVote;
                if (post_id) {
                    userVote = db.prepare(`
                        SELECT type FROM likes WHERE user_id = ? AND post_id = ?
                    `).get(session.user_id, post_id);
                } else {
                    userVote = db.prepare(`
                        SELECT type FROM likes WHERE user_id = ? AND comment_id = ?
                    `).get(session.user_id, comment_id);
                }
                result.user_vote = userVote?.type || null;
            }
        }

        return res.json(200, result);
    }

    res.json(404, { error: 'Route likes non trouvée' });
};