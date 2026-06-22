const Parse = require("parse/node");
const config = require("../config/database");

const { appId, jsKey, masterKey, serverURL } = config;

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

const MASTER = { useMasterKey: true };

(async () => {
  try {
    console.log("🔑 Atualizando senha do Admin...\n");
    
    const User = Parse.Object.extend("_User");
    const q = new Parse.Query(User);
    q.equalTo("username", "Admin");
    const admin = await q.first(MASTER);
    
    if (!admin) {
      console.log("❌ Admin não encontrado");
      return;
    }
    
    console.log(`Usuário encontrado: ${admin.get("username")}`);
    admin.setPassword("123");
    await admin.save(null, MASTER);
    
    console.log("✓ Senha atualizada para '123'");
    
  } catch (err) {
    console.error("❌ Erro:", err.message);
  }
})();
