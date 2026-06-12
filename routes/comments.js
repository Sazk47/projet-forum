const db = require('../database');
const requireAuth = require('../middleware/auth');

module.exports = (req, res, urlPath, method) => {


    if (method === 'GET' && urlPath === '/api/comments') {
        const query = req.url.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const post_id = params.get('post_id');

        if (!post_id) {
            return res.json(400, { error: 'post_id requis' });
        }

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


    if (method === 'POST' && urlPath === '/api/comments') {
        const user = requireAuth(req, res);
        if (!user) return;

        const { post_id, content } = req.body;

        if (!post_id || !content?.trim()) {
            return res.json(400, { error: 'post_id et content requis' });
        }


        const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(post_id);
        if (!post) return res.json(404, { error: 'Post non trouvé' });

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


    const editMatch = urlPath.match(/^\/api\/comments\/(\d+)$/);
    if (method === 'PUT' && editMatch) {
        const user = requireAuth(req, res);
        if (!user) return;

        const commentId = editMatch[1];
        const { content } = req.body;

        if (!content?.trim()) {
            return res.json(400, { error: 'content requis' });
        }

        const comment = db.prepare('SELECT * FROM commentaires WHERE id = ?').get(commentId);
        if (!comment) return res.json(404, { error: 'Commentaire non trouvé' });

        if (comment.user_id !== user.id && user.role !== 'admin') {
            return res.json(403, { error: 'Non autorisé' });
        }

        db.prepare('UPDATE commentaires SET content = ? WHERE id = ?')
            .run(content.trim(), commentId);

        return res.json(200, { message: 'Commentaire mis à jour' });
    }

    const deleteMatch = urlPath.match(/^\/api\/comments\/(\d+)$/);
    if (method === 'DELETE' && deleteMatch) {
        const user = requireAuth(req, res);
        if (!user) return;

        const commentId = deleteMatch[1];
        const comment = db.prepare('SELECT * FROM commentaires WHERE id = ?').get(commentId);

        if (!comment) return res.json(404, { error: 'Commentaire non trouvé' });

        if (comment.user_id !== user.id && user.role !== 'admin') {
            return res.json(403, { error: 'Non autorisé' });
        }

        db.prepare('DELETE FROM commentaires WHERE id = ?').run(commentId);
        return res.json(200, { message: 'Commentaire supprimé' });
    }

    res.json(404, { error: 'Route comments non trouvée' });
};