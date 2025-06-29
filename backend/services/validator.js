function validateEntry(entry) {
  if (!entry.entry_id || !entry.account_debit || !entry.account_credit) return false;
  if (isNaN(parseFloat(entry.amount))) return false;
  // Double entry rule: debit != credit
  if (entry.account_debit === entry.account_credit) return false;
  // Add more rules as needed
  return true;
}

module.exports = { validateEntry };
