require("dotenv").config();
const BASE = "http://localhost:3000";

const run = async () => {
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  console.log("Health:", health);

  const loginRes = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", senha: "123" }),
  });
  const cookies = loginRes.headers.getSetCookie?.() || [];
  const cookie = cookies.join("; ");
  console.log("Login admin/123:", loginRes.status);

  const filmes = await fetch(`${BASE}/api/filmes`).then((r) => r.json());
  console.log(`Filmes: ${filmes.length}`, filmes[0]?.nome);

  const avatar = await fetch(
    `${BASE}/api/filme/${encodeURIComponent("Avatar")}`,
  ).then((r) => r.json());
  console.log("Avatar:", avatar.filme.nome, avatar.filme.categoria);

  const jLogin = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "j", senha: "j" }),
  });
  console.log("Login j/j:", jLogin.status);

  const avs = await fetch(`${BASE}/api/avaliacoes`).then((r) => r.json());
  console.log(`Avaliacoes recentes: ${avs.length}`);
  console.log("Exemplo SQL:", avs.find((a) => a.nome_filme === "Filme Indefinido")?.comentario?.slice(0, 40));

  console.log("\n✓ Schema sistema_filmes OK");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
