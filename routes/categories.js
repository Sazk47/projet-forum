const db = require('../database');

module.exports = (req, res, urlPath, method) => {
    // GET /api/categories - Récupérer toutes les catégories
    if (urlPath === '/api/categories' && method === 'GET') {
        const categories = db.prepare('SELECT id, name, description FROM category ORDER BY name').all();
        return res.json(200, categories);
    }

    // POST /api/categories - Créer une nouvelle catégorie (admin seulement)
    if (urlPath === '/api/categories' && method === 'POST') {
        const { name, description } = req.body;

        if (!name) {
            return res.json(400, { error: 'Nom de catégorie requis' });
        }

        try {
            const result = db.prepare(`
                INSERT INTO category (name, description) 
                VALUES (?, ?)
            `).run(name, description || null);

            return res.json(201, { id: result.lastInsertRowid, name, description });
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.json(400, { error: 'Cette catégorie existe déjà' });
            }
            throw err;
        }
    }

    return res.json(404, { error: 'Route non trouvée' });
};
