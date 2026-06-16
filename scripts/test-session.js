const BASE = "http://localhost:3000";

const run = async () => {
  const loginRes = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@cine.review", senha: "admin123" }),
  });
  const cookies = loginRes.headers.getSetCookie?.() || [];
  const cookie = cookies.join("; ");
  console.log("Login:", loginRes.status, "cookies:", cookies.length);

  const usuario = await fetch(`${BASE}/api/usuario`, {
    headers: { Cookie: cookie },
  });
  console.log("API usuario:", usuario.status, await usuario.json());

  const perfil = await fetch(`${BASE}/perfil.html`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  console.log("GET perfil.html:", perfil.status, perfil.headers.get("location") || "OK");
};

run().catch(console.error);
