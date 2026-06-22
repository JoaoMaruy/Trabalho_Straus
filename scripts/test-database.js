/**
 * Diagnostico do banco Back4App (Parse) usado pelo site.
 * Uso: node scripts/test-database.js
 */
require("dotenv").config();

const Parse = require("parse/node");
const config = require("../config/database");
const repository = require("../repositories/back4appRepository");

Parse.initialize(config.appId, config.jsKey, config.masterKey);
Parse.serverURL = config.serverURL;

const MASTER = { useMasterKey: true };
const Usuarios = Parse.Object.extend("usuarios");
const Filmes = Parse.Object.extend("Filme");
const Avaliacoes = Parse.Object.extend("avaliacoes");

const section = (title) => {
  console.log(`\n${"=".repeat(50)}\n${title}\n${"=".repeat(50)}`);
};

const run = async () => {
  section("1. CONFIGURACAO");
  console.log("Server URL:", config.serverURL);
  console.log("App ID:", `${config.appId?.slice(0, 8)}...`);

  section("2. CONEXAO COM BACK4APP");
  try {
    await new Parse.Query(Usuarios).limit(1).find(MASTER);
    console.log("OK: Parse respondeu com sucesso.");
  } catch (err) {
    console.error("Falha na conexao:", err.message);
    process.exit(1);
  }

  section("3. CONTAGEM DE REGISTROS");
  const [totalUsuarios, totalFilmes, totalAvaliacoes] = await Promise.all([
    new Parse.Query(Usuarios).count(MASTER),
    new Parse.Query(Filmes).count(MASTER),
    new Parse.Query(Avaliacoes).count(MASTER),
  ]);
  console.log(`Usuarios cadastrados:  ${totalUsuarios}`);
  console.log(`Filmes cadastrados:    ${totalFilmes}`);
  console.log(`Avaliacoes registradas:${totalAvaliacoes}`);

  section("4. USUARIOS (ate 10)");
  const users = await new Parse.Query(Usuarios)
    .limit(10)
    .ascending("createdAt")
    .find(MASTER);

  if (users.length === 0) {
    console.log("(nenhum usuario encontrado - rode: npm run seed:back4app)");
  } else {
    users.forEach((u, i) => {
      console.log(
        `  ${i + 1}. [${u.id}] ${u.get("nomeUsuario")} <${u.get("email")}>`,
      );
    });
  }

  section("5. AVALIACOES RECENTES (ate 10)");
  const reviews = await repository.getRecentReviews(10);
  if (reviews.length === 0) {
    console.log("(nenhuma avaliacao encontrada)");
  } else {
    reviews.forEach((r, i) => {
      console.log(`  ${i + 1}. "${r.nome_filme}" - nota ${r.nota}/10`);
      console.log(`     Autor: ${r.nomeUsuario || r.nomeCompleto || "sem autor"}`);
      console.log(`     Comentario: ${String(r.comentario || "").slice(0, 80)}`);
    });
  }

  section("6. TESTE DE LOGIN VIA REPOSITORIO");
  const admin = await repository.findUserByLogin("admin");
  if (admin) {
    console.log(`Usuario admin encontrado: ${admin.nomeCompleto} [${admin.id_usuario}]`);
  } else {
    console.log("Usuario admin nao encontrado.");
  }

  section("RESUMO");
  console.log("Banco: Back4App (Parse) - diagnostico concluido.");
};

run().catch((err) => {
  console.error("\nErro fatal:", err);
  process.exit(1);
});
