const repo = require("../repositories/back4appRepository");

(async () => {
  try {
    console.log("📋 Testando getMoviesList()...\n");
    
    const list = await repo.getMoviesList();
    console.log(`Total de filmes: ${list.length}`);
    console.log(`Dados: ${JSON.stringify(list, null, 2)}`);
    
    console.log("\n📊 Testando getAllFilmes()...\n");
    const all = await repo.getAllFilmes();
    console.log(`Total: ${all.length}`);
    console.log(`Dados: ${JSON.stringify(all, null, 2)}`);
    
  } catch (err) {
    console.error("❌ Erro:", err.message);
    console.error(err.stack);
  }
})();
