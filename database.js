const Database = require('better-sqlite3');
const db = new Database('./forum.db');

// Active les clés étrangères (désactivées par défaut sur SQLite)
db.pragma('foreign_keys = ON');

const initDB = () => {

    // Table users
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR NOT NULL UNIQUE,
            email VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR NOT NULL,
            role VARCHAR DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table sessions
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Table posts
    db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR NOT NULL,
            body TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            status VARCHAR DEFAULT 'visible',
            image_path VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Table category
    db.exec(`
        CREATE TABLE IF NOT EXISTS category (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR NOT NULL UNIQUE,
            description TEXT
        )
    `);

    // Table post_category (liaison many-to-many)
    db.exec(`
        CREATE TABLE IF NOT EXISTS post_category (
            post_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            PRIMARY KEY (post_id, category_id),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
        )
    `);

    // Table commentaires
    db.exec(`
        CREATE TABLE IF NOT EXISTS commentaires (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Table likes
    db.exec(`
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER,
            comment_id INTEGER,
            type VARCHAR NOT NULL CHECK(type IN ('like', 'dislike')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES commentaires(id) ON DELETE CASCADE
        )
    `);

    console.log('Base de données initialisée !');
};

initDB();

// Ajouter les catégories par défaut
const seedCategories = () => {
    const defaultCategories = [
        { name: 'Général', description: 'Discussions générales' },
        { name: 'Technologie', description: 'Sujets relatifs à la technologie' },
        { name: 'Actualités', description: 'Dernières actualités' },
        { name: 'Divertissement', description: 'Contenus amusants et divertissants' },
        { name: 'Questions', description: 'Poser des questions' }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO category (name, description) VALUES (?, ?)');
    defaultCategories.forEach(cat => {
        stmt.run(cat.name, cat.description);
    });
};

seedCategories();

module.exports = db;