const Parse = require("parse/node");
const config = require("../config/database");

const { appId, jsKey, masterKey, serverURL } = config;

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

const MASTER = { useMasterKey: true };

(async () => {
  try {
    console.log("🎬 Testando tabela FILME...\n");
    
    const Filmes = Parse.Object.extend("Filme");
    const q = new Parse.Query(Filmes);
    q.limit(100);
    const filmes = await q.find(MASTER);
    
    console.log(`Total de filmes: ${filmes.length}\n`);
    
    filmes.forEach((f, i) => {
      console.log(`${i + 1}. Filme ID: ${f.id}`);
      console.log(`   - Atributos disponíveis:`, Object.keys(f.attributes));
      console.log(`   - Dados: ${JSON.stringify(f.toJSON(), null, 2)}`);
      console.log();
    });
  } catch (err) {
    console.error("❌ Erro:", err.message);
  }
})();
