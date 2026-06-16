const http = require('http');
const { StringDecoder } = require('string_decoder');
const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const authRoutes       = require('./routes/auth');
const postsRoutes      = require('./routes/posts');
const commentsRoutes   = require('./routes/comments');
const likesRoutes      = require('./routes/likes');
const categoriesRoutes = require('./routes/categories');

require('./database');

const uploadsDir     = path.join(__dirname, 'public', 'uploads');
const clientBuildDir = path.join(__dirname, 'client', 'build');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = 8080;

const HTTP_MESSAGES = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    500: 'Internal Server Error',
};

const MIME_TYPES = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.svg':  'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {

    const getBody = () => new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';

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
                    files[fieldname] = { filename: info.filename, path: `/uploads/${filename}` };
                });
                writeStream.on('error', (err) => reject(err));
            });

            bb.on('field', (fieldname, val) => {
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

            bb.on('close', () => resolve({ fields, files }));
            bb.on('error', (err) => reject(err));
            req.pipe(bb);

        } else {
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

    res.json = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    res.sendError = (statusCode, message) => {
        res.json(statusCode, {
            error: HTTP_MESSAGES[statusCode] || 'Error',
            message: message || HTTP_MESSAGES[statusCode] || 'Erreur inconnue',
        });
    };

    const { method, url } = req;
    const urlPath = url.split('?')[0];

    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        });
        res.end();
        return;
    }

    if (urlPath.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, 'public', urlPath);
        if (fs.existsSync(filePath) && filePath.startsWith(uploadsDir)) {
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.sendError(404, 'Fichier non trouvé');
        }
        return;
    }

    if (!urlPath.startsWith('/api/')) {
        const filePath = path.join(clientBuildDir, urlPath);
        const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

        if (fileExists) {
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            const indexPath = path.join(clientBuildDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                fs.createReadStream(indexPath).pipe(res);
            } else {
                res.sendError(404, 'Frontend non buildé — lancez npm run build dans /client');
            }
        }
        return;
    }

    const handle = async () => {
        const bodyData = await getBody();
        req.body  = bodyData.fields;
        req.files = bodyData.files;

        if (urlPath.startsWith('/api/auth'))       return authRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/posts'))      return postsRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/comments'))   return commentsRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/likes'))      return likesRoutes(req, res, urlPath, method);
        if (urlPath.startsWith('/api/categories')) return categoriesRoutes(req, res, urlPath, method);

        res.sendError(404, `Route ${method} ${urlPath} introuvable`);
    };

    handle().catch(err => {
        console.error('[ERREUR SERVEUR]', err);
        if (!res.writableEnded) {
            const status = err.status || err.statusCode || 500;
            res.sendError(status, err.message || 'Erreur interne du serveur');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});