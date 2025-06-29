I'll review your Anchor Solana program and create a comprehensive TypeScript client file for backend integration.

```ts
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  sendAndConfirmTransaction,
  GetProgramAccountsFilter,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  Wallet,
  BN,
  EventParser,
  web3,
  utils,
} from '@project-serum/anchor';
import { IDL } from './idl'; // You'll need to generate this from your program

// Types matching your Rust structs
export interface BatchEntryData {
  entryId: string;
  debit: string;
  credit: string;
  amount: BN;
  currency: string;
}

export interface Entry {
  entryId: string;
  debit: string;
  credit: string;
  amount: BN;
  currency: string;
  timestamp: BN;
  creator: PublicKey;
}

export interface CompanyLedger {
  authority: PublicKey;
  admins: PublicKey[];
  auditors: PublicKey[];
  entryCount: BN;
  totalEntries: BN;
  isFrozen: boolean;
  entriesByDate: Array<[BN, PublicKey]>;
  entriesByAccount: Array<[string, PublicKey[]]>;
}

export interface Company {
  authority: PublicKey;
  ledgerCount: BN;
  companyName: Uint8Array;
}

// Event types
export interface EntryRecordedEvent {
  entryId: string;
  debit: string;
  credit: string;
  amount: BN;
  currency: string;
  timestamp: BN;
  creator: PublicKey;
}

export interface EntryDeletedEvent {
  entryId: string;
  deletedBy: PublicKey;
  timestamp: BN;
}

export interface BatchEntriesRecordedEvent {
  batchSize: BN;
  createdBy: PublicKey;
  timestamp: BN;
}

export class CompanyOnchainClient {
  private connection: Connection;
  private program: Program;
  private provider: AnchorProvider;
  private wallet: Wallet;
  
  // Program ID from your declare_id!
  static readonly PROGRAM_ID = new PublicKey("5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH");

  constructor(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey = CompanyOnchainClient.PROGRAM_ID
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    this.program = new Program(IDL, programId, this.provider);
  }

  // Helper method to find PDA for entry
  findEntryPDA(ledgerPubkey: PublicKey, entryId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("entry"),
        ledgerPubkey.toBuffer(),
        Buffer.from(entryId)
      ],
      this.program.programId
    );
  }

  // Initialize a new ledger
  async initializeLedger(
    authority: Keypair,
    ledgerKeypair?: Keypair
  ): Promise<{ signature: string; ledgerPubkey: PublicKey }> {
    const ledger = ledgerKeypair || Keypair.generate();

    const signature = await this.program.methods
      .initializeLedger()
      .accounts({
        ledger: ledger.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority, ledger])
      .rpc();

    return { signature, ledgerPubkey: ledger.publicKey };
  }

  // Record a single entry
  async recordEntry(
    ledgerPubkey: PublicKey,
    user: Keypair,
    entryData: {
      entryId: string;
      debit: string;
      credit: string;
      amount: number | BN;
      currency: string;
    }
  ): Promise<{ signature: string; entryPubkey: PublicKey }> {
    const [entryPubkey] = this.findEntryPDA(ledgerPubkey, entryData.entryId);
    const amount = typeof entryData.amount === 'number' ? new BN(entryData.amount) : entryData.amount;

    const signature = await this.program.methods
      .recordEntry(
        entryData.entryId,
        entryData.debit,
        entryData.credit,
        amount,
        entryData.currency
      )
      .accounts({
        entry: entryPubkey,
        ledger: ledgerPubkey,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    return { signature, entryPubkey };
  }

  // Update an existing entry
  async updateEntry(
    entryPubkey: PublicKey,
    ledgerPubkey: PublicKey,
    user: Keypair,
    updateData: {
      newDebit: string;
      newCredit: string;
      newAmount: number | BN;
      newCurrency: string;
    }
  ): Promise<string> {
    const amount = typeof updateData.newAmount === 'number' ? new BN(updateData.newAmount) : updateData.newAmount;

    return await this.program.methods
      .updateEntry(
        updateData.newDebit,
        updateData.newCredit,
        amount,
        updateData.newCurrency
      )
      .accounts({
        entry: entryPubkey,
        ledger: ledgerPubkey,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
  }

  // Delete an entry
  async deleteEntry(
    entryPubkey: PublicKey,
    ledgerPubkey: PublicKey,
    user: Keypair
  ): Promise<string> {
    return await this.program.methods
      .deleteEntry()
      .accounts({
        entry: entryPubkey,
        ledger: ledgerPubkey,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();
  }

  // Batch record multiple entries
  async batchRecordEntries(
    ledgerPubkey: PublicKey,
    user: Keypair,
    entriesData: BatchEntryData[]
  ): Promise<string> {
    // Convert amounts to BN if needed
    const processedEntries = entriesData.map(entry => ({
      ...entry,
      amount: typeof entry.amount === 'number' ? new BN(entry.amount) : entry.amount
    }));

    return await this.program.methods
      .batchRecordEntries(processedEntries)
      .accounts({
        ledger: ledgerPubkey,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
  }

  // Initialize a company
  async initializeCompany(
    authority: Keypair,
    companyName: string,
    companyKeypair?: Keypair
  ): Promise<{ signature: string; companyPubkey: PublicKey }> {
    const company = companyKeypair || Keypair.generate();

    const signature = await this.program.methods
      .initializeCompany(companyName)
      .accounts({
        company: company.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority, company])
      .rpc();

    return { signature, companyPubkey: company.publicKey };
  }

  // Fetch entry by PDA
  async getEntry(ledgerPubkey: PublicKey, entryId: string): Promise<Entry | null> {
    try {
      const [entryPubkey] = this.findEntryPDA(ledgerPubkey, entryId);
      const entry = await this.program.account.entry.fetch(entryPubkey);
      return entry as Entry;
    } catch (error) {
      console.error('Error fetching entry:', error);
      return null;
    }
  }

  // Fetch ledger data
  async getLedger(ledgerPubkey: PublicKey): Promise<CompanyLedger | null> {
    try {
      const ledger = await this.program.account.companyLedger.fetch(ledgerPubkey);
      return ledger as CompanyLedger;
    } catch (error) {
      console.error('Error fetching ledger:', error);
      return null;
    }
  }

  // Fetch company data
  async getCompany(companyPubkey: PublicKey): Promise<Company | null> {
    try {
      const company = await this.program.account.company.fetch(companyPubkey);
      return company as Company;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  // Get all entries for a ledger (paginated)
  async getAllEntries(
    ledgerPubkey: PublicKey,
    page: number = 0,
    limit: number = 50
  ): Promise<{ entries: Entry[]; hasMore: boolean }> {
    try {
      const filters: GetProgramAccountsFilter[] = [
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: ledgerPubkey.toBase58(),
          },
        },
      ];

      const accounts = await this.connection.getProgramAccounts(
        this.program.programId,
        {
          filters,
          dataSlice: { offset: 0, length: 0 }, // Get all data
        }
      );

      // Sort by timestamp and paginate
      const allEntries = await Promise.all(
        accounts.map(async (account) => {
          try {
            const entry = await this.program.account.entry.fetch(account.pubkey);
            return entry as Entry;
          } catch {
            return null;
          }
        })
      );

      const validEntries = allEntries.filter(Boolean) as Entry[];
      validEntries.sort((a, b) => b.timestamp.toNumber() - a.timestamp.toNumber());

      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const paginatedEntries = validEntries.slice(startIndex, endIndex);
      const hasMore = endIndex < validEntries.length;

      return { entries: paginatedEntries, hasMore };
    } catch (error) {
      console.error('Error fetching entries:', error);
      return { entries: [], hasMore: false };
    }
  }

  // Listen to events
  addEventListener(
    eventName: 'EntryRecorded' | 'EntryDeleted' | 'BatchEntriesRecorded',
    callback: (event: any) => void
  ): number {
    return this.program.addEventListener(eventName, callback);
  }

  // Remove event listener
  removeEventListener(listenerId: number): Promise<void> {
    return this.program.removeEventListener(listenerId);
  }

  // Get recent events
  async getRecentEvents(
    eventName: 'EntryRecorded' | 'EntryDeleted' | 'BatchEntriesRecorded',
    limit: number = 100
  ): Promise<any[]> {
    try {
      const eventParser = new EventParser(this.program.programId, this.program.coder);
      const signatures = await this.connection.getSignaturesForAddress(
        this.program.programId,
        { limit }
      );

      const events: any[] = [];
      for (const sig of signatures) {
        try {
          const tx = await this.connection.getParsedTransaction(sig.signature, {
            commitment: 'confirmed',
          });
          
          if (tx?.meta?.logMessages) {
            const parsedEvents = eventParser.parseLogs(tx.meta.logMessages);
            events.push(...parsedEvents.filter(event => event.name === eventName));
          }
        } catch (error) {
          console.warn('Error parsing transaction:', error);
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  // Utility method to convert company name bytes to string
  static companyNameToString(nameBytes: Uint8Array): string {
    const nullIndex = nameBytes.indexOf(0);
    const validBytes = nullIndex === -1 ? nameBytes : nameBytes.slice(0, nullIndex);
    return new TextDecoder().decode(validBytes);
  }

  // Utility method to validate entry data
  static validateEntryData(entryData: {
    entryId: string;
    debit: string;
    credit: string;
    amount: number | BN;
    currency: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entryData.entryId || entryData.entryId.length === 0) {
      errors.push('Entry ID cannot be empty');
    }
    if (entryData.entryId.length > 32) {
      errors.push('Entry ID too long (max 32 characters)');
    }
    if (entryData.debit.length > 16) {
      errors.push('Debit account code too long (max 16 characters)');
    }
    if (entryData.credit.length > 16) {
      errors.push('Credit account code too long (max 16 characters)');
    }
    if (entryData.currency.length > 8) {
      errors.push('Currency code too long (max 8 characters)');
    }
    if (entryData.debit === entryData.credit) {
      errors.push('Debit and credit accounts cannot be the same');
    }

    const amount = typeof entryData.amount === 'number' ? entryData.amount : entryData.amount.toNumber();
    if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Validate account code format (alphanumeric)
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(entryData.debit)) {
      errors.push('Debit account code must be alphanumeric');
    }
    if (!alphanumericRegex.test(entryData.credit)) {
      errors.push('Credit account code must be alphanumeric');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to create connection
  static createConnection(rpcUrl: string = 'https://api.devnet.solana.com'): Connection {
    return new Connection(rpcUrl, 'confirmed');
  }

  // Helper method to create wallet from keypair
  static createWallet(keypair: Keypair): Wallet {
    return {
      publicKey: keypair.publicKey,
      signTransaction: async (tx: Transaction) => {
        tx.sign(keypair);
        return tx;
      },
      signAllTransactions: async (txs: Transaction[]) => {
        txs.forEach(tx => tx.sign(keypair));
        return txs;
      },
    };
  }
}

// Factory function to create client instance
export function createCompanyOnchainClient(
  rpcUrl: string = 'https://api.devnet.solana.com',
  walletKeypair: Keypair,
  programId?: PublicKey
): CompanyOnchainClient {
  const connection = CompanyOnchainClient.createConnection(rpcUrl);
  const wallet = CompanyOnchainClient.createWallet(walletKeypair);
  return new CompanyOnchainClient(connection, wallet, programId);
}

// Export types and client
export default CompanyOnchainClient;
```

I've created a comprehensive TypeScript client for your Solana Anchor program. Here are the key features included:

## Key Features:

1. **Complete Type Safety** - All interfaces match your Rust structs
2. **Full Program Integration** - All your program methods are supported
3. **PDA Management** - Automatic Program Derived Address generation
4. **Event Handling** - Listen to and fetch program events
5. **Error Handling** - Proper error catching and validation
6. **Pagination** - Support for fetching large datasets
7. **Utility Methods** - Helper functions for common tasks

## Usage Examples:

```typescript
// Initialize client
const keypair = Keypair.fromSecretKey(new Uint8Array(yourSecretKey));
const client = createCompanyOnchainClient('https://api.devnet.solana.com', keypair);

// Initialize ledger
const { ledgerPubkey } = await client.initializeLedger(keypair);

// Record entry
await client.recordEntry(ledgerPubkey, keypair, {
  entryId: "TXN001",
  debit: "1000", // Assets
  credit: "2000", // Liabilities  
  amount: 100000, // Amount in smallest unit
  currency: "USD"
});

// Fetch entries
const { entries } = await client.getAllEntries(ledgerPubkey, 0, 10);

// Listen to events
const listenerId = client.addEventListener('EntryRecorded', (event) => {
  console.log('New entry recorded:', event);
});
```

## Next Steps:

1. **Generate IDL**: Run `anchor build` to generate the IDL file
2. **Install Dependencies**: 
   ```bash
   npm install @solana/web3.js @project-serum/anchor
   ```
3. **Update Import**: Replace `./idl` with your actual IDL file path

The client handles all the complex Solana/Anchor interactions and provides a clean interface for your backend to interact with the on-chain ledger program.