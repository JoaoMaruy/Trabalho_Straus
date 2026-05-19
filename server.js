const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const cors = require('cors'); // Adicione esta linha

const app = express();

// --- CONFIGURAÇÕES ESSENCIAIS ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'cine-secret-key',
    resave: false,
    saveUninitialized: true
}));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ifsuldeminas', // Coloque sua senha do MySQL aqui
    database: 'sistema_filmes'
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ MySQL Conectado!");
});

// Configuração de Upload de Imagens
const storage = multer.diskStorage({
    destination: 'public/img/uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/registrar', (req, res) => {
    const { nome, email, senha } = req.body;
    const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
    db.query(sql, [nome, email, senha], (err) => {
        if (err) return res.status(400).send("Erro: E-mail já cadastrado.");
        res.send("Sucesso");
    });
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ? AND senha = ?";
    db.query(sql, [email, senha], (err, results) => {
        if (results.length > 0) {
            req.session.usuarioId = results[0].id;
            req.session.usuarioNome = results[0].nome;
            res.redirect('/index.html');
        } else {
            res.send("<script>alert('Dados incorretos'); window.location.href='/login.html';</script>");
        }
    });
});

// --- ROTAS DE CONTEÚDO ---

app.post('/avaliar', upload.single('imagem'), (req, res) => {
    if (!req.session.usuarioId) return res.redirect('/login.html');
    const { titulo, nota, comentario } = req.body;
    const imagem = req.file ? req.file.filename : 'default.png';
    const sql = "INSERT INTO avaliacoes (usuario_id, titulo_filme, nota, comentario, imagem) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [req.session.usuarioId, titulo, nota, comentario, imagem], () => {
        res.redirect('/index.html');
    });
});

app.get('/lista-avaliacoes', (req, res) => {
    const sql = "SELECT a.*, u.nome FROM avaliacoes a JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.id DESC";
    db.query(sql, (err, results) => res.json(results));
});

app.get('/dados-usuario', (req, res) => {
    res.json({ nome: req.session.usuarioNome || null });
});

app.listen(3000, () => console.log("🚀 Servidor em: http://localhost:3000"));