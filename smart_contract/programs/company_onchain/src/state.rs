// programs/company_onchain/state.rs

use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Entry {
    pub entry_id: String,      // Max 32 chars
    pub debit: String,         // Max 16 chars (account code)
    pub credit: String,        // Max 16 chars (account code)
    pub amount: u64,           // Amount in smallest unit
    pub currency: String,      // Max 8 chars (USD, VND, etc.)
    pub timestamp: i64,        // Unix timestamp
    pub creator: Pubkey,       // Who created this entry
}

impl Entry {
    // 4 + 32 (entry_id) + 4 + 16 (debit) + 4 + 16 (credit) + 8 (amount) + 4 + 8 (currency) + 8 (timestamp) + 32 (creator)
    pub const MAX_SIZE: usize = 4 + 32 + 4 + 16 + 4 + 16 + 8 + 4 + 8 + 8 + 32;
}

#[account]
#[derive(Default, Debug)]
pub struct CompanyLedger {
    pub authority: Pubkey,
    pub entry_count: u64,
    pub total_entries: u64,
}

impl CompanyLedger {
    pub const MAX_SIZE: usize = 32 + 8 + 8;
}
