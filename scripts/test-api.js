require("dotenv").config();
const BASE = "http://localhost:3000";

const run = async () => {
  console.log("=== Health ===");
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  console.log("Health:", health.status || JSON.stringify(health));

  console.log("\n=== Filmes ===");
  const filmes = await fetch(`${BASE}/api/filmes`).then((r) => r.json());
  console.log(`${filmes.length} filmes no catálogo`);

  console.log("\n=== Detalhe filme ===");
  const detail = await fetch(
    `${BASE}/api/filme/${encodeURIComponent("Pulp Fiction")}`,
  ).then((r) => r.json());
  console.log(`${detail.filme.nome}: média ${detail.filme.media}, ${detail.avaliacoes.length} críticas`);

  console.log("\n=== Login (teste admin) ===");
  const loginRes = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", senha: "123" }),
  });
  const loginJson = await loginRes.json().catch(() => null);
  console.log("Login status:", loginRes.status, "response:", loginJson);

  if (loginJson && loginJson.usuario && loginJson.usuario.id_usuario) {
    const userId = loginJson.usuario.id_usuario;
    console.log("\n=== Perfil público ===");
    const publico = await fetch(`${BASE}/api/usuario/${userId}`).then((r) => r.json());
    console.log(`${publico.nomeCompleto || publico.nome}: média ${publico.mediaNotas || 0}, ${publico.avaliacoes?.length || 0} reviews`);
  }

  console.log("\n✓ Testes básicos executados (verifique logs acima).");
};

run().catch((e) => {
  console.error("Falha:", e.message);
  process.exit(1);
});
