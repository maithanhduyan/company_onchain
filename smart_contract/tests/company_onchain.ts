import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { CompanyOnchain } from "../target/types/company_onchain";

describe("company_onchain", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // Không dùng anchor.workspace, load program thủ công để tránh lỗi camelCase
  const programId = new anchor.web3.PublicKey("11111111111111111111111111111111");
  const idl = require("../target/idl/company_onchain.json");
  const program = new anchor.Program(idl, programId, provider) as Program<any>;

  it("Ghi một entry kế toán mới", async () => {
    const entryKeypair = anchor.web3.Keypair.generate();
    const user = provider.wallet;
    const entryData = {
      entry_id: "test001",
      debit: "1001",
      credit: "4001",
      amount: new anchor.BN(1000),
      currency: "USD",
      timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
    };
    // Truyền từng field vào method recordEntry
    await program.methods
      .recordEntry(
        entryData.entry_id,
        entryData.debit,
        entryData.credit,
        entryData.amount,
        entryData.currency,
        entryData.timestamp
      )
      .accounts({
        entry: entryKeypair.publicKey,
        user: user.publicKey,
        system_program: anchor.web3.SystemProgram.programId,
      })
      .signers([entryKeypair])
      .rpc();

    // Fetch lại entry vừa ghi
    const entry = await program.account.entry.fetch(entryKeypair.publicKey);
    // In ra entry để debug kiểu dữ liệu thực tế
    console.log("Fetched entry:", entry);
    // Truy cập property camelCase đúng chuẩn typegen, ép kiểu any
    assert.equal((entry as any).entryId, entryData.entry_id);
    assert.equal((entry as any).debit, entryData.debit);
    assert.equal((entry as any).credit, entryData.credit);
    assert.equal((entry as any).amount.toString(), entryData.amount.toString());
    assert.equal((entry as any).currency, entryData.currency);
    assert.equal((entry as any).timestamp.toString(), entryData.timestamp.toString());
  });
});
