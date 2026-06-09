const db = require('../database');
const fs = require('fs');
const path = require('path');

const extractIdFromPath = (urlPath) => {
    const match = urlPath.match(/^\/api\/posts\/(\d+)/);
    return match ? parseInt(match[1]) : null;
};

const getUserFromSession = (req) => {
    const cookie = req.headers.cookie || '';
    const sessionId = cookie.split(';')
                            .find(c => c.trim().startsWith('session_id='))
                            ?.split('=')[1];

    if (!sessionId) return null;

    const session = db.prepare(`SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')`).get(sessionId);
    if (!session) return null;

    return db.prepare('SELECT id, username FROM users WHERE id = ?').get(session.user_id);
};

const getPostCategories = (postId) => {
    return db.prepare(`
        SELECT category.id, category.name 
        FROM category 
        JOIN post_category ON category.id = post_category.category_id 
        WHERE post_category.post_id = ?
    `).all(postId);
};

const deleteImage = (imagePath) => {
    if (!imagePath) return;
    const fullPath = path.join(__dirname, '..', 'public', imagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// Méthodes autorisées par pattern de route
const isAllowedMethod = (urlPath, postId, method) => {
    if (urlPath === '/api/posts')                       return ['GET', 'POST'].includes(method);
    if (postId && urlPath === `/api/posts/${postId}`)   return ['GET', 'PUT', 'DELETE'].includes(method);
    return false;
};

module.exports = async (req, res, urlPath, method) => {
    const postId = extractIdFromPath(urlPath);

    // Vérification méthode non autorisée
    const routeExists = urlPath === '/api/posts' || (postId && urlPath === `/api/posts/${postId}`);
    if (routeExists && !isAllowedMethod(urlPath, postId, method)) {
        return res.sendError(405, `Méthode ${method} non autorisée sur ${urlPath}`);
    }

    // GET /api/posts
    if (urlPath === '/api/posts' && method === 'GET') {
        const url = new URL(req.url, 'http://localhost');
        const categoryId = url.searchParams.get('category');
        const mine = url.searchParams.get('mine');
        const liked = url.searchParams.get('liked');

        const user = getUserFromSession(req);

        let query = `
            SELECT posts.*, users.username 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            WHERE posts.status = 'visible'
        `;
        let params = [];

        if (categoryId) {
            query += ` AND posts.id IN (SELECT post_id FROM post_category WHERE category_id = ?)`;
            params.push(parseInt(categoryId));
        }

        if (mine === 'true') {
            if (!user) return res.sendError(401, 'Connectez-vous pour filtrer vos posts');
            query += ` AND posts.user_id = ?`;
            params.push(user.id);
        }

        if (liked === 'true') {
            if (!user) return res.sendError(401, 'Connectez-vous pour filtrer vos posts aimés');
            query += ` AND posts.id IN (SELECT post_id FROM likes WHERE user_id = ? AND type = 'like' AND post_id IS NOT NULL)`;
            params.push(user.id);
        }

        query += ` ORDER BY posts.created_at DESC`;

        const stmt = db.prepare(query);
        const posts = params.length > 0 ? stmt.all(...params) : stmt.all();

        const postsWithCategories = posts.map(post => ({
            ...post,
            categories: getPostCategories(post.id)
        }));

        return res.json(200, postsWithCategories);
    }

    // GET /api/posts/:id
    if (postId && urlPath === `/api/posts/${postId}` && method === 'GET') {
        const post = db.prepare(`
            SELECT posts.*, users.username 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            WHERE posts.id = ? AND posts.status = 'visible'
        `).get(postId);

        if (!post) return res.sendError(404, 'Post non trouvé');

        return res.json(200, { ...post, categories: getPostCategories(post.id) });
    }

    // POST /api/posts
    if (urlPath === '/api/posts' && method === 'POST') {
        let user = getUserFromSession(req);

        if (!user) {
            const defaultUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get('demo');
            if (defaultUser) {
                user = defaultUser;
            } else {
                const bcrypt = require('bcrypt');
                const hashedPassword = bcrypt.hashSync('demo123', 10);
                const result = db.prepare(`
                    INSERT INTO users (username, email, password_hash, role) 
                    VALUES (?, ?, ?, ?)
                `).run('demo', 'demo@example.com', hashedPassword, 'user');
                user = { id: result.lastInsertRowid, username: 'demo' };
            }
        }

        const { title, body, categories } = req.body;
        const imageFile = req.files?.image;

        if (!title || !body) {
            return res.sendError(400, 'Titre et contenu requis');
        }

        if (!categories || (Array.isArray(categories) && categories.length === 0)) {
            return res.sendError(400, 'Au moins une catégorie doit être sélectionnée');
        }

        const imagePath = imageFile ? imageFile.path : null;

        const result = db.prepare(`
            INSERT INTO posts (title, body, user_id, image_path) VALUES (?, ?, ?, ?)
        `).run(title, body, user.id, imagePath);

        const newPostId = result.lastInsertRowid;

        const categoryArray = Array.isArray(categories) ? categories : [categories];
        const stmt = db.prepare('INSERT INTO post_category (post_id, category_id) VALUES (?, ?)');
        categoryArray.forEach(categoryId => {
            const id = parseInt(categoryId);
            if (!isNaN(id)) stmt.run(newPostId, id);
        });

        return res.json(201, { message: 'Post créé avec succès', id: newPostId });
    }

    // PUT /api/posts/:id
    if (postId && urlPath === `/api/posts/${postId}` && method === 'PUT') {
        const user = getUserFromSession(req);
        if (!user) return res.sendError(401, 'Non authentifié');

        const post = db.prepare('SELECT user_id, image_path FROM posts WHERE id = ?').get(postId);
        if (!post) return res.sendError(404, 'Post non trouvé');
        if (post.user_id !== user.id) return res.sendError(403, 'Vous ne pouvez pas modifier ce post');

        const { title, body, categories } = req.body;
        const imageFile = req.files?.image;

        if (!title || !body) return res.sendError(400, 'Titre et contenu requis');

        let imagePath = post.image_path;
        if (imageFile) {
            deleteImage(post.image_path);
            imagePath = imageFile.path;
        }

        db.prepare(`UPDATE posts SET title = ?, body = ?, image_path = ? WHERE id = ?`)
          .run(title, body, imagePath, postId);

        if (categories && Array.isArray(categories)) {
            db.prepare('DELETE FROM post_category WHERE post_id = ?').run(postId);
            const stmt = db.prepare('INSERT INTO post_category (post_id, category_id) VALUES (?, ?)');
            categories.forEach(categoryId => stmt.run(postId, categoryId));
        }

        return res.json(200, { message: 'Post modifié avec succès' });
    }

    // DELETE /api/posts/:id
    if (postId && urlPath === `/api/posts/${postId}` && method === 'DELETE') {
        const user = getUserFromSession(req);
        if (!user) return res.sendError(401, 'Non authentifié');

        const post = db.prepare('SELECT user_id, image_path FROM posts WHERE id = ?').get(postId);
        if (!post) return res.sendError(404, 'Post non trouvé');
        if (post.user_id !== user.id) return res.sendError(403, 'Vous ne pouvez pas supprimer ce post');

        deleteImage(post.image_path);
        db.prepare('DELETE FROM post_category WHERE post_id = ?').run(postId);
        db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

        return res.json(200, { message: 'Post supprimé avec succès' });
    }

    res.sendError(404, `Route ${method} ${urlPath} introuvable`);
};
