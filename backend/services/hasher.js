const crypto = require('crypto');

function hashEntry(entry) {
  const str = JSON.stringify(entry);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Merkle root (simple, for array of entries)
function merkleRoot(entries) {
  if (entries.length === 0) return null;
  let hashes = entries.map(hashEntry);
  while (hashes.length > 1) {
    let temp = [];
    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        temp.push(hashEntry(hashes[i] + hashes[i + 1]));
      } else {
        temp.push(hashes[i]);
      }
    }
    hashes = temp;
  }
  return hashes[0];
}

module.exports = { hashEntry, merkleRoot };
