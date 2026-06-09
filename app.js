const http = require('http');
const { StringDecoder } = require('string_decoder');
const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const authRoutes      = require('./routes/auth');
const postsRoutes     = require('./routes/posts');
const commentsRoutes  = require('./routes/comments');
const likesRoutes     = require('./routes/likes');
const categoriesRoutes = require('./routes/categories');

require('./database'); // initialise la BDD au démarrage

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = 8080;

const server = http.createServer((req, res) => {

    // Helper pour parser le body (JSON ou multipart/form-data)
    const getBody = () => new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';

        // Si c'est du multipart/form-data (uploads)
        if (contentType.startsWith('multipart/form-data')) {
            const bb = Busboy({ headers: req.headers });
            const fields = {};
            const files = {};

            bb.on('file', (fieldname, file, info) => {
                const filename = `${Date.now()}_${info.filename}`;
                const filepath = path.join(uploadsDir, filename);
                const writeStream = fs.createWriteStream(filepath);

                file.pipe(writeStream);

                writeStream.on('finish', () => {
                    files[fieldname] = {
                        filename: info.filename,
                        path: `/uploads/${filename}`
                    };
                });

                writeStream.on('error', (err) => {
                    reject(err);
                });
            });

            bb.on('field', (fieldname, val) => {
                // Gérer les champs multiples (ex: plusieurs catégories)
                if (fields[fieldname]) {
                    if (Array.isArray(fields[fieldname])) {
                        fields[fieldname].push(val);
                    } else {
                        fields[fieldname] = [fields[fieldname], val];
                    }
                } else {
                    fields[fieldname] = val;
                }
            });

            bb.on('close', () => {
                resolve({ fields, files });
            });

            bb.on('error', (err) => {
                reject(err);
            });

            req.pipe(bb);
        } else {
            // Sinon, parser comme JSON
            const decoder = new StringDecoder('utf-8');
            let body = '';
            req.on('data', chunk => body += decoder.write(chunk));
            req.on('end', () => {
                body += decoder.end();
                try {
                    resolve({ fields: JSON.parse(body), files: {} });
                } catch {
                    resolve({ fields: {}, files: {} });
                }
            });
        }
    });

    // Helper pour envoyer une réponse JSON
    res.json = (statusCode, data) => {
        res.writeHead(statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        });
        res.end(JSON.stringify(data));
    };

    const { method, url } = req;
    const urlPath = url.split('?')[0]; // enlève les query params

    // Gestion du CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        });
        res.end();
        return;
    }

    // Servir les fichiers statiques (images, css, etc.)
    if (urlPath.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, 'public', urlPath);
        
        // Vérifier que le fichier existe et est dans le bon répertoire
        if (fs.existsSync(filePath) && filePath.startsWith(uploadsDir)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.css': 'text/css',
                '.js': 'application/javascript'
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': 'http://localhost:3000'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Fichier non trouvé' }));
            return;
        }
    }

    // Routing
    const handle = async () => {
        const bodyData = await getBody();
        req.body = bodyData.fields;
        req.files = bodyData.files;

        if (urlPath.startsWith('/api/auth'))     return authRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/posts'))    return postsRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/comments')) return commentsRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/likes'))    return likesRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/categories')) return categoriesRoutes(req, res, urlPath, method);

        res.json(404, { error: 'Route non trouvée' });
    };

    handle().catch(err => {
        console.error(err);
        res.json(500, { error: 'Erreur interne du serveur' });
    });
});

server.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});