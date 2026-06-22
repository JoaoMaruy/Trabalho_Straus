const Parse = require("parse/node");
const config = require("../config/database");

const { appId, jsKey, masterKey, serverURL } = config;

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

const MASTER = { useMasterKey: true };

(async () => {
  try {
    console.log("👤 Testando tabela _User...\n");
    
    const User = Parse.Object.extend("_User");
    const q = new Parse.Query(User);
    q.limit(3);
    const usuarios = await q.find(MASTER);
    
    console.log(`Total de usuários em _User: ${usuarios.length}\n`);
    
    usuarios.forEach((u, i) => {
      console.log(`${i + 1}. User ID: ${u.id}`);
      console.log(`   - Atributos:`, Object.keys(u.attributes));
      console.log(`   - Dados: ${JSON.stringify(u.toJSON(), null, 2)}`);
      console.log();
    });
  } catch (err) {
    console.error("❌ Erro:", err.message);
  }
})();
