const db = require('../database');
const requireAuth = require('../middleware/auth');

module.exports = (req, res, urlPath, method) => {

    // Vérification méthode non autorisée
    const isBase    = urlPath === '/api/comments';
    const editMatch = urlPath.match(/^\/api\/comments\/(\d+)$/);

    if (isBase && !['GET', 'POST'].includes(method)) {
        return res.sendError(405, `Méthode ${method} non autorisée sur ${urlPath}`);
    }
    if (editMatch && !['PUT', 'DELETE'].includes(method)) {
        return res.sendError(405, `Méthode ${method} non autorisée sur ${urlPath}`);
    }

    // GET /api/comments?post_id=X
    if (method === 'GET' && isBase) {
        const params  = new URLSearchParams(req.url.split('?')[1] || '');
        const post_id = params.get('post_id');

        if (!post_id) return res.sendError(400, 'post_id requis');

        const comments = db.prepare(`
            SELECT commentaires.id,
                   commentaires.content,
                   commentaires.created_at,
                   commentaires.user_id,
                   users.username,
                   (SELECT COUNT(*) FROM likes WHERE comment_id = commentaires.id AND type = 'like')    AS likes,
                   (SELECT COUNT(*) FROM likes WHERE comment_id = commentaires.id AND type = 'dislike') AS dislikes
            FROM commentaires
            JOIN users ON commentaires.user_id = users.id
            WHERE commentaires.post_id = ?
            ORDER BY commentaires.created_at ASC
        `).all(post_id);

        return res.json(200, { comments });
    }

    // POST /api/comments
    if (method === 'POST' && isBase) {
        let user;
        try { user = requireAuth(req, res); } catch (err) { return res.sendError(err.status || 401, err.message); }

        const { post_id, content } = req.body;

        if (!post_id || !content?.trim()) return res.sendError(400, 'post_id et content requis');

        const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(post_id);
        if (!post) return res.sendError(404, 'Post non trouvé');

        const result = db.prepare(`
            INSERT INTO commentaires (post_id, user_id, content) VALUES (?, ?, ?)
        `).run(post_id, user.id, content.trim());

        const newComment = db.prepare(`
            SELECT commentaires.id,
                   commentaires.content,
                   commentaires.created_at,
                   commentaires.user_id,
                   users.username
            FROM commentaires
            JOIN users ON commentaires.user_id = users.id
            WHERE commentaires.id = ?
        `).get(result.lastInsertRowid);

        return res.json(201, { comment: newComment });
    }

    // PUT /api/comments/:id
    if (method === 'PUT' && editMatch) {
        let user;
        try { user = requireAuth(req, res); } catch (err) { return res.sendError(err.status || 401, err.message); }

        const commentId = editMatch[1];
        const { content } = req.body;

        if (!content?.trim()) return res.sendError(400, 'content requis');

        const comment = db.prepare('SELECT * FROM commentaires WHERE id = ?').get(commentId);
        if (!comment) return res.sendError(404, 'Commentaire non trouvé');
        if (comment.user_id !== user.id && user.role !== 'admin') return res.sendError(403, 'Non autorisé');

        db.prepare('UPDATE commentaires SET content = ? WHERE id = ?').run(content.trim(), commentId);
        return res.json(200, { message: 'Commentaire mis à jour' });
    }

    // DELETE /api/comments/:id
    if (method === 'DELETE' && editMatch) {
        let user;
        try { user = requireAuth(req, res); } catch (err) { return res.sendError(err.status || 401, err.message); }

        const commentId = editMatch[1];
        const comment   = db.prepare('SELECT * FROM commentaires WHERE id = ?').get(commentId);

        if (!comment) return res.sendError(404, 'Commentaire non trouvé');
        if (comment.user_id !== user.id && user.role !== 'admin') return res.sendError(403, 'Non autorisé');

        db.prepare('DELETE FROM commentaires WHERE id = ?').run(commentId);
        return res.json(200, { message: 'Commentaire supprimé' });
    }

    res.sendError(404, `Route ${method} ${urlPath} introuvable`);
};