use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Entry ID cannot be empty")]
    EntryIdEmpty,
    #[msg("Entry ID too long (max 32 characters)")]
    EntryIdTooLong,
    #[msg("Account code too long (max 16 characters)")]
    AccountCodeTooLong,
    #[msg("Currency code too long (max 8 characters)")]
    CurrencyCodeTooLong,
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Debit and credit accounts cannot be the same")]
    SameDebitCredit,
    #[msg("Unauthorized to update this entry")]
    UnauthorizedUpdate,
    #[msg("Entry with this ID already exists")]
    DuplicateEntryId,
    #[msg("Too many entries in batch (max 10)")]
    TooManyEntries,
    #[msg("Batch cannot be empty")]
    EmptyBatch,
    // --- EXTENDED ERRORS ---
    #[msg("Ledger is frozen")]
    LedgerFrozen,
    #[msg("Insufficient permissions")]
    InsufficientPermissions,
    #[msg("Invalid account code format")]
    InvalidAccountCode,
    #[msg("Currency not supported")]
    UnsupportedCurrency,
    #[msg("Entry locked for audit")]
    EntryLocked,
    #[msg("Page size too large")]
    PageSizeTooLarge,
    #[msg("Account code empty")]
    AccountCodeEmpty,
}
