const Parse = require("parse/node");
const config = require("../config/database");

const { appId, jsKey, masterKey, serverURL } = config;

if (!appId || !jsKey || !masterKey) {
  throw new Error(
    "Back4App nao configurado. Defina BACK4APP_APP_ID, BACK4APP_JS_KEY e BACK4APP_MASTER_KEY no .env",
  );
}

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

const MASTER = { useMasterKey: true };

const Usuarios = Parse.User;
const Filmes = Parse.Object.extend("Filme");
const Avaliacoes = Parse.Object.extend("avaliacoes");
const REVIEW_USER_FIELD = "usuario";

const PLACEHOLDER_POSTER =
  "https://placehold.co/360x540/111827/ffffff?text=Sem+Capa";

const normalize = (value) => String(value || "").trim();
const normalizeLower = (value) => normalize(value).toLowerCase();
const onlyDigits = (value) => normalize(value).replace(/\D/g, "");

const hashPassword = async (plain) => plain;
const verifyPassword = async (plain, stored) => plain === stored;

const authenticateUser = async (username, password) => {
  try {
    return await Parse.User.logIn(username, password);
  } catch (err) {
    console.error("[Repository] Erro na autenticacao _User:", err.message);
    return null;
  }
};

const mapUsuario = (row, { includeSenha = false } = {}) => {
  const data = {
    id_usuario: row.id,
    nomeCompleto:
      row.get("nomeCompleto") || row.get("nome") || row.get("username") || "Usuario",
    nomeUsuario: row.get("nomeUsuario") || row.get("username"),
    email: row.get("email") || "",
    cpf: row.get("cpf") || "",
    foto_perfil: row.get("foto_perfil") || row.get("fotoPerfilUrl") || null,
    criado_em: row.get("createdAt"),
  };

  if (includeSenha) data.senha = row.get("password") || "";
  return data;
};

const mapFilme = (row, extras = {}) => ({
  id_filme: row.id,
  nome: row.get("titulo"),
  sinopse: row.get("sinopse"),
  categoria: row.get("categoria"),
  idade: row.get("classificacao"),
  ano: row.get("ano"),
  imagem: row.get("fotoFilmeUrl") || null,
  ...extras,
});

const mapAvaliacao = (row, includeAuthor = false) => {
  const data = {
    id_avaliacao: row.id,
    nome_filme: row.get("nome_filme"),
    nota: row.get("nota"),
    comentario: row.get("comentario"),
    imagem: row.get("imagem") || null,
    criado_em: row.get("createdAt"),
  };

  const usuarioPtr = row.get(REVIEW_USER_FIELD) || row.get("id_usuario");
  if (usuarioPtr) {
    data.id_usuario = usuarioPtr.id || usuarioPtr.objectId;
    if (includeAuthor && usuarioPtr.get) {
      data.nomeCompleto =
        usuarioPtr.get("nomeCompleto") || usuarioPtr.get("username") || "Anonimo";
      data.nomeUsuario = usuarioPtr.get("nomeUsuario") || usuarioPtr.get("username");
      data.usuario_foto =
        usuarioPtr.get("foto_perfil") || usuarioPtr.get("fotoPerfilUrl") || null;
    }
  }

  return data;
};

const findUserByLogin = async (login) => {
  const value = normalizeLower(login);
  if (!value) return null;

  const q = new Parse.Query(Usuarios);
  q.limit(1000);
  const usuarios = await q.find(MASTER);

  const found = usuarios.find((u) => {
    const username = normalizeLower(u.get("username"));
    const nomeUsuario = normalizeLower(u.get("nomeUsuario"));
    const email = normalizeLower(u.get("email"));
    return username === value || nomeUsuario === value || email === value;
  });

  return found ? mapUsuario(found, { includeSenha: true }) : null;
};

const findUserById = async (id) => {
  try {
    const row = await new Parse.Query(Usuarios).get(id, MASTER);
    return mapUsuario(row);
  } catch {
    return null;
  }
};

const emailExists = async (email, excludeId = null) => {
  const q = new Parse.Query(Usuarios);
  q.equalTo("email", normalizeLower(email));
  if (excludeId) q.notEqualTo("objectId", excludeId);
  return (await q.count(MASTER)) > 0;
};

const nomeUsuarioExists = async (nomeUsuario, excludeId = null) => {
  const value = normalize(nomeUsuario);
  const byNomeUsuario = new Parse.Query(Usuarios);
  byNomeUsuario.equalTo("nomeUsuario", value);
  const byUsername = new Parse.Query(Usuarios);
  byUsername.equalTo("username", value);
  const q = Parse.Query.or(byNomeUsuario, byUsername);
  if (excludeId) q.notEqualTo("objectId", excludeId);
  return (await q.count(MASTER)) > 0;
};

const cpfExists = async (cpf, excludeId = null) => {
  const q = new Parse.Query(Usuarios);
  q.equalTo("cpf", onlyDigits(cpf));
  if (excludeId) q.notEqualTo("objectId", excludeId);
  return (await q.count(MASTER)) > 0;
};

const countUsers = async () => {
  const q = new Parse.Query(Usuarios);
  return q.count(MASTER);
};

const createUser = async ({
  nomeCompleto,
  nomeUsuario,
  email,
  senha,
  cpf,
  foto_perfil = null,
}) => {
  const row = new Parse.User();
  row.setUsername(normalize(nomeUsuario || nomeCompleto));
  row.setPassword(senha);
  row.set("email", normalizeLower(email));
  row.set("nomeCompleto", normalize(nomeCompleto));
  row.set("nomeUsuario", normalize(nomeUsuario));
  row.set("cpf", onlyDigits(cpf));
  if (foto_perfil) row.set("foto_perfil", foto_perfil);
  await row.save(null, MASTER);
  return { id_usuario: row.id };
};

const updateUserProfile = async (
  userId,
  { nomeCompleto, nomeUsuario, email, cpf },
) => {
  const row = await new Parse.Query(Usuarios).get(userId, MASTER);
  if (nomeUsuario) {
    row.setUsername(normalize(nomeUsuario));
    row.set("nomeUsuario", normalize(nomeUsuario));
  }
  if (nomeCompleto) row.set("nomeCompleto", normalize(nomeCompleto));
  if (email) row.set("email", normalizeLower(email));
  if (cpf) row.set("cpf", onlyDigits(cpf));
  await row.save(null, MASTER);
  return mapUsuario(row);
};

const updateUserPhoto = async (userId, fotoUrl) => {
  const row = await new Parse.Query(Usuarios).get(userId, MASTER);
  row.set("foto_perfil", fotoUrl);
  row.set("fotoPerfilUrl", fotoUrl);
  await row.save(null, MASTER);
  return mapUsuario(row);
};

const updateUserPassword = async (userId, novaSenha) => {
  const row = await new Parse.Query(Usuarios).get(userId, MASTER);
  row.setPassword(novaSenha);
  await row.save(null, MASTER);
};

const countReviewsByUserId = async (userId) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo(REVIEW_USER_FIELD, Usuarios.createWithoutData(userId));
  return q.count(MASTER);
};

const getRecentReviews = async (limit = 50) => {
  const q = new Parse.Query(Avaliacoes);
  q.descending("createdAt");
  q.limit(limit);
  q.include(REVIEW_USER_FIELD);
  const rows = await q.find(MASTER);
  return rows.map((r) => mapAvaliacao(r, true));
};

const getReviewsByUserId = async (userId) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo(REVIEW_USER_FIELD, Usuarios.createWithoutData(userId));
  q.descending("createdAt");
  const rows = await q.find(MASTER);
  return rows.map((r) => mapAvaliacao(r));
};

const getReviewsByMovieName = async (nome) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo("nome_filme", nome);
  q.descending("createdAt");
  q.include(REVIEW_USER_FIELD);
  q.limit(200);
  const rows = await q.find(MASTER);
  return rows.map((r) => mapAvaliacao(r, true));
};

const findFilmeByNome = async (nome) => {
  const q = new Parse.Query(Filmes);
  q.equalTo("titulo", nome);
  const row = await q.first(MASTER);
  return row ? mapFilme(row) : null;
};

const getAllFilmes = async () => {
  const q = new Parse.Query(Filmes);
  q.ascending("titulo");
  q.limit(500);
  const rows = await q.find(MASTER);
  return rows.map((r) => mapFilme(r));
};

const createFilme = async ({ nome, sinopse, categoria, idade, imagem, ano }) => {
  const existing = await findFilmeByNome(nome);
  if (existing) return existing;

  const row = new Filmes();
  row.set("titulo", normalize(nome));
  row.set("sinopse", sinopse || "");
  row.set("categoria", categoria || "Geral");
  row.set("classificacao", idade || "L");
  if (ano) row.set("ano", ano);
  if (imagem) row.set("fotoFilmeUrl", imagem);
  await row.save(null, MASTER);
  return mapFilme(row);
};

const deleteFilmeByNome = async (nome) => {
  const q = new Parse.Query(Filmes);
  q.equalTo("titulo", nome);
  const row = await q.first(MASTER);
  if (!row) return false;
  await row.destroy(MASTER);
  return true;
};

const updateFilmeImage = async (nome, imagemUrl) => {
  const q = new Parse.Query(Filmes);
  q.equalTo("titulo", nome);
  const row = await q.first(MASTER);
  if (!row) return null;
  row.set("fotoFilmeUrl", imagemUrl);
  await row.save(null, MASTER);
  return mapFilme(row);
};

const buildMovieStats = (filme, reviews) => {
  const notas = reviews.map((r) => Number(r.nota));
  const media = notas.length
    ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
    : 0;

  const distribuicao = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  notas.forEach((n) => {
    const bucket = Math.min(5, Math.max(1, Math.ceil(n / 2)));
    distribuicao[bucket]++;
  });

  const imagem =
    filme?.imagem ||
    reviews.find((r) => r.imagem)?.imagem ||
    PLACEHOLDER_POSTER;

  return {
    id_filme: filme?.id_filme || null,
    nome: filme?.nome || reviews[0]?.nome_filme,
    sinopse: filme?.sinopse || "Sinopse nao disponivel.",
    categoria: filme?.categoria || null,
    idade: filme?.idade || null,
    imagem,
    media,
    total_avaliacoes: reviews.length,
    distribuicao,
    nota_maxima: notas.length ? Math.max(...notas) : 0,
    nota_minima: notas.length ? Math.min(...notas) : 0,
  };
};

const getMovieDetail = async (nome) => {
  const [filme, reviews] = await Promise.all([
    findFilmeByNome(nome),
    getReviewsByMovieName(nome),
  ]);
  if (!filme && !reviews.length) return null;
  return {
    filme: buildMovieStats(filme || { nome }, reviews),
    avaliacoes: reviews,
  };
};

const getMoviesList = async () => {
  const [filmes, allReviews] = await Promise.all([
    getAllFilmes(),
    (async () => {
      const q = new Parse.Query(Avaliacoes);
      q.limit(3000);
      return q.find(MASTER);
    })(),
  ]);

  const filmeNames = new Set(filmes.map((filme) => filme.nome));
  const stats = {};
  for (const av of allReviews) {
    const nome = av.get("nome_filme");
    if (!nome || !filmeNames.has(nome)) continue;
    if (!stats[nome]) stats[nome] = [];
    stats[nome].push(Number(av.get("nota")));
  }

  const catalog = filmes.map((f) => ({
    ...f,
    imagem: f.imagem || PLACEHOLDER_POSTER,
    media: stats[f.nome]?.length
      ? Math.round(
          (stats[f.nome].reduce((a, b) => a + b, 0) / stats[f.nome].length) * 10,
        ) / 10
      : 0,
    total_avaliacoes: stats[f.nome]?.length || 0,
  }));

  return catalog.sort((a, b) => b.total_avaliacoes - a.total_avaliacoes);
};

const getPublicProfile = async (userId) => {
  const usuario = await findUserById(userId);
  if (!usuario) return null;
  const avaliacoes = await getReviewsByUserId(userId);
  const notas = avaliacoes.map((a) => Number(a.nota));
  const mediaNotas = notas.length
    ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
    : 0;

  return {
    ...usuario,
    totalAvaliacoes: avaliacoes.length,
    mediaNotas,
    avaliacoes,
  };
};

const createReview = async ({ userId, nome_filme, nota, comentario, imagem }) => {
  const row = new Avaliacoes();
  row.set(REVIEW_USER_FIELD, Usuarios.createWithoutData(userId));
  row.set("nome_filme", normalize(nome_filme));
  row.set("nota", Math.round(Number(nota)));
  row.set("comentario", normalize(comentario));
  if (imagem) row.set("imagem", imagem);
  await row.save(null, MASTER);
};

const findReviewById = async (id) => {
  try {
    const row = await new Parse.Query(Avaliacoes).get(id, MASTER);
    return mapAvaliacao(row, true);
  } catch {
    return null;
  }
};

const deleteReview = async (id) => {
  try {
    const row = await new Parse.Query(Avaliacoes).get(id, MASTER);
    await row.destroy(MASTER);
    return true;
  } catch {
    return false;
  }
};

const deleteReviewsByUserId = async (userId) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo(REVIEW_USER_FIELD, Usuarios.createWithoutData(userId));
  const rows = await q.find(MASTER);
  await Promise.all(rows.map((r) => r.destroy(MASTER)));
  return rows.length;
};

const uploadImage = async (file) => {
  const safeName = (file.originalname || "upload.jpg").replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
  const parseFile = new Parse.File(
    safeName,
    { base64: file.buffer.toString("base64") },
    file.mimetype,
  );
  await parseFile.save(MASTER);
  return parseFile.url();
};

module.exports = {
  verifyPassword,
  hashPassword,
  authenticateUser,
  findUserByLogin,
  findUserById,
  emailExists,
  nomeUsuarioExists,
  cpfExists,
  countUsers,
  createUser,
  updateUserProfile,
  updateUserPhoto,
  updateUserPassword,
  countReviewsByUserId,
  getRecentReviews,
  getReviewsByUserId,
  getReviewsByMovieName,
  findFilmeByNome,
  getAllFilmes,
  createFilme,
  getMovieDetail,
  getMoviesList,
  getPublicProfile,
  createReview,
  uploadImage,
  updateFilmeImage,
  findReviewById,
  deleteReview,
  deleteReviewsByUserId,
  deleteFilmeByNome,
};
