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

// Interface tạm cho entry/ledger để test không lỗi type
interface Entry {
  entryId: string;
  debit: string;
  credit: string;
  amount: anchor.BN;
  currency: string;
  creator: anchor.web3.PublicKey;
  timestamp: number;
}
interface CompanyLedger {
  authority: anchor.web3.PublicKey;
  entryCount: anchor.BN;
  totalEntries: anchor.BN;
}

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

    assert.equal(entry.entryId, entryId);
    assert.equal(entry.debit, entryData.debit);
    assert.equal(entry.credit, entryData.credit);
    assert.equal(entry.amount.toString(), entryData.amount.toString());
    assert.equal(entry.currency, entryData.currency);
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
      assert.include(error.toString(), "Debit and credit accounts cannot be the same");
    }
  });

  it("Update entry thành công", async () => {
    const entryId = "TEST_UPDATE";
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPda.toBuffer(),
        Buffer.from(entryId)
      ],
      program.programId
    );

    // First create an entry
    await program.methods
      .recordEntry(
        entryId,
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

    // Now update it
    await program.methods
      .updateEntry(
        "1002",
        "2002",
        new anchor.BN(2000),
        "EUR"
      )
      .accounts({
        entry: entryPda,
        ledger: ledgerPda,
        user: provider.wallet.publicKey,
      })
      .rpc();

    // Verify update
    const updatedEntry = await program.account.entry.fetch(entryPda) as Entry;
    assert.equal(updatedEntry.debit, "1002");
    assert.equal(updatedEntry.credit, "2002");
    assert.equal(updatedEntry.amount.toString(), "2000");
    assert.equal(updatedEntry.currency, "EUR");
  });

  it("Duplicate entry ID prevention", async () => {
    const entryId = "DUPLICATE_TEST";
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPda.toBuffer(),
        Buffer.from(entryId)
      ],
      program.programId
    );

    // Create first entry
    await program.methods
      .recordEntry(
        entryId,
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

    // Try to create duplicate - should fail because account already exists
    try {
      await program.methods
        .recordEntry(
          entryId,
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
      assert.fail("Should have failed because account already exists");
    } catch (error: any) {
      // This will fail with "already in use" error from Solana
      assert.include(error.toString().toLowerCase(), "already in use");
    }
  });

  it("Batch ghi nhiều entry kế toán", async () => {
    // Đúng theo IDL: arg là entriesData (vector of batchEntryData), field camelCase
    const batchEntries = [
      { entryId: "BATCH1", debit: "1111", credit: "2222", amount: new anchor.BN(500), currency: "USD" },
      { entryId: "BATCH2", debit: "3333", credit: "4444", amount: new anchor.BN(700), currency: "EUR" }
    ];
    // Call batch_record_entries
    await program.methods
      .batchRecordEntries(batchEntries)
      .accounts({
        ledger: ledgerPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    // Fetch lại từng entry để xác nhận
    for (const entry of batchEntries) {
      const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("entry"), ledgerPda.toBuffer(), Buffer.from(entry.entryId)],
        program.programId
      );
      const entryAcc = await program.account.entry.fetch(entryPda) as Entry;
      assert.equal(entryAcc.debit, entry.debit);
      assert.equal(entryAcc.credit, entry.credit);
      assert.equal(entryAcc.currency, entry.currency);
      assert.equal(entryAcc.amount.toString(), entry.amount.toString());
    }
  });
});
