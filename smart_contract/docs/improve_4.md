Lỗi này xảy ra vì IDL (Interface Description Language) không thể tìm thấy định nghĩa của type BatchEntryData. Vấn đề là bạn đã định nghĩa struct BatchEntryData trong file Rust nhưng nó không được export đúng cách trong IDL.
Dưới đây là cách khắc phục:

```
// programs/company_onchain/lib.rs

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_error::ProgramError;
mod state;
mod errors;

use state::*;
use errors::*;

// --- SECURITY & ROLES ---
#[account]
pub struct CompanyLedger {
    pub authority: Pubkey,
    pub admins: Vec<Pubkey>,
    pub auditors: Vec<Pubkey>,
    pub entry_count: u64,
    pub total_entries: u64,
    pub is_frozen: bool,
    pub entries_by_date: Vec<(i64, Pubkey)>,
    pub entries_by_account: Vec<([u8; 16], Vec<Pubkey>)>,
}

impl CompanyLedger {
    pub const MAX_SIZE: usize = 32 + 4 + 32*10 + 4 + 32*10 + 8 + 8 + 1 + 4 + (8+32)*100 + 4 + (16+4+32*10)*100;
}

#[account]
pub struct Entry {
    pub entry_id: [u8; 32],
    pub debit: [u8; 16],
    pub credit: [u8; 16],
    pub amount: u64,
    pub currency: [u8; 8],
    pub timestamp: i64,
    pub creator: Pubkey,
}

impl Entry {
    pub const MAX_SIZE: usize = 32 + 16 + 16 + 8 + 8 + 8 + 32;
}

// --- COMPANY MULTI-LEDGER ---
#[account]
pub struct Company {
    pub authority: Pubkey,
    pub ledger_count: u64,
    pub company_name: [u8; 64],
}

impl Company {
    pub const MAX_SIZE: usize = 32 + 8 + 64;
}

// --- AUDIT TRAIL ---
#[account]
pub struct AuditTrail {
    pub entry_id: [u8; 32],
    pub old_values: Entry,
    pub new_values: Entry,
    pub modified_by: Pubkey,
    pub timestamp: i64,
    pub reason: [u8; 64],
}

// --- BALANCE SHEET ---
#[account]
pub struct BalanceSheet {
    pub assets: u64,
    pub liabilities: u64,
    pub equity: u64,
    pub generated_at: i64,
}

// --- CURRENCY RATE ---
#[account]
pub struct CurrencyRate {
    pub from_currency: [u8; 8],
    pub to_currency: [u8; 8],
    pub rate: u64,
    pub updated_at: i64,
}

// MOVE BatchEntryData BEFORE declare_id! and #[program] module
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct BatchEntryData {
    pub entry_id: String,
    pub debit: String,
    pub credit: String,
    pub amount: u64,
    pub currency: String,
}

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
        // Role-based access: only authority or admin can record
        let ledger = &ctx.accounts.ledger;
        let user = ctx.accounts.user.key();
        require!(
            user == ledger.authority || ledger.admins.contains(&user),
            CustomError::InsufficientPermissions
        );
        require!(entry_id.len() <= 32, CustomError::EntryIdTooLong);
        require!(entry_id.len() > 0, CustomError::EntryIdEmpty);
        require!(debit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(credit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(amount > 0, CustomError::InvalidAmount);
        require!(currency.len() <= 8, CustomError::CurrencyCodeTooLong);
        require!(debit != credit, CustomError::SameDebitCredit);
        // Validate account code format
        validate_account_code(debit.as_bytes())?;
        validate_account_code(credit.as_bytes())?;

        let entry = &mut ctx.accounts.entry;
        let ledger = &mut ctx.accounts.ledger;
        let clock = Clock::get()?;

        entry.entry_id = entry_id.as_bytes().try_into().map_err(|_| CustomError::EntryIdTooLong)?;
        entry.debit = debit.as_bytes().try_into().map_err(|_| CustomError::AccountCodeTooLong)?;
        entry.credit = credit.as_bytes().try_into().map_err(|_| CustomError::AccountCodeTooLong)?;
        entry.amount = amount;
        entry.currency = currency.as_bytes().try_into().map_err(|_| CustomError::CurrencyCodeTooLong)?;
        entry.timestamp = clock.unix_timestamp;
        entry.creator = ctx.accounts.user.key();

        ledger.entry_count += 1;
        ledger.total_entries += 1;
        // Indexing: add to entries_by_date, entries_by_account
        let entry_key = entry.key();
        let entry_id_str = String::from_utf8_lossy(&entry.entry_id).trim_end_matches(char::from(0)).to_string();
        let debit_str = String::from_utf8_lossy(&entry.debit).trim_end_matches(char::from(0)).to_string();
        let credit_str = String::from_utf8_lossy(&entry.credit).trim_end_matches(char::from(0)).to_string();
        let currency_str = String::from_utf8_lossy(&entry.currency).trim_end_matches(char::from(0)).to_string();
        let amount_val = entry.amount;
        let timestamp_val = entry.timestamp;
        let creator_val = entry.creator;
        // Indexing: add to entries_by_date, entries_by_account
        ledger.entries_by_date.push((timestamp_val, entry_key));
        ledger.entries_by_account.push((entry.debit, vec![entry_key]));
        ledger.entries_by_account.push((entry.credit, vec![entry_key]));
        emit!(EntryRecorded {
            entry_id: entry_id_str,
            debit: debit_str,
            credit: credit_str,
            amount: amount_val,
            currency: currency_str,
            timestamp: timestamp_val,
            creator: creator_val,
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
        let ledger = &ctx.accounts.ledger;
        let user = ctx.accounts.user.key();
        // Only authority or admin can update
        require!(
            user == ledger.authority || ledger.admins.contains(&user),
            CustomError::InsufficientPermissions
        );
        require!(new_debit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(new_credit.len() <= 16, CustomError::AccountCodeTooLong);
        require!(new_amount > 0, CustomError::InvalidAmount);
        require!(new_currency.len() <= 8, CustomError::CurrencyCodeTooLong);
        require!(new_debit != new_credit, CustomError::SameDebitCredit);
        validate_account_code(new_debit.as_bytes())?;
        validate_account_code(new_credit.as_bytes())?;
        entry.debit = new_debit.as_bytes().try_into().map_err(|_| CustomError::AccountCodeTooLong)?;
        entry.credit = new_credit.as_bytes().try_into().map_err(|_| CustomError::AccountCodeTooLong)?;
        entry.amount = new_amount;
        entry.currency = new_currency.as_bytes().try_into().map_err(|_| CustomError::CurrencyCodeTooLong)?;
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
        let user = ctx.accounts.user.key();
        // Only authority or admin can delete
        require!(
            user == ledger.authority || ledger.admins.contains(&user),
            CustomError::InsufficientPermissions
        );
        // Update ledger stats
        ledger.entry_count = ledger.entry_count.saturating_sub(1);
        let entry_key = entry.key();
        let entry_id_str = String::from_utf8_lossy(&entry.entry_id).trim_end_matches(char::from(0)).to_string();
        emit!(EntryDeleted {
            entry_id: entry_id_str,
            deleted_by: ctx.accounts.user.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // Batch record multiple entries - FIXED VERSION
    pub fn batch_record_entries(
        ctx: Context<BatchRecordEntries>,
        entries_data: Vec<BatchEntryData>,
    ) -> Result<()> {
        // Only authority or admin can batch record
        let ledger = &mut ctx.accounts.ledger;
        let user = ctx.accounts.user.key();
        require!(
            user == ledger.authority || ledger.admins.contains(&user),
            CustomError::InsufficientPermissions
        );
        require!(entries_data.len() <= 10, CustomError::TooManyEntries);
        require!(entries_data.len() > 0, CustomError::EmptyBatch);
        let clock = Clock::get()?;
        
        // NOTE: This is a simplified batch function that only updates ledger stats
        // In a real implementation, you'd need to create individual Entry accounts
        // or use a different approach since Anchor doesn't support creating multiple accounts in one instruction
        
        for entry_data in entries_data.iter() {
            require!(entry_data.entry_id.len() <= 32, CustomError::EntryIdTooLong);
            require!(entry_data.entry_id.len() > 0, CustomError::EntryIdEmpty);
            require!(entry_data.debit.len() <= 16, CustomError::AccountCodeTooLong);
            require!(entry_data.credit.len() <= 16, CustomError::AccountCodeTooLong);
            require!(entry_data.amount > 0, CustomError::InvalidAmount);
            require!(entry_data.currency.len() <= 8, CustomError::CurrencyCodeTooLong);
            require!(entry_data.debit != entry_data.credit, CustomError::SameDebitCredit);
            validate_account_code(entry_data.debit.as_bytes())?;
            validate_account_code(entry_data.credit.as_bytes())?;
            // Indexing: add to entries_by_date, entries_by_account
            let ledger_key = ledger.key();
            ledger.entries_by_date.push((clock.unix_timestamp, ledger_key));
            let debit_bytes = entry_data.debit.as_bytes().try_into().unwrap_or([0u8;16]);
            let credit_bytes = entry_data.credit.as_bytes().try_into().unwrap_or([0u8;16]);
            ledger.entries_by_account.push((debit_bytes, vec![ledger_key]));
            ledger.entries_by_account.push((credit_bytes, vec![ledger_key]));
        }
        ledger.entry_count += entries_data.len() as u64;
        ledger.total_entries += entries_data.len() as u64;
        emit!(BatchEntriesRecorded {
            batch_size: entries_data.len() as u64,
            created_by: ctx.accounts.user.key(),
            timestamp: clock.unix_timestamp,
        });
        Ok(())
    }

    // Pagination support (stub, Anchor không trả về Vec)
    pub fn get_entries_paginated(
        _ctx: Context<GetEntriesPaginated>,
        _page: u32,
        limit: u8,
    ) -> Result<()> {
        require!(limit <= 50, CustomError::PageSizeTooLarge);
        // Client fetch PDA, stub only
        Ok(())
    }

    // Multi-ledger: initialize company
    pub fn initialize_company(
        ctx: Context<InitializeCompany>,
        company_name: String,
    ) -> Result<()> {
        let company = &mut ctx.accounts.company;
        require!(company_name.len() <= 64, CustomError::AccountCodeTooLong); // reuse error
        company.authority = ctx.accounts.authority.key();
        company.ledger_count = 0;
        let mut name_bytes = [0u8; 64];
        name_bytes[..company_name.len()].copy_from_slice(company_name.as_bytes());
        company.company_name = name_bytes;
        Ok(())
    }

    // Audit trail (stub)
    pub fn create_audit_trail(
        _ctx: Context<CreateAuditTrail>,
        _old_entry: Entry,
        _new_entry: Entry,
        _reason: String,
    ) -> Result<()> {
        // Track all changes for compliance (stub)
        Ok(())
    }

    // Financial reporting (stub)
    pub fn generate_balance_sheet(
        _ctx: Context<GenerateReport>,
        _date_from: i64,
        _date_to: i64,
    ) -> Result<()> {
        // Generate on-chain report (stub)
        Ok(())
    }

    // Multi-currency conversion (stub)
    pub fn convert_currency(
        _ctx: Context<ConvertCurrency>,
        _amount: u64,
        _from: [u8; 8],
        _to: [u8; 8],
    ) -> Result<u64> {
        // Real-time currency conversion (stub)
        Ok(0)
    }

    // Cross-program invocation (stub)
    pub fn integrate_with_token_program(
        _ctx: Context<TokenIntegration>,
        _amount: u64,
    ) -> Result<()> {
        // CPI calls to SPL Token (stub)
        Ok(())
    }
}

// --- INPUT VALIDATION ---
pub fn validate_account_code(code: &[u8]) -> Result<()> {
    require!(!code.is_empty(), CustomError::AccountCodeEmpty);
    require!(code.iter().all(|&c| (c as char).is_ascii_alphanumeric()), CustomError::InvalidAccountCode);
    Ok(())
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

#[derive(Accounts)]
pub struct GetEntriesPaginated<'info> {
    pub ledger: Account<'info, CompanyLedger>,
}

#[derive(Accounts)]
pub struct InitializeCompany<'info> {
    #[account(init, payer = authority, space = 8 + Company::MAX_SIZE)]
    pub company: Account<'info, Company>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAuditTrail<'info> {
    #[account(mut)]
    pub audit_trail: Account<'info, AuditTrail>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct GenerateReport<'info> {
    pub ledger: Account<'info, CompanyLedger>,
}

#[derive(Accounts)]
pub struct ConvertCurrency<'info> {
    pub currency_rate: Account<'info, CurrencyRate>,
}

#[derive(Accounts)]
pub struct TokenIntegration<'info> {
    pub ledger: Account<'info, CompanyLedger>,
    pub user: Signer<'info>,
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
```

Bây giờ cần cập nhật file test để thay đổi cách gọi batch function, vì batch function hiện tại chỉ cập nhật thống kê ledger mà không tạo các Entry account riêng lẻ:

```
// 
/**
 * Test file for Solana Anchor smart contract: Company Onchain
 * 
 * Mục đích:
 * - Kiểm thử tự động chức năng ghi một entry kế toán mới vào blockchain.
 * - Đảm bảo contract hoạt động đúng logic, dữ liệu lưu trữ và truy xuất chính xác.
 *
 * Các bước thực hiện:
 * 1. Khởi tạo môi trường Anchor, kết nối localnet, load IDL và programId.
 * 2. Sinh keypair và dữ liệu entry mẫu (entry_id, debit, credit, amount, currency, timestamp).
 * 3. Gọi hàm recordEntry trên smart contract, truyền từng trường dữ liệu và các account cần thiết.
 * 4. Fetch lại entry vừa ghi từ blockchain, kiểm tra dữ liệu trả về.
 * 5. So sánh từng trường dữ liệu với dữ liệu gốc để đảm bảo lưu trữ đúng.
 *
 * Ý nghĩa:
 * - Đảm bảo contract ghi nhận entry kế toán đúng, không lỗi logic, dữ liệu lưu/truy xuất chính xác.
 * - Là bước quan trọng để CI/CD, phát hiện bug sớm trước khi deploy lên mainnet.
 * - Có thể mở rộng để test các chức năng khác như update, validate, authority, v.v.
 */ 

import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { CompanyOnchain } from "../target/types/company_onchain";
import { Idl } from "@project-serum/anchor";

describe("company_onchain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Use correct program ID
  const programId = new anchor.web3.PublicKey("5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH");
  const idl = require("../target/idl/company_onchain.json");
  const program = new anchor.Program(idl as Idl, programId, provider);
  
  let ledgerKeypair: anchor.web3.Keypair;
  let ledgerPda: anchor.web3.PublicKey;

  before(async () => {
    // Initialize ledger first
    ledgerKeypair = anchor.web3.Keypair.generate();
    ledgerPda = ledgerKeypair.publicKey;
    
    await program.methods
      .initializeLedger()
      .accounts({
        ledger: ledgerPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ledgerKeypair])
      .rpc();
    
    console.log("Ledger initialized at:", ledgerPda.toString());
  });

  it("Khởi tạo ledger thành công", async () => {
    const ledger = await program.account.companyLedger.fetch(ledgerPda) as CompanyLedger;
    
    assert.equal(ledger.authority.toString(), provider.wallet.publicKey.toString());
    assert.equal(ledger.entryCount.toString(), "0");
    assert.equal(ledger.totalEntries.toString(), "0");
  });

  it("Ghi một entry kế toán mới", async () => {
    const entryId = "TEST001";
    const entryData = {
      debit: "1001",
      credit: "2001",
      amount: 1000,
      currency: "USD"
    };

    // Calculate PDA for entry
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPda.toBuffer(),
        Buffer.from(entryId)
      ],
      program.programId
    );

    console.log("Entry PDA:", entryPda.toString());

    // Record entry
    await program.methods
      .recordEntry(
        entryId,
        entryData.debit,
        entryData.credit,
        new anchor.BN(entryData.amount),
        entryData.currency
      )
      .accounts({
        entry: entryPda,
        ledger: ledgerPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Fetch and verify entry
    const entry = await program.account.entry.fetch(entryPda) as Entry;
    console.log("Fetched entry:", entry);

    // Convert byte arrays to strings for comparison
    const entryIdStr = Buffer.from(entry.entryId).toString().replace(/\0+$/, '');
    const debitStr = Buffer.from(entry.debit).toString().replace(/\0+$/, '');
    const creditStr = Buffer.from(entry.credit).toString().replace(/\0+$/, '');
    const currencyStr = Buffer.from(entry.currency).toString().replace(/\0+$/, '');

    assert.equal(entryIdStr, entryId);
    assert.equal(debitStr, entryData.debit);
    assert.equal(creditStr, entryData.credit);
    assert.equal(entry.amount.toString(), entryData.amount.toString());
    assert.equal(currencyStr, entryData.currency);
    assert.equal(entry.creator.toString(), provider.wallet.publicKey.toString());
    assert.isTrue(entry.timestamp > 0);

    // Verify ledger stats updated
    const updatedLedger = await program.account.companyLedger.fetch(ledgerPda) as CompanyLedger;
    assert.equal(updatedLedger.entryCount.toString(), "1");
    assert.equal(updatedLedger.totalEntries.toString(), "1");
  });

  it("Validation: Entry ID quá dài", async () => {
    const longEntryId = "A".repeat(33); // 33 chars, should fail
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPda.toBuffer(),
        Buffer.from(longEntryId)
      ],
      program.programId
    );

    try {
      await program.methods
        .recordEntry(
          longEntryId,
          "1001",
          "2001",
          new anchor.BN(1000),
          "USD"
        )
        .accounts({
          entry: entryPda,
          ledger: ledgerPda,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed with EntryIdTooLong error");
    } catch (error: any) {
      assert.include(error.toString(), "Entry ID too long");
    }
  });

  it("Validation: Amount bằng 0", async () => {
    const entryId = "TEST_ZERO";
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPda.toBuffer(),
        Buffer.from(entryId)
      ],
      program.programId
    );

    try {
      await program.methods
        .recordEntry(
          entryId,
          "1001",
          "2001",
          new anchor.BN(0),
          "USD"
        )
        .accounts({
          entry: entryPda,
          ledger: ledgerPda,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed with InvalidAmount error");
    } catch (error: any) {
      assert.include(error.toString(), "Amount must be greater than 0");
    }
  });

  it("Validation: Debit và Credit giống nhau", async () => {
    const entryId = "TEST_SAME";
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPda.toBuffer(),
        Buffer.from(entryId)
      ],
      program.programId
    );

    try {
      await program.methods
        .recordEntry(
          entryId,
          "1001",
          "1001",
          new anchor.BN(1000),
          "USD"
        )
        .accounts({
          entry: entryPda,
          ledger: ledgerPda,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed with SameDebitCredit error");
    } catch (error: any) {
      assert.include(error.toString
```