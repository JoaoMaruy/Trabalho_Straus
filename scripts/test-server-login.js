const repo = require("../repositories/back4appRepository");

async function testLogin(login, senha) {
  try {
    console.log(`\n[TEST] Testando login: ${login} / ${senha}`);
    
    const identificador = login?.trim();
    if (!identificador || !senha) {
      console.log(`[TEST] ❌ Campos vazios`);
      return { error: "Usuário/e-mail e senha são obrigatórios." };
    }

    console.log(`[TEST] 1️⃣ Buscando usuário...`);
    const usuario = await repo.findUserByLogin(identificador);
    if (!usuario) {
      console.log(`[TEST] ❌ Usuário não encontrado`);
      return { error: "Usuário ou senha inválidos." };
    }
    console.log(`[TEST] ✓ Usuário encontrado: ${usuario.nomeUsuario} (ID: ${usuario.id_usuario})`);

    console.log(`[TEST] 2️⃣ Autenticando com Parse...`);
    const parseUser = await repo.authenticateUser(usuario.nomeUsuario, senha);
    if (!parseUser) {
      console.log(`[TEST] ❌ Autenticação Parse falhou`);
      return { error: "Usuário ou senha inválidos." };
    }
    console.log(`[TEST] ✓ Parse OK (ID: ${parseUser.id})`);

    console.log(`[TEST] ✅ Login bem-sucedido!`);
    return {
      success: true,
      usuario: {
        id_usuario: usuario.id_usuario,
        nomeCompleto: usuario.nomeCompleto,
        nomeUsuario: usuario.nomeUsuario,
      },
    };
  } catch (error) {
    console.error(`[TEST] 💥 Erro:`, error.message);
    return { error: "Falha ao autenticar." };
  }
}

// Testar
(async () => {
  const result = await testLogin("admin", "123");
  console.log("\n[RESULT]", JSON.stringify(result, null, 2));
})();
