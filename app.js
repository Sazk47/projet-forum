const http = require('http');
const { StringDecoder } = require('string_decoder');

const authRoutes    = require('./routes/auth');
const postsRoutes   = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const likesRoutes   = require('./routes/likes');

require('./database'); // initialise la BDD au démarrage

const PORT = 8080;

const server = http.createServer((req, res) => {

    // Helper pour parser le body JSON
    const getBody = () => new Promise((resolve) => {
        const decoder = new StringDecoder('utf-8');
        let body = '';
        req.on('data', chunk => body += decoder.write(chunk));
        req.on('end', () => {
            body += decoder.end();
            try {
                resolve(JSON.parse(body));
            } catch {
                resolve({});
            }
        });
    });

    // Helper pour envoyer une réponse JSON
    res.json = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    const { method, url } = req;
    const path = url.split('?')[0]; // enlève les query params

    // Routing
    const handle = async () => {
        req.body = await getBody();

        if (path.startsWith('/api/auth'))     return authRoutes(req, res, path, method);
        if (path.startsWith('/api/posts'))    return postsRoutes(req, res, path, method);
        if (path.startsWith('/api/comments')) return commentsRoutes(req, res, path, method);
        if (path.startsWith('/api/likes'))    return likesRoutes(req, res, path, method);

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
const http = require("http");
const host = 'localhost';
const port = 8080;

const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("Server is running!");
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
