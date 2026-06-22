const repo = require("../repositories/back4appRepository");

(async () => {
  try {
    console.log("🔐 Testando autenticação...\n");
    
    // Testes de autenticação
    const testes = [
      { username: "admin", password: "123" },
      { username: "Admin", password: "123" },
      { username: "Cj", password: "123" },
      { username: "cj@email.com", password: "123" },
    ];
    
    for (const teste of testes) {
      console.log(`📝 Tentando: ${teste.username} / ${teste.password}`);
      try {
        const result = await repo.authenticateUser(teste.username, teste.password);
        if (result) {
          console.log(`✓ Sucesso! User ID: ${result.id}`);
        } else {
          console.log(`✗ Falhou (retornou null)`);
        }
      } catch (err) {
        console.log(`✗ Erro: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error("❌ Erro geral:", err.message);
  }
})();
