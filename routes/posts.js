const db = require('../database');
const fs = require('fs');
const path = require('path');

// Helper pour extraire l'ID de l'URL (ex: /api/posts/123)
const extractIdFromPath = (urlPath) => {
    const match = urlPath.match(/^\/api\/posts\/(\d+)/);
    return match ? parseInt(match[1]) : null;
};

// Helper pour vérifier la session et récupérer l'utilisateur
const getUserFromSession = (req) => {
    const cookie = req.headers.cookie || '';
    const sessionId = cookie.split(';')
                            .find(c => c.trim().startsWith('session_id='))
                            ?.split('=')[1];

    if (!sessionId) return null;

    const session = db.prepare(`SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')`).get(sessionId);

    if (!session) return null;

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?')
                    .get(session.user_id);

    return user;
};

// Helper pour récupérer les catégories d'un post
const getPostCategories = (postId) => {
    return db.prepare(`
        SELECT category.id, category.name 
        FROM category 
        JOIN post_category ON category.id = post_category.category_id 
        WHERE post_category.post_id = ?
    `).all(postId);
};

// Helper pour supprimer une image
const deleteImage = (imagePath) => {
    if (!imagePath) return;
    const fullPath = path.join(__dirname, '..', 'public', imagePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

module.exports = async (req, res, urlPath, method) => {

    // GET /api/posts - Lister tous les posts avec filtrage optionnel
    if (urlPath === '/api/posts' && method === 'GET') {
        // Extraire les query params
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

        // Filtre par catégorie
        if (categoryId) {
            query += `
                AND posts.id IN (
                    SELECT post_id FROM post_category 
                    WHERE category_id = ?
                )
            `;
            params.push(parseInt(categoryId));
        }

        // Filtre - mes posts (réservé aux connectés)
        if (mine === 'true') {
            if (!user) {
                return res.json(401, { error: 'Non authentifié' });
            }
            query += ` AND posts.user_id = ?`;
            params.push(user.id);
        }

        // Filtre - posts aimés (réservé aux connectés)
        if (liked === 'true') {
            if (!user) {
                return res.json(401, { error: 'Non authentifié' });
            }
            query += `
                AND posts.id IN (
                    SELECT post_id FROM likes 
                    WHERE user_id = ? AND type = 'like' AND post_id IS NOT NULL
                )
            `;
            params.push(user.id);
        }

        query += ` ORDER BY posts.created_at DESC`;

        const stmt = db.prepare(query);
        const posts = params.length > 0 ? stmt.all(...params) : stmt.all();

        // Ajouter les catégories pour chaque post
        const postsWithCategories = posts.map(post => ({
            ...post,
            categories: getPostCategories(post.id)
        }));

        return res.json(200, postsWithCategories);
    }

    // GET /api/posts/:id - Obtenir un post spécifique avec ses catégories
    const postId = extractIdFromPath(urlPath);
    if (postId && urlPath === `/api/posts/${postId}` && method === 'GET') {
        const post = db.prepare(`
            SELECT posts.*, users.username 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            WHERE posts.id = ? AND posts.status = 'visible'
        `).get(postId);

        if (!post) {
            return res.json(404, { error: 'Post non trouvé' });
        }

        const postWithCategories = {
            ...post,
            categories: getPostCategories(post.id)
        };

        return res.json(200, postWithCategories);
    }

    // POST /api/posts - Créer un post
    if (urlPath === '/api/posts' && method === 'POST') {
        let user = getUserFromSession(req);
        
        // Si l'utilisateur n'est pas authentifié, utiliser un utilisateur par défaut ou en créer un
        if (!user) {
            // Pour le développement, créer un utilisateur par défaut s'il n'existe pas
            const defaultUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get('demo');
            if (defaultUser) {
                user = defaultUser;
            } else {
                // Créer un utilisateur démo
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
            return res.json(400, { error: 'Titre et contenu requis' });
        }

        // Vérifier que au moins une catégorie est sélectionnée
        if (!categories || (Array.isArray(categories) && categories.length === 0) || (!Array.isArray(categories) && !categories)) {
            return res.json(400, { error: 'Au moins une catégorie doit être sélectionnée' });
        }

        const imagePath = imageFile ? imageFile.path : null;

        const result = db.prepare(`
            INSERT INTO posts (title, body, user_id, image_path) 
            VALUES (?, ?, ?, ?)
        `).run(title, body, user.id, imagePath);

        const newPostId = result.lastInsertRowid;

        // Lier les catégories si fournies
        if (categories) {
            // S'assurer que categories est un array
            const categoryArray = Array.isArray(categories) ? categories : [categories];
            const stmt = db.prepare('INSERT INTO post_category (post_id, category_id) VALUES (?, ?)');
            categoryArray.forEach(categoryId => {
                const id = parseInt(categoryId);
                if (!isNaN(id)) {
                    stmt.run(newPostId, id);
                }
            });
        }

        return res.json(201, { message: 'Post créé avec succès', id: newPostId });
    }

    // PUT /api/posts/:id - Modifier un post
    if (postId && urlPath === `/api/posts/${postId}` && method === 'PUT') {
        const user = getUserFromSession(req);
        if (!user) {
            return res.json(401, { error: 'Non authentifié' });
        }

        const post = db.prepare('SELECT user_id, image_path FROM posts WHERE id = ?').get(postId);

        if (!post) {
            return res.json(404, { error: 'Post non trouvé' });
        }

        if (post.user_id !== user.id) {
            return res.json(403, { error: 'Vous ne pouvez pas modifier ce post' });
        }

        const { title, body, categories } = req.body;
        const imageFile = req.files?.image;

        if (!title || !body) {
            return res.json(400, { error: 'Titre et contenu requis' });
        }

        let imagePath = post.image_path;
        if (imageFile) {
            // Supprimer l'ancienne image si elle existe
            deleteImage(post.image_path);
            imagePath = imageFile.path;
        }

        db.prepare(`
            UPDATE posts 
            SET title = ?, body = ?, image_path = ? 
            WHERE id = ?
        `).run(title, body, imagePath, postId);

        // Mettre à jour les catégories si fournies
        if (categories && Array.isArray(categories)) {
            db.prepare('DELETE FROM post_category WHERE post_id = ?').run(postId);
            const stmt = db.prepare('INSERT INTO post_category (post_id, category_id) VALUES (?, ?)');
            categories.forEach(categoryId => {
                stmt.run(postId, categoryId);
            });
        }

        return res.json(200, { message: 'Post modifié avec succès' });
    }

    // DELETE /api/posts/:id - Supprimer un post
    if (postId && urlPath === `/api/posts/${postId}` && method === 'DELETE') {
        const user = getUserFromSession(req);
        if (!user) {
            return res.json(401, { error: 'Non authentifié' });
        }

        const post = db.prepare('SELECT user_id, image_path FROM posts WHERE id = ?').get(postId);

        if (!post) {
            return res.json(404, { error: 'Post non trouvé' });
        }

        if (post.user_id !== user.id) {
            return res.json(403, { error: 'Vous ne pouvez pas supprimer ce post' });
        }

        // Supprimer l'image associée
        deleteImage(post.image_path);

        // Supprimer les liaisons de catégories (cascade via DB, mais au cas où)
        db.prepare('DELETE FROM post_category WHERE post_id = ?').run(postId);

        // Supprimer le post
        db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

        return res.json(200, { message: 'Post supprimé avec succès' });
    }

    res.json(404, { error: 'Route non trouvée' });
};
