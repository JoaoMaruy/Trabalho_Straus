const Parse = require("parse/node");
const bcrypt = require("bcryptjs");
const config = require("../config/database");

const { appId, jsKey, masterKey, serverURL } = config;

if (!appId || !jsKey || !masterKey) {
  throw new Error(
    "Back4App não configurado. Defina BACK4APP_APP_ID, BACK4APP_JS_KEY e BACK4APP_MASTER_KEY no .env",
  );
}

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

const MASTER = { useMasterKey: true };

const Usuarios = Parse.Object.extend("usuarios");
const Filmes = Parse.Object.extend("filmes");
const Avaliacoes = Parse.Object.extend("avaliacoes");

const PLACEHOLDER_POSTER =
  "https://placehold.co/360x540/111827/ffffff?text=Sem+Capa";

const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
};

const hashPassword = (plain) => bcrypt.hash(plain, 10);

const mapUsuario = (row, { includeSenha = false } = {}) => {
  const data = {
    id_usuario: row.id,
    nomeCompleto: row.get("nomeCompleto"),
    nomeUsuario: row.get("nomeUsuario"),
    email: row.get("email"),
    cpf: row.get("cpf"),
    foto_perfil: row.get("foto_perfil") || null,
    criado_em: row.get("createdAt"),
  };
  if (includeSenha) data.senha = row.get("senha");
  return data;
};

const mapFilme = (row, extras = {}) => ({
  id_filme: row.id,
  nome: row.get("nome"),
  sinopse: row.get("sinopse"),
  categoria: row.get("categoria"),
  idade: row.get("idade"),
  imagem: row.get("imagem") || null,
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

  const usuarioPtr = row.get("id_usuario");
  if (usuarioPtr) {
    data.id_usuario = usuarioPtr.id || usuarioPtr.objectId;
    if (includeAuthor && usuarioPtr.get) {
      data.nomeCompleto = usuarioPtr.get("nomeCompleto") || "Anônimo";
      data.nomeUsuario = usuarioPtr.get("nomeUsuario");
      data.usuario_foto = usuarioPtr.get("foto_perfil") || null;
    }
  }

  return data;
};

const findUserByLogin = async (login) => {
  const value = login.trim();
  const byEmail = new Parse.Query(Usuarios);
  byEmail.equalTo("email", value.toLowerCase());

  const byUser = new Parse.Query(Usuarios);
  byUser.equalTo("nomeUsuario", value);

  const result = await Parse.Query.or(byEmail, byUser).first(MASTER);
  if (!result) return null;
  return mapUsuario(result, { includeSenha: true });
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
  q.equalTo("email", email.toLowerCase().trim());
  if (excludeId) q.notEqualTo("objectId", excludeId);
  return (await q.count(MASTER)) > 0;
};

const nomeUsuarioExists = async (nomeUsuario, excludeId = null) => {
  const q = new Parse.Query(Usuarios);
  q.equalTo("nomeUsuario", nomeUsuario.trim());
  if (excludeId) q.notEqualTo("objectId", excludeId);
  return (await q.count(MASTER)) > 0;
};

const cpfExists = async (cpf, excludeId = null) => {
  const q = new Parse.Query(Usuarios);
  q.equalTo("cpf", cpf.replace(/\D/g, ""));
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
  const row = new Usuarios();
  row.set("nomeCompleto", nomeCompleto.trim());
  row.set("nomeUsuario", nomeUsuario.trim());
  row.set("email", email.toLowerCase().trim());
  row.set("senha", senha);
  row.set("cpf", cpf.replace(/\D/g, ""));
  if (foto_perfil) row.set("foto_perfil", foto_perfil);
  await row.save(null, MASTER);
  return { id_usuario: row.id };
};

const updateUserProfile = async (
  userId,
  { nomeCompleto, nomeUsuario, email, cpf },
) => {
  const row = await new Parse.Query(Usuarios).get(userId, MASTER);
  if (nomeCompleto) row.set("nomeCompleto", nomeCompleto.trim());
  if (nomeUsuario) row.set("nomeUsuario", nomeUsuario.trim());
  if (email) row.set("email", email.toLowerCase().trim());
  if (cpf) row.set("cpf", cpf.replace(/\D/g, ""));
  await row.save(null, MASTER);
  return mapUsuario(row);
};

const updateUserPhoto = async (userId, fotoUrl) => {
  const row = await new Parse.Query(Usuarios).get(userId, MASTER);
  row.set("foto_perfil", fotoUrl);
  await row.save(null, MASTER);
  return mapUsuario(row);
};

const updateUserPassword = async (userId, senhaHash) => {
  const row = await new Parse.Query(Usuarios).get(userId, MASTER);
  row.set("senha", senhaHash);
  await row.save(null, MASTER);
};

const countReviewsByUserId = async (userId) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo("id_usuario", Usuarios.createWithoutData(userId));
  return q.count(MASTER);
};

const getRecentReviews = async (limit = 50) => {
  const q = new Parse.Query(Avaliacoes);
  q.descending("createdAt");
  q.limit(limit);
  q.include("id_usuario");
  const rows = await q.find(MASTER);
  return rows.map((r) => mapAvaliacao(r, true));
};

const getReviewsByUserId = async (userId) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo("id_usuario", Usuarios.createWithoutData(userId));
  q.descending("createdAt");
  const rows = await q.find(MASTER);
  return rows.map((r) => mapAvaliacao(r));
};

const getReviewsByMovieName = async (nome) => {
  const q = new Parse.Query(Avaliacoes);
  q.equalTo("nome_filme", nome);
  q.descending("createdAt");
  q.include("id_usuario");
  q.limit(200);
  const rows = await q.find(MASTER);
  return rows.map((r) => mapAvaliacao(r, true));
};

const findFilmeByNome = async (nome) => {
  const q = new Parse.Query(Filmes);
  q.equalTo("nome", nome);
  const row = await q.first(MASTER);
  return row ? mapFilme(row) : null;
};

const getAllFilmes = async () => {
  const q = new Parse.Query(Filmes);
  q.ascending("nome");
  q.limit(500);
  const rows = await q.find(MASTER);
  return rows.map((r) => mapFilme(r));
};

const createFilme = async ({ nome, sinopse, categoria, idade, imagem }) => {
  const existing = await findFilmeByNome(nome);
  if (existing) return existing;

  const row = new Filmes();
  row.set("nome", nome.trim());
  row.set("sinopse", sinopse || "");
  row.set("categoria", categoria || "Geral");
  row.set("idade", idade || "L");
  if (imagem) row.set("imagem", imagem);
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
    sinopse: filme?.sinopse || "Sinopse não disponível.",
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

  const stats = {};
  for (const av of allReviews) {
    const nome = av.get("nome_filme");
    if (!nome) continue;
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

  for (const [nome, notas] of Object.entries(stats)) {
    if (catalog.some((f) => f.nome === nome)) continue;
    catalog.push({
      id_filme: null,
      nome,
      sinopse: null,
      categoria: null,
      idade: null,
      imagem: PLACEHOLDER_POSTER,
      media:
        Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10,
      total_avaliacoes: notas.length,
    });
  }

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
  row.set("id_usuario", Usuarios.createWithoutData(userId));
  row.set("nome_filme", nome_filme.trim());
  row.set("nota", Math.round(Number(nota)));
  row.set("comentario", comentario.trim());
  if (imagem) row.set("imagem", imagem);
  await row.save(null, MASTER);
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
};
