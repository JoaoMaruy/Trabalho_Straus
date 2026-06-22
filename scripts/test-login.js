const repo = require("../repositories/back4appRepository");

(async () => {
  try {
    console.log("🔐 Testando findUserByLogin()...\n");
    
    // Tentar buscar por diferentes valores
    const testes = ["admin", "Admin", "Cj", "cj@email.com"];
    
    for (const teste of testes) {
      console.log(`\n📝 Buscando: "${teste}"`);
      const usuario = await repo.findUserByLogin(teste);
      if (usuario) {
        console.log(`✓ Encontrado: ${usuario.nomeUsuario} (${usuario.email})`);
      } else {
        console.log(`✗ Não encontrado`);
      }
    }
    
  } catch (err) {
    console.error("❌ Erro:", err.message);
    console.error(err.stack);
  }
})();
