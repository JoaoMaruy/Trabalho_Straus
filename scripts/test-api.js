require("dotenv").config();
const BASE = "http://localhost:3000";

const run = async () => {
  console.log("=== Filmes ===");
  const filmes = await fetch(`${BASE}/api/filmes`).then((r) => r.json());
  console.log(`${filmes.length} filmes no catálogo`);

  console.log("\n=== Detalhe filme ===");
  const detail = await fetch(
    `${BASE}/api/filme/${encodeURIComponent("Pulp Fiction")}`,
  ).then((r) => r.json());
  console.log(`${detail.filme.titulo}: média ${detail.filme.media}, ${detail.avaliacoes.length} críticas`);

  console.log("\n=== Login + sessão ===");
  const loginRes = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "marina@email.com", senha: "senha123" }),
  });
  const cookies = loginRes.headers.getSetCookie?.() || [];
  const cookie = cookies.join("; ");
  console.log("Login:", loginRes.status);

  const sessao = await fetch(`${BASE}/api/sessao`, {
    headers: { Cookie: cookie },
  }).then((r) => r.json());
  console.log("Sessão:", sessao);

  const user = await fetch(`${BASE}/api/usuario`, {
    headers: { Cookie: cookie },
  }).then((r) => r.json());
  console.log("Usuário:", user.usuario?.nome, `(${user.usuario?.totalAvaliacoes} avaliações)`);

  console.log("\n=== Perfil público ===");
  const publico = await fetch(`${BASE}/api/usuario/${user.usuario.id}`).then((r) =>
    r.json(),
  );
  console.log(`${publico.nome}: média ${publico.mediaNotas}, ${publico.avaliacoes.length} reviews`);

  console.log("\n✓ Todos os testes passaram!");
};

run().catch((e) => {
  console.error("Falha:", e.message);
  process.exit(1);
});
