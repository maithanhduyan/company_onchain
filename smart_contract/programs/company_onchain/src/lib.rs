// programs/company_onchain/lib.rs

use anchor_lang::prelude::*;
mod state;

use state::*;

declare_id!("5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH"); // Thay bằng ProgramID thực tế khi deploy

#[program]
pub mod company_onchain {
    use super::*;

    pub fn record_entry(
        ctx: Context<RecordEntry>,
        entry_id: String,
        debit: String,
        credit: String,
        amount: u64,
        currency: String,
        timestamp: i64,
    ) -> Result<()> {
        let entry = &mut ctx.accounts.entry;
        entry.entry_id = entry_id;
        entry.debit = debit;
        entry.credit = credit;
        entry.amount = amount;
        entry.currency = currency;
        entry.timestamp = timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RecordEntry<'info> {
    #[account(init, payer = user, space = 8 + Entry::MAX_SIZE)]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
