const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');

const app = express();

// Servir arquivos estáticos
app.use(serveStatic(path.join(__dirname, '.')));

// Redirecionar todas as rotas para index.html (para suportar SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 