// Example config for Solana writer and signer
module.exports = {
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  PROGRAM_ID: 'YourProgramIdHere',
  PRIVATE_KEY_PATH: require('path').join(__dirname, '../data/private-key.pem'),
  BATCH_SIZE: 10
};
