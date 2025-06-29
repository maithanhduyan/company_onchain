function serializeEntry(entry) {
  return {
    entry_id: entry.entry_id,
    debit: entry.account_debit,
    credit: entry.account_credit,
    amount: parseFloat(entry.amount),
    currency: entry.currency,
    timestamp: new Date(entry.timestamp).toISOString()
  };
}

module.exports = { serializeEntry };
