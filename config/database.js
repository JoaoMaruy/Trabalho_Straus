require("dotenv").config();

module.exports = {
  appId: process.env.BACK4APP_APP_ID || "lLR2VMbmrO3GSbV7mikrOGuMygO4ezzbOuzdT9m9",
  jsKey: process.env.BACK4APP_JS_KEY || "hXbunPvrfmyEm42wzk87kqZ5c6egDili946d0iUw",
  masterKey: process.env.BACK4APP_MASTER_KEY || "ytA50pNiaFPO8R1BOnBPNUZPZIdf9ZAUslEGwg6o",
  serverURL:
    process.env.BACK4APP_SERVER_URL || "https://parseapi.back4app.com",
};
