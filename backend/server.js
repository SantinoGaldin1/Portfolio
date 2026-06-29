const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// health check
app.get('/ping', (req, res) => {
    res.status(200).send('Pong! El servidor esta despierto.');
});

// stub del form de contacto. Por ahora solo loguea y responde ok.
// ponytail: sin envio real (mail/DB) hasta que haga falta; engancharlo aca.
app.post('/api/contacto', (req, res) => {
    const { email } = req.body || {};
    if (!email) {
        return res.status(400).json({ error: 'Falta el email' });
    }
    console.log('Nuevo contacto:', email);
    res.json({ ok: true });
});

// sirve el frontend ya compilado (frontend/dist) en produccion
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
