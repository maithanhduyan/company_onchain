function batchEntries(entries, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < entries.length; i += batchSize) {
    batches.push(entries.slice(i, i + batchSize));
  }
  return batches;
}

module.exports = { batchEntries };
