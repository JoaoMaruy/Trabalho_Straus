const repo = require("../repositories/back4appRepository");

(async () => {
  try {
    console.log("🔐 Testando fluxo de login completo...\n");
    
    const login = "admin";
    const senha = "123";
    
    console.log(`1️⃣ Buscando usuário "${login}"...`);
    const usuario = await repo.findUserByLogin(login);
    console.log(`   Resultado: ${usuario ? `✓ Encontrado (${usuario.nomeUsuario})` : "❌ Não encontrado"}`);
    
    if (!usuario) {
      console.log("   Abortando.");
      return;
    }
    
    console.log(`\n2️⃣ Autenticando com username "${usuario.nomeUsuario}" / "${senha}"...`);
    const parseUser = await repo.authenticateUser(usuario.nomeUsuario, senha);
    console.log(`   Resultado: ${parseUser ? `✓ Sucesso (ID: ${parseUser.id})` : "❌ Falhou"}`);
    
    if (!parseUser) {
      console.log("   Abortando.");
      return;
    }
    
    console.log(`\n✅ Fluxo completo funcionou!`);
    
  } catch (err) {
    console.error("❌ Erro:", err.message);
    console.error(err.stack);
  }
})();
