# 💬 Projet Forum

Un forum web fullstack moderne développé sans framework backend — Node.js, SQLite, React et Docker.

---

## 👥 Équipe

| Rôle | Nom |
|------|-----|
| Dev Frontend & Infrastructure | Jonathan HASARD |
| Dev Backend & Base de données | Maéva NEVEU |

---

## 🚀 Lancement rapide avec Docker

```bash
# 1. Cloner le projet
git clone https://github.com/Sazk47/projet-forum.git
cd projet-forum

# 2. Construire l'image Docker
docker build -t forum-app .

# 3. Lancer le container
docker run -p 8080:8080 forum-app
```

L'application sera accessible sur : **http://localhost:8080**

> Aucune installation manuelle requise — Docker gère tout.

---

## 🛠 Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React (sans framework CSS) |
| Backend | Node.js — module `http` natif |
| Base de données | SQLite via `better-sqlite3` |
| Upload d'images | Busboy |
| Infrastructure | Docker |

---

## 📁 Structure du projet

```
projet-forum/
├── client/               # Frontend React
│   ├── src/
│   │   ├── App.js        # Composant principal & gestion globale
│   │   ├── Auth.jsx      # Connexion / Inscription
│   │   ├── Posts.jsx     # Liste des posts
│   │   ├── PostDetail.jsx# Vue détaillée d'un post
│   │   ├── CreatePost.jsx# Formulaire de création
│   │   ├── FilterPosts.jsx# Barre de filtres
│   │   └── Footer.jsx    # Pied de page
├── middleware/
│   └── auth.js           # Vérification des sessions
├── routes/
│   ├── auth.js           # Routes inscription/connexion/déconnexion
│   ├── posts.js          # Routes CRUD des posts
│   ├── comments.js       # Routes des commentaires
│   ├── likes.js          # Routes likes/dislikes
│   └── categories.js     # Routes des catégories
├── public/
│   └── uploads/          # Images uploadées
├── app.js                # Serveur HTTP principal
├── database.js           # Initialisation de la base de données
├── Dockerfile
├── .dockerignore
└── package.json
```

---

## ✨ Fonctionnalités

### Tous les visiteurs
- Lire tous les posts et commentaires
- Voir les likes, dislikes et statistiques (vues, réponses)
- Filtrer les posts par catégorie, récents, top likés, top vus

### Utilisateurs connectés
- Créer un post avec titre, contenu, image et catégories
- Modifier et supprimer ses propres posts
- Commenter un post, modifier et supprimer ses commentaires
- Liker ou disliker un post ou un commentaire
- Filtrer ses propres posts et ses posts aimés

---

## 🗄 Base de données

7 tables SQLite avec clés étrangères :

- `users` — comptes utilisateurs
- `sessions` — sessions actives
- `posts` — posts du forum
- `commentaires` — commentaires sur les posts
- `likes` — likes et dislikes
- `category` — catégories disponibles
- `post_category` — liaison many-to-many posts ↔ catégories

---

## 🔐 Sécurité

- Mots de passe hashés avec **bcrypt** (salt rounds = 10)
- Sessions stockées en base de données avec expiration après **24h**
- Cookies **HttpOnly** — inaccessibles depuis JavaScript
- **1 seule session active** par utilisateur
- Toutes les routes protégées sont vérifiées côté serveur

---

## 📦 Dépendances

```json
{
  "better-sqlite3": "base de données SQLite",
  "bcrypt": "hashage des mots de passe",
  "busboy": "gestion des uploads d'images"
}
```

---

## 🔧 Lancement sans Docker (développement)

### Backend

```bash
npm install
node app.js
```

### Frontend

```bash
cd client
npm install
npm start
```

Le backend tourne sur `http://localhost:8080`  
Le frontend tourne sur `http://localhost:3000`