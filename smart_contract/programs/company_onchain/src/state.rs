// programs/company_onchain/state.rs

use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Entry {
    pub entry_id: String,
    pub debit: String,
    pub credit: String,
    pub amount: u64,
    pub currency: String,
    pub timestamp: i64,
}

impl Entry {
    // 4 bytes cho length prefix + 64 bytes cho nội dung mỗi String (entry_id, debit, credit, currency)
    // 8 bytes cho amount (u64), 8 bytes cho timestamp (i64)
    pub const MAX_SIZE: usize = 4 + 64 + 4 + 64 + 4 + 64 + 8 + 4 + 64 + 8;
}
