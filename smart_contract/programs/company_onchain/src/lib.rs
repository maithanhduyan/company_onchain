// programs/company_onchain/lib.rs

use anchor_lang::prelude::*;
mod state;
mod errors;

use state::*;
use errors::*;

declare_id!("5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH");

#[program]
pub mod company_onchain {
    use super::*;

    pub fn initialize_ledger(ctx: Context<InitializeLedger>) -> Result<()> {
        let ledger = &mut ctx.accounts.ledger;
        ledger.authority = ctx.accounts.authority.key();
        ledger.entry_count = 0;
        ledger.total_entries = 0;
        Ok(())
    }

    pub fn record_entry(
        ctx: Context<RecordEntry>,
        entry_id: String,
        debit: String,
        credit: String,
        amount: u64,
        currency: String,
    ) -> Result<()> {
        require!(entry_id.len() <= 32, CustomError::EntryIdTooLong);
        require!(entry_id.len() > 0, CustomError::EntryIdEmpty);
        require!(debit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(credit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(amount > 0, CustomError::InvalidAmount);
        require!(currency.len() <= 8, CustomError::CurrencyCodeTooLong);
        require!(debit != credit, CustomError::SameDebitCredit);

        let entry = &mut ctx.accounts.entry;
        let ledger = &mut ctx.accounts.ledger;
        let clock = Clock::get()?;

        entry.entry_id = entry_id;
        entry.debit = debit;
        entry.credit = credit;
        entry.amount = amount;
        entry.currency = currency;
        entry.timestamp = clock.unix_timestamp;
        entry.creator = ctx.accounts.user.key();

        ledger.entry_count += 1;
        ledger.total_entries += 1;

        emit!(EntryRecorded {
            entry_id: entry.entry_id.clone(),
            debit: entry.debit.clone(),
            credit: entry.credit.clone(),
            amount: entry.amount,
            currency: entry.currency.clone(),
            timestamp: entry.timestamp,
            creator: entry.creator,
        });

        Ok(())
    }

    pub fn update_entry(
        ctx: Context<UpdateEntry>,
        new_debit: String,
        new_credit: String,
        new_amount: u64,
        new_currency: String,
    ) -> Result<()> {
        let entry = &mut ctx.accounts.entry;
        require!(
            ctx.accounts.user.key() == entry.creator || 
            ctx.accounts.user.key() == ctx.accounts.ledger.authority,
            CustomError::UnauthorizedUpdate
        );
        require!(new_debit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(new_credit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(new_amount > 0, CustomError::InvalidAmount);
        require!(new_currency.len() <= 8, CustomError::CurrencyCodeTooLong);
        require!(new_debit != new_credit, CustomError::SameDebitCredit);

        entry.debit = new_debit;
        entry.credit = new_credit;
        entry.amount = new_amount;
        entry.currency = new_currency;
        let clock = Clock::get()?;
        entry.timestamp = clock.unix_timestamp;
        Ok(())
    }

    // Get entry by ID (view function)
    pub fn get_entry(
        _ctx: Context<GetEntry>,
        _entry_id: String, // Used for PDA derivation
    ) -> Result<()> {
        // Anchor không hỗ trợ trả về dữ liệu, client fetch account entry qua PDA
        Ok(())
    }

    // Delete entry (only creator or authority)
    pub fn delete_entry(
        ctx: Context<DeleteEntry>,
    ) -> Result<()> {
        let entry = &ctx.accounts.entry;
        let ledger = &mut ctx.accounts.ledger;
        
        require!(
            ctx.accounts.user.key() == entry.creator || 
            ctx.accounts.user.key() == ledger.authority,
            CustomError::UnauthorizedUpdate
        );

        // Update ledger stats
        ledger.entry_count = ledger.entry_count.saturating_sub(1);

        emit!(EntryDeleted {
            entry_id: entry.entry_id.clone(),
            deleted_by: ctx.accounts.user.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Batch record multiple entries
    pub fn batch_record_entries(
        ctx: Context<BatchRecordEntries>,
        entries_data: Vec<EntryData>,
    ) -> Result<()> {
        require!(entries_data.len() <= 10, CustomError::TooManyEntries);
        require!(entries_data.len() > 0, CustomError::EmptyBatch);

        let ledger = &mut ctx.accounts.ledger;
        
        for entry_data in entries_data.iter() {
            // Validation for each entry
            require!(entry_data.entry_id.len() <= 32, CustomError::EntryIdTooLong);
            require!(entry_data.entry_id.len() > 0, CustomError::EntryIdEmpty);
            require!(entry_data.debit.len() <= 16, CustomError::AccountCodeTooLong);
            require!(entry_data.credit.len() <= 16, CustomError::AccountCodeTooLong);
            require!(entry_data.amount > 0, CustomError::InvalidAmount);
            require!(entry_data.currency.len() <= 8, CustomError::CurrencyCodeTooLong);
            require!(entry_data.debit != entry_data.credit, CustomError::SameDebitCredit);
        }

        // Update ledger stats
        ledger.entry_count += entries_data.len() as u64;
        ledger.total_entries += entries_data.len() as u64;

        emit!(BatchEntriesRecorded {
            batch_size: entries_data.len() as u64,
            created_by: ctx.accounts.user.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLedger<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CompanyLedger::MAX_SIZE
    )]
    pub ledger: Account<'info, CompanyLedger>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(entry_id: String)]
pub struct RecordEntry<'info> {
    #[account(
        init, 
        payer = user, 
        space = 8 + Entry::MAX_SIZE,
        seeds = [b"entry", ledger.key().as_ref(), entry_id.as_bytes()],
        bump
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub ledger: Account<'info, CompanyLedger>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateEntry<'info> {
    #[account(mut)]
    pub entry: Account<'info, Entry>,
    pub ledger: Account<'info, CompanyLedger>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(entry_id: String)]
pub struct GetEntry<'info> {
    #[account(
        seeds = [b"entry", ledger.key().as_ref(), entry_id.as_bytes()],
        bump
    )]
    pub entry: Account<'info, Entry>,
    pub ledger: Account<'info, CompanyLedger>,
}

#[derive(Accounts)]
pub struct DeleteEntry<'info> {
    #[account(
        mut,
        close = user, // Return rent to user
    )]
    pub entry: Account<'info, Entry>,
    #[account(mut)]
    pub ledger: Account<'info, CompanyLedger>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct BatchRecordEntries<'info> {
    #[account(mut)]
    pub ledger: Account<'info, CompanyLedger>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Data structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EntryData {
    pub entry_id: String,
    pub debit: String,
    pub credit: String,
    pub amount: u64,
    pub currency: String,
}

// Events
#[event]
pub struct EntryRecorded {
    pub entry_id: String,
    pub debit: String,
    pub credit: String,
    pub amount: u64,
    pub currency: String,
    pub timestamp: i64,
    pub creator: Pubkey,
}

#[event]
pub struct EntryDeleted {
    pub entry_id: String,
    pub deleted_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct BatchEntriesRecorded {
    pub batch_size: u64,
    pub created_by: Pubkey,
    pub timestamp: i64,
}
