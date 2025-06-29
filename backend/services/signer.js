const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load private key from config (PEM format)
function loadPrivateKey() {
  const config = require('./config');
  return fs.readFileSync(config.PRIVATE_KEY_PATH, 'utf8');
}

function signData(data) {
  const privateKey = loadPrivateKey();
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(data));
  sign.end();
  return sign.sign(privateKey, 'hex');
}

module.exports = { signData };
