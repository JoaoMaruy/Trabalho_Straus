require("dotenv").config();

const fs = require("fs");
const express = require("express");
const session = require("express-session");
let RedisStore;
let redisClient;
try {
  if (process.env.REDIS_URL) {
    const redis = require("redis");
    const connectRedis = require("connect-redis");
    RedisStore = connectRedis.RedisStore || connectRedis.default || connectRedis;
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch((err) => console.warn("Redis connect failed:", err));
  }
} catch (e) {
  console.warn("Redis modules not available, falling back to file session store.", e.message);
}
const FileStore = require("session-file-store")(session);
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const repository = require("./repositories");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const sessionsPath = path.join(__dirname, "sessions");

if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath, { recursive: true });

const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store:
      redisClient && RedisStore
        ? new RedisStore({ client: redisClient })
        : new FileStore({
            path: sessionsPath,
            ttl: SESSION_MAX_AGE / 1000,
            retries: 1,
          }),
    secret: process.env.SESSION_SECRET || "cine-review-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: "blockfilms.sid",
    cookie: {
      maxAge: SESSION_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  }),
);

app.use((req, _res, next) => {
  if (req.session.userId) req.session.touch();
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/"))
      return cb(new Error("Apenas imagens são permitidas."));
    cb(null, true);
  },
});

const requireAuth = (req, res, next) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Não autenticado." });
  next();
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidCpf = (cpf) => {
  const digits = cpf.replace(/\D/g, "");
  return digits.length >= 1 && digits.length <= 11;
};

const isValidNota = (nota) => {
  const n = Number(nota);
  return Number.isInteger(n) && n >= 0 && n <= 10;
};

const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ error: "Arquivo muito grande (máx. 3 MB)." });
    return res.status(400).json({ error: "Falha no upload." });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

app.get("/api/health", async (_req, res) => {
  try {
    const totalUsuarios = await repository.countUsers();
    res.json({
      status: "ok",
      database: "back4app",
      schema: "sistema_filmes",
      totalUsuarios,
    });
  } catch {
    res.status(503).json({ status: "error", database: "back4app" });
  }
});

app.get("/api/sessao", (req, res) => {
  if (!req.session.userId) return res.json({ autenticado: false });
  res.json({
    autenticado: true,
    id_usuario: req.session.userId,
    nomeCompleto: req.session.userName,
  });
});

app.post("/api/registrar", async (req, res) => {
  try {
    const { nomeCompleto, nomeUsuario, email, senha, cpf } = req.body;
    if (!nomeCompleto?.trim() || !nomeUsuario?.trim() || !email?.trim() || !senha || !cpf)
      return res.status(400).json({ error: "Preencha todos os campos." });
    if (!isValidEmail(email))
      return res.status(400).json({ error: "E-mail inválido." });
    if (!isValidCpf(cpf))
      return res.status(400).json({ error: "CPF inválido." });

    if (await repository.emailExists(email))
      return res.status(400).json({ error: "E-mail já cadastrado." });
    if (await repository.nomeUsuarioExists(nomeUsuario))
      return res.status(400).json({ error: "Nome de usuário já em uso." });
    if (await repository.cpfExists(cpf))
      return res.status(400).json({ error: "CPF já cadastrado." });

    await repository.createUser({
      nomeCompleto,
      nomeUsuario,
      email,
      senha,
      cpf,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar:", error);
    res.status(500).json({ error: "Falha ao criar conta." });
  }
});

app.get("/api/debug", (req, res) => {
  res.json({
    authenticateUser: typeof repository.authenticateUser,
    findUserByLogin: typeof repository.findUserByLogin,
  });
});

app.post("/api/login", async (req, res) => {
  try {
    const { login, senha } = req.body;
    const identificador = login?.trim();
    if (!identificador || !senha)
      return res.status(400).json({ error: "Usuário/e-mail e senha são obrigatórios." });

    console.log(`[LOGIN] Tentando: ${identificador}`);

    const usuario = await repository.findUserByLogin(identificador);
    console.log(`[LOGIN] Usuário encontrado:`, usuario ? `${usuario.nomeUsuario}` : "NÃO");
    if (!usuario)
      return res.status(400).json({ error: "Usuário ou senha inválidos." });

    console.log(`[LOGIN] Autenticando usuario: ${usuario.nomeUsuario}`);
    const parseUser = await repository.authenticateUser(usuario.nomeUsuario, senha);
    console.log(`[LOGIN] Parse result:`, parseUser ? `✓ ${parseUser.id}` : "✗ null");
    if (!parseUser)
      return res.status(400).json({ error: "Usuário ou senha inválidos." });

    req.session.userId = usuario.id_usuario;
    req.session.userName = usuario.nomeCompleto;
    req.session.userEmail = usuario.email;
    await saveSession(req);
    console.log(`[LOGIN] ✓ Sucesso para ${usuario.nomeUsuario}`);
    res.json({
      success: true,
      usuario: {
        id_usuario: usuario.id_usuario,
        nomeCompleto: usuario.nomeCompleto,
        nomeUsuario: usuario.nomeUsuario,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Falha ao autenticar." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ error: "Falha ao encerrar a sessão." });
    res.clearCookie("blockfilms.sid", { path: "/" });
    res.json({ success: true });
  });
});

app.get("/api/usuario", async (req, res) => {
  try {
    if (!req.session.userId) return res.json({ usuario: null });

    const usuario = await repository.findUserById(req.session.userId);
    if (!usuario) {
      req.session.destroy(() => {});
      return res.json({ usuario: null });
    }

    const totalAvaliacoes = await repository.countReviewsByUserId(
      req.session.userId,
    );
    res.json({ usuario: { ...usuario, totalAvaliacoes } });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Falha ao carregar perfil." });
  }
});

app.get("/api/usuario/:id", async (req, res) => {
  try {
    const perfil = await repository.getPublicProfile(req.params.id);
    if (!perfil) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json(perfil);
  } catch (error) {
    console.error("Erro ao buscar perfil público:", error);
    res.status(500).json({ error: "Falha ao carregar perfil." });
  }
});

app.put("/api/perfil", requireAuth, async (req, res) => {
  try {
    const { nomeCompleto, nomeUsuario, email, cpf } = req.body;
    if (!nomeCompleto?.trim() || !nomeUsuario?.trim() || !email?.trim() || !cpf)
      return res.status(400).json({ error: "Preencha todos os campos." });
    if (!isValidEmail(email))
      return res.status(400).json({ error: "E-mail inválido." });
    if (!isValidCpf(cpf))
      return res.status(400).json({ error: "CPF inválido." });

    if (await repository.emailExists(email, req.session.userId))
      return res.status(400).json({ error: "Este e-mail já está em uso." });
    if (await repository.nomeUsuarioExists(nomeUsuario, req.session.userId))
      return res.status(400).json({ error: "Nome de usuário já em uso." });
    if (await repository.cpfExists(cpf, req.session.userId))
      return res.status(400).json({ error: "CPF já cadastrado." });

    const usuario = await repository.updateUserProfile(req.session.userId, {
      nomeCompleto,
      nomeUsuario,
      email,
      cpf,
    });
    req.session.userName = usuario.nomeCompleto;
    req.session.userEmail = usuario.email;
    res.json({ success: true, usuario });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Falha ao atualizar perfil." });
  }
});

app.put("/api/perfil/senha", requireAuth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha)
      return res.status(400).json({ error: "Preencha as senhas." });

    const usuario =
      (await repository.findUserById(req.session.userId)) ||
      (await repository.findUserByLogin(req.session.userEmail));
    if (!usuario) return res.status(400).json({ error: "Usuário não encontrado." });

    const valid = await repository.authenticateUser(usuario.nomeUsuario, senhaAtual);
    if (!valid) return res.status(400).json({ error: "Senha atual incorreta." });

    await repository.updateUserPassword(req.session.userId, novaSenha);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Falha ao alterar senha." });
  }
});

app.post(
  "/api/perfil/foto",
  requireAuth,
  upload.single("foto"),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Selecione uma imagem." });

      const fotoUrl = await repository.uploadImage(req.file);
      const usuario = await repository.updateUserPhoto(req.session.userId, fotoUrl);
      res.json({ success: true, foto_perfil: usuario.foto_perfil });
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      res.status(500).json({ error: "Falha ao salvar foto de perfil." });
    }
  },
);

app.get("/api/filmes", async (_req, res) => {
  try {
    console.log("🎬 Chamando repository.getMoviesList()...");
    const filmes = await repository.getMoviesList();
    console.log(`✓ Retornou ${filmes.length} filmes`);
    res.json(filmes);
  } catch (error) {
    console.error("Erro ao listar filmes:", error);
    res.status(500).json({ error: "Falha ao carregar filmes." });
  }
});

app.get("/api/filme/:nome", async (req, res) => {
  try {
    const nome = decodeURIComponent(req.params.nome);
    const detail = await repository.getMovieDetail(nome);
    if (!detail) return res.status(404).json({ error: "Filme não encontrado." });
    res.json(detail);
  } catch (error) {
    console.error("Erro ao buscar filme:", error);
    res.status(500).json({ error: "Falha ao carregar filme." });
  }
});

app.get("/api/avaliacoes", async (_req, res) => {
  try {
    res.json(await repository.getRecentReviews(50));
  } catch (error) {
    console.error("Erro ao listar avaliações:", error);
    res.status(500).json({ error: "Falha ao carregar avaliações." });
  }
});

app.get("/api/minhas-avaliacoes", requireAuth, async (req, res) => {
  try {
    res.json(await repository.getReviewsByUserId(req.session.userId));
  } catch (error) {
    console.error("Erro ao listar minhas avaliações:", error);
    res.status(500).json({ error: "Falha ao carregar suas avaliações." });
  }
});

app.post(
  "/api/avaliar",
  requireAuth,
  upload.single("imagem"),
  handleUploadError,
  async (req, res) => {
    try {
      const { nome_filme, nota, comentario, linkImagem } = req.body;
      if (!nome_filme?.trim() || nota === undefined || !comentario?.trim())
        return res
          .status(400)
          .json({ error: "Preencha o filme, nota e comentário." });
      if (!isValidNota(nota))
        return res.status(400).json({ error: "Nota deve ser um inteiro entre 0 e 10." });

      let imagem = linkImagem?.trim() || null;
      if (req.file) imagem = await repository.uploadImage(req.file);

      await repository.createReview({
        userId: req.session.userId,
        nome_filme,
        nota: Number(nota),
        comentario,
        imagem,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      res.status(500).json({ error: "Falha ao enviar avaliação." });
    }
  },
);

// Deletar avaliação por id (usuário dono ou admin)
app.delete("/api/avaliacao/:id", requireAuth, async (req, res) => {
  try {
    const rawId = req.params.id;
    // sanitize id: remove trailing suffixes like ':1' that may come from UI or selectors
    const id = decodeURIComponent(String(rawId)).split(':')[0];
    console.log(`DELETE /api/avaliacao request received for id='${rawId}' -> using '${id}'`);
    const review = await repository.findReviewById(id);
    if (!review) return res.status(404).json({ error: "Avaliação não encontrada." });

    const isOwner = review.id_usuario === req.session.userId;
    const isAdmin = (await repository.findUserById(req.session.userId))?.nomeUsuario === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Sem permissão para apagar esta avaliação." });

    const ok = await repository.deleteReview(id);
    if (!ok) return res.status(500).json({ error: "Falha ao deletar avaliação." });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar avaliação:", error);
    res.status(500).json({ error: "Falha ao deletar avaliação." });
  }
});

// Deletar todas as avaliações de um usuário (próprio perfil ou admin)
app.delete("/api/usuario/:id/avaliacoes", requireAuth, async (req, res) => {
  try {
    const rawTargetId = req.params.id;
    const targetId = decodeURIComponent(String(rawTargetId)).split(':')[0];
    console.log(`DELETE /api/usuario/:id/avaliacoes request received for id='${rawTargetId}' -> using '${targetId}'`);
    if (req.session.userId !== targetId) {
      const isAdmin = (await repository.findUserById(req.session.userId))?.nomeUsuario === "admin";
      if (!isAdmin) return res.status(403).json({ error: "Sem permissão." });
    }

    const removed = await repository.deleteReviewsByUserId(targetId);
    res.json({ success: true, removed });
  } catch (error) {
    console.error("Erro ao deletar avaliações do usuário:", error);
    res.status(500).json({ error: "Falha ao deletar avaliações do usuário." });
  }
});

app.post(
  "/api/filme/imagem",
  requireAuth,
  upload.single("imagem"),
  handleUploadError,
  async (req, res) => {
    try {
      const { nome } = req.body;
      if (!nome || !nome.trim())
        return res.status(400).json({ error: "Nome do filme obrigatório." });
      if (!req.file) return res.status(400).json({ error: "Selecione uma imagem." });

      const imagemUrl = await repository.uploadImage(req.file);
      const updated = await repository.updateFilmeImage(nome.trim(), imagemUrl);
      if (!updated) return res.status(404).json({ error: "Filme não encontrado." });

      res.json({ success: true, imagem: updated.imagem });
    } catch (error) {
      console.error("Erro ao atualizar imagem do filme:", error);
      res.status(500).json({ error: "Falha ao atualizar imagem do filme." });
    }
  },
);

app.use(express.static(path.join(__dirname, "public")));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

const start = async () => {
  try {
    const { seed } = require("./scripts/seed-back4app");
    await seed({ silent: true });
  } catch (err) {
    console.warn("Aviso: seed automático falhou:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor em: http://localhost:${PORT}`);
    console.log("Banco: Back4App | Schema: sistema_filmes");
    console.log(`Sessão persistente: ${SESSION_MAX_AGE / 86400000} dias`);
    console.log("Login de teste: admin / 123");
  });
};

start();
