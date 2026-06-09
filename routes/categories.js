const db = require('../database');

const ALLOWED_METHODS = {
    '/api/categories': ['GET', 'POST'],
};

module.exports = (req, res, urlPath, method) => {

    if (ALLOWED_METHODS[urlPath] && !ALLOWED_METHODS[urlPath].includes(method)) {
        return res.sendError(405, `Méthode ${method} non autorisée sur ${urlPath}`);
    }

    // GET /api/categories
    if (urlPath === '/api/categories' && method === 'GET') {
        const categories = db.prepare('SELECT id, name, description FROM category ORDER BY name').all();
        return res.json(200, categories);
    }

    // POST /api/categories
    if (urlPath === '/api/categories' && method === 'POST') {
        const { name, description } = req.body;

        if (!name) return res.sendError(400, 'Nom de catégorie requis');

        try {
            const result = db.prepare(`INSERT INTO category (name, description) VALUES (?, ?)`)
                             .run(name, description || null);
            return res.json(201, { id: result.lastInsertRowid, name, description });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.sendError(409, 'Cette catégorie existe déjà');
            }
            throw err; // remonté au handler global → 500
        }
    }

    res.sendError(404, `Route ${method} ${urlPath} introuvable`);
};
