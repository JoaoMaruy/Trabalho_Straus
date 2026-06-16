const express = require("express");
const mysql = require("mysql2/promise");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "cine-review-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      sameSite: "lax",
    },
  }),
);

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "ifsuldeminas",
  database: process.env.DB_NAME || "sistema_filmes",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const storage = multer.diskStorage({
  destination: path.join(__dirname, "public", "img", "uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

app.get("/avaliacao.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "avaliacao.html"));
});

app.get("/perfil.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "perfil.html"));
});

app.post("/api/registrar", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha)
    return res.status(400).json({ error: "Preencha todos os campos." });

  const [usuarios] = await db.execute(
    "SELECT id FROM usuarios WHERE email = ?",
    [email],
  );
  if (usuarios.length > 0)
    return res.status(400).json({ error: "E-mail já cadastrado." });

  const hash = await bcrypt.hash(senha, 10);
  await db.execute(
    "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, hash],
  );
  res.json({ success: true });
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });

  const [usuarios] = await db.execute(
    "SELECT id, nome, senha FROM usuarios WHERE email = ?",
    [email],
  );
  if (usuarios.length === 0)
    return res.status(400).json({ error: "Usuário ou senha inválidos." });

  const usuario = usuarios[0];
  const validPassword = await bcrypt.compare(senha, usuario.senha);
  if (!validPassword)
    return res.status(400).json({ error: "Usuário ou senha inválidos." });

  req.session.userId = usuario.id;
  req.session.userName = usuario.nome;
  res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ error: "Falha ao encerrar a sessão." });
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

app.get("/api/usuario", async (req, res) => {
  if (!req.session.userId) return res.json({ usuario: null });

  const [rows] = await db.execute(
    "SELECT id, nome, email FROM usuarios WHERE id = ?",
    [req.session.userId],
  );
  if (rows.length === 0) return res.json({ usuario: null });

  const [countRows] = await db.execute(
    "SELECT COUNT(*) AS total FROM avaliacoes WHERE usuario_id = ?",
    [req.session.userId],
  );
  res.json({ usuario: { ...rows[0], totalAvaliacoes: countRows[0].total } });
});

app.get("/api/avaliacoes", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT a.id, a.titulo_filme, a.nota, a.comentario, a.imagem, a.criado_em, u.nome FROM avaliacoes a JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.criado_em DESC LIMIT 50",
  );
  res.json(rows);
});

app.get("/api/minhas-avaliacoes", async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Não autenticado." });

  const [rows] = await db.execute(
    "SELECT id, titulo_filme, nota, comentario, imagem, criado_em FROM avaliacoes WHERE usuario_id = ? ORDER BY criado_em DESC",
    [req.session.userId],
  );
  res.json(rows);
});

app.post("/api/avaliar", upload.single("imagem"), async (req, res) => {
  if (!req.session.userId)
    return res
      .status(401)
      .json({ error: "É necessário entrar para enviar uma avaliação." });

  const { titulo, nota, comentario, linkImagem } = req.body;
  if (!titulo || !nota || !comentario)
    return res
      .status(400)
      .json({ error: "Preencha o título, nota e comentário." });

  const imagem = req.file
    ? `/img/uploads/${req.file.filename}`
    : linkImagem?.trim() || null;
  await db.execute(
    "INSERT INTO avaliacoes (usuario_id, titulo_filme, nota, comentario, imagem) VALUES (?, ?, ?, ?, ?)",
    [req.session.userId, titulo, Number(nota), comentario, imagem],
  );
  res.json({ success: true });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`🚀 Servidor em: http://localhost:${PORT}`);
});
