/**
 * Diagnóstico do banco Back4App (Parse).
 * Uso: node scripts/test-database.js
 */
require("dotenv").config();

const Parse = require("parse/node");
const config = require("../config/database");
const repository = require("../repositories/back4appRepository");

Parse.initialize(config.appId, config.jsKey, config.masterKey);
Parse.serverURL = config.serverURL;

const MASTER = { useMasterKey: true };
const Usuario = Parse.Object.extend("Usuario");
const Avaliacao = Parse.Object.extend("Avaliacao");

const section = (title) => console.log(`\n${"=".repeat(50)}\n${title}\n${"=".repeat(50)}`);

const run = async () => {
  section("1. CONFIGURAÇÃO");
  console.log("Server URL:", config.serverURL);
  console.log("App ID:", config.appId?.slice(0, 8) + "...");

  section("2. CONEXÃO COM BACK4APP");
  try {
    const ping = new Parse.Query(Usuario);
    await ping.limit(1).find(MASTER);
    console.log("✓ Conexão OK — Parse respondeu com sucesso.");
  } catch (err) {
    console.error("✗ Falha na conexão:", err.message);
    process.exit(1);
  }

  section("3. CONTAGEM DE REGISTROS");
  const userQuery = new Parse.Query(Usuario);
  const reviewQuery = new Parse.Query(Avaliacao);
  const [totalUsuarios, totalAvaliacoes] = await Promise.all([
    userQuery.count(MASTER),
    reviewQuery.count(MASTER),
  ]);
  console.log(`Usuários cadastrados:  ${totalUsuarios}`);
  console.log(`Avaliações registradas: ${totalAvaliacoes}`);

  section("4. USUÁRIOS (até 10)");
  const users = await new Parse.Query(Usuario)
    .limit(10)
    .ascending("createdAt")
    .find(MASTER);

  if (users.length === 0) {
    console.log("(nenhum usuário encontrado — rode: npm run seed:back4app)");
  } else {
    users.forEach((u, i) => {
      console.log(
        `  ${i + 1}. [${u.id}] ${u.get("nome")} <${u.get("email")}> — criado em ${u.get("createdAt")?.toISOString()}`,
      );
    });
  }

  section("5. AVALIAÇÕES / FILMES (até 10, com autor)");
  const reviews = await repository.getRecentReviews(10);

  if (reviews.length === 0) {
    console.log("(nenhuma avaliação encontrada)");
  } else {
    reviews.forEach((r, i) => {
      console.log(`  ${i + 1}. "${r.titulo_filme}" — nota ${r.nota}/10`);
      console.log(`     Autor: ${r.nome} | ID: ${r.id}`);
      console.log(`     Comentário: ${r.comentario?.slice(0, 80)}${r.comentario?.length > 80 ? "..." : ""}`);
      if (r.imagem) console.log(`     Imagem: ${r.imagem}`);
      console.log(`     Criado em: ${r.criado_em}`);
    });
  }

  section("6. FILMES ÚNICOS (agrupados por título)");
  const allReviews = await new Parse.Query(Avaliacao)
    .limit(1000)
    .find(MASTER);

  const filmesMap = {};
  for (const av of allReviews) {
    const titulo = av.get("titulo_filme");
    if (!titulo) continue;
    if (!filmesMap[titulo]) filmesMap[titulo] = { count: 0, notas: [] };
    filmesMap[titulo].count++;
    filmesMap[titulo].notas.push(av.get("nota"));
  }

  const filmes = Object.entries(filmesMap)
    .map(([titulo, data]) => ({
      titulo,
      avaliacoes: data.count,
      media:
        Math.round((data.notas.reduce((a, b) => a + b, 0) / data.notas.length) * 10) /
        10,
    }))
    .sort((a, b) => b.avaliacoes - a.avaliacoes);

  if (filmes.length === 0) {
    console.log("(nenhum filme avaliado ainda)");
  } else {
    filmes.forEach((f, i) => {
      console.log(`  ${i + 1}. "${f.titulo}" — ${f.avaliacoes} avaliação(ões), média ${f.media}`);
    });
  }

  section("7. TESTE VIA REPOSITÓRIO (findUserByEmail)");
  const admin = await repository.findUserByEmail("admin@cine.review");
  if (admin) {
    console.log(`✓ Usuário admin encontrado: ${admin.nome} [${admin.id}]`);
    const doAdmin = await repository.getReviewsByUserId(admin.id);
    console.log(`  Avaliações do admin: ${doAdmin.length}`);
  } else {
    console.log("— Usuário admin@cine.review não existe (seed não executado).");
  }

  section("RESUMO");
  console.log(`Banco: Back4App (Parse) — FUNCIONANDO`);
  console.log(`Total: ${totalUsuarios} usuário(s), ${totalAvaliacoes} avaliação(ões), ${filmes.length} filme(s) distinto(s)`);
};

run().catch((err) => {
  console.error("\nErro fatal:", err);
  process.exit(1);
});
