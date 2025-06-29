/**
 * CompanyOnchainClient SDK - Anchor Solana TypeScript Client
 * ---------------------------------------------------------
 *
 * Mục đích:
 * - Cung cấp class và hàm tiện ích thao tác với smart contract Solana (Anchor) từ TypeScript/Node.js.
 * - Đóng gói các thao tác phổ biến: khởi tạo ledger, ghi entry, cập nhật, xóa, lấy dữ liệu, lắng nghe sự kiện, batch ghi entries...
 * - Đơn giản hóa việc gọi các hàm của smart contract, chuẩn hóa logic xử lý PDA, accounts, params.
 * - Hỗ trợ test, script, backend, frontend dễ dàng, tránh lặp lại code truy cập contract.
 *
 * Vai trò:
 * - Là client SDK thu nhỏ cho smart contract, giúp thao tác Anchor Solana dễ dàng, chuẩn hóa và tái sử dụng.
 * - Có thể dùng cho test tự động, backend service, hoặc frontend dApp.
 *
 * Sử dụng:
 *   import { createCompanyOnchainClient } from "./utils/client";
 *   const client = createCompanyOnchainClient(program, provider);
 *   await client.initializeLedger();
 *   await client.recordEntry(...);
 *   ...
 *
 * Xem hàm exampleUsage() ở cuối file để tham khảo cách sử dụng thực tế.
 */

import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { CompanyOnchain } from "../target/types/company_onchain";

export class CompanyOnchainClient {
  constructor(
    private program: Program<CompanyOnchain>,
    private provider: anchor.AnchorProvider
  ) {}

  // Initialize a new ledger
  async initializeLedger(authority?: Keypair): Promise<PublicKey> {
    const ledgerKeypair = Keypair.generate();
    const auth = authority || (this.provider.wallet as anchor.Wallet);

    await this.program.methods
      .initializeLedger()
      .accounts({
        ledger: ledgerKeypair.publicKey,
        authority: auth.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([ledgerKeypair])
      .rpc();

    return ledgerKeypair.publicKey;
  }

  // Get entry PDA address
  getEntryPda(ledger: PublicKey, entryId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledger.toBuffer(),
        Buffer.from(entryId)
      ],
      this.program.programId
    );
  }

  // Record a new entry
  async recordEntry(
    ledger: PublicKey,
    entryData: {
      entryId: string;
      debit: string;
      credit: string;
      amount: number;
      currency: string;
    }
  ): Promise<PublicKey> {
    const [entryPda] = this.getEntryPda(ledger, entryData.entryId);

    await this.program.methods
      .recordEntry(
        entryData.entryId,
        entryData.debit,
        entryData.credit,
        new anchor.BN(entryData.amount),
        entryData.currency
      )
      .accounts({
        entry: entryPda,
        ledger,
        user: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return entryPda;
  }

  // Update an existing entry
  async updateEntry(
    ledger: PublicKey,
    entryId: string,
    updateData: {
      debit: string;
      credit: string;
      amount: number;
      currency: string;
    }
  ): Promise<void> {
    const [entryPda] = this.getEntryPda(ledger, entryId);

    await this.program.methods
      .updateEntry(
        updateData.debit,
        updateData.credit,
        new anchor.BN(updateData.amount),
        updateData.currency
      )
      .accounts({
        entry: entryPda,
        ledger,
        user: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  // Delete an entry
  async deleteEntry(ledger: PublicKey, entryId: string): Promise<void> {
    const [entryPda] = this.getEntryPda(ledger, entryId);

    await this.program.methods
      .deleteEntry()
      .accounts({
        entry: entryPda,
        ledger,
        user: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  // Get entry data
  async getEntry(ledger: PublicKey, entryId: string): Promise<any> {
    const [entryPda] = this.getEntryPda(ledger, entryId);
    return await this.program.account.entry.fetch(entryPda);
  }

  // Get ledger data
  async getLedger(ledger: PublicKey): Promise<any> {
    return await this.program.account.companyLedger.fetch(ledger);
  }

  // Get all entries for a ledger (requires indexing or filtering)
  async getAllEntries(ledger: PublicKey): Promise<any[]> {
    const entries = await this.program.account.entry.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator
          bytes: ledger.toBase58(),
        }
      }
    ]);
    return entries.map(entry => entry.account);
  }

  // Listen to entry events
  listenToEntryEvents(callback: (event: any) => void): number {
    return this.program.addEventListener("EntryRecorded", (event) => {
      callback({
        type: "EntryRecorded",
        data: event
      });
    });
  }

  // Remove event listener
  removeEventListener(listenerId: number): void {
    this.program.removeEventListener(listenerId);
  }

  // Batch record entries (if implemented)
  async batchRecordEntries(
    ledger: PublicKey,
    entriesData: Array<{
      entryId: string;
      debit: string;
      credit: string;
      amount: number;
      currency: string;
    }>
  ): Promise<void> {
    const formattedData = entriesData.map(entry => ({
      entry_id: entry.entryId,
      debit: entry.debit,
      credit: entry.credit,
      amount: new anchor.BN(entry.amount),
      currency: entry.currency,
    }));

    await this.program.methods
      .batchRecordEntries(formattedData)
      .accounts({
        ledger,
        user: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

// Helper function to create client
export function createCompanyOnchainClient(
  program: Program<CompanyOnchain>,
  provider: anchor.AnchorProvider
): CompanyOnchainClient {
  return new CompanyOnchainClient(program, provider);
}

// Example usage
export async function exampleUsage() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  const programId = new PublicKey("5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH");
  const idl = require("../target/idl/company_onchain.json");
  const program = new anchor.Program(idl, programId, provider) as Program<CompanyOnchain>;
  
  const client = createCompanyOnchainClient(program, provider);

  // Initialize ledger
  const ledgerPubkey = await client.initializeLedger();
  console.log("Ledger created:", ledgerPubkey.toString());

  // Record entry
  const entryPda = await client.recordEntry(ledgerPubkey, {
    entryId: "INV001",
    debit: "1001", // Cash
    credit: "4001", // Revenue
    amount: 100000, // $1000.00 in cents
    currency: "USD"
  });
  console.log("Entry created:", entryPda.toString());

  // Get entry
  const entry = await client.getEntry(ledgerPubkey, "INV001");
  console.log("Entry data:", entry);

  // Listen to events
  const listenerId = client.listenToEntryEvents((event) => {
    console.log("New entry event:", event);
  });

  // Clean up
  setTimeout(() => {
    client.removeEventListener(listenerId);
  }, 10000);
}
