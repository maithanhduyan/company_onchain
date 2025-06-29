Để kết nối backend Node.js với smart contract Solana (viết bằng Anchor) thông qua `client.ts`, bạn sẽ tạo một **module bridge** trong backend gọi các hàm từ client như `recordEntry`, `updateEntry`, `getEntry`, v.v.

---

## ✅ Mục tiêu

Kết nối backend `Node.js` ↔ `smart_contract/client.ts` để:

* Ghi entry kế toán từ backend vào blockchain
* Đọc dữ liệu entry từ blockchain
* (Tuỳ chọn) batch xử lý

---

## 📁 Cấu trúc gợi ý

```
company_onchain/
├── backend/
│   ├── services/
│   │   ├── smartContractClient.js  ← Gọi client.ts từ Node.js
├── smart_contract/
│   ├── client.ts                   ← Tương tác Anchor client
│   ├── target/idl/company_onchain.json
```

---

## 🔧 1. Compile `client.ts` thành JS (dùng từ backend)

Nếu bạn dùng `ts-node`, có thể import trực tiếp `client.ts`. Nếu không, build sang JS bằng:

```bash
tsc smart_contract/client.ts --outDir smart_contract/dist
```

Hoặc thêm `client.ts` vào `tsconfig.json > include` rồi chạy:

```bash
tsc
```

---

## 🧠 2. Tạo `backend/services/smartContractClient.js`

```js
const anchor = require("@project-serum/anchor");
const { readFileSync } = require("fs");
const path = require("path");

const idl = require("../../smart_contract/target/idl/company_onchain.json");
const { PublicKey, Keypair, SystemProgram } = require("@solana/web3.js");

// Load wallet
const keypairPath = path.resolve(__dirname, "../../smart_contract/program-keypair.json");
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(keypairPath, "utf-8"))));

// Provider + Program
const provider = new anchor.AnchorProvider(
  new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed"),
  new anchor.Wallet(keypair),
  anchor.AnchorProvider.defaultOptions()
);
anchor.setProvider(provider);

const programId = new PublicKey(idl.metadata.address || "5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH");
const program = new anchor.Program(idl, programId, provider);

// Ghi một entry mới
async function recordEntry(ledgerPubkey, entry) {
  const [entryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("entry"), ledgerPubkey.toBuffer(), Buffer.from(entry.entry_id)],
    program.programId
  );

  await program.methods
    .recordEntry(
      entry.entry_id,
      entry.debit,
      entry.credit,
      new anchor.BN(entry.amount),
      entry.currency
    )
    .accounts({
      entry: entryPda,
      ledger: ledgerPubkey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return entryPda.toBase58();
}

module.exports = {
  recordEntry
};
```

---

## 🔌 3. Gọi từ `backend/index.js`

```js
const { recordEntry } = require("./services/smartContractClient");

app.post("/entries/onchain", async (req, res) => {
  try {
    const ledgerPubkey = new PublicKey(req.body.ledger); // truyền từ client/backend
    const entry = req.body.entry; // entry_id, debit, credit, amount, currency
    const txId = await recordEntry(ledgerPubkey, entry);
    res.json({ success: true, txId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## 🧠 Gợi ý nâng cao

| Mở rộng                | Ý nghĩa                                               |
| ---------------------- | ----------------------------------------------------- |
| `batchRecordEntries()` | Ghi nhiều entry 1 lần → giảm chi phí                  |
| `getEntry()`           | Truy xuất dữ liệu từ Solana → so sánh với SQLite      |
| `writeAuditProof()`    | Ghi Merkle root vào blockchain làm bản sao kế toán kỳ |

---

## ✅ Tóm tắt

| Thành phần               | Mục đích                                           |
| ------------------------ | -------------------------------------------------- |
| `client.ts`              | Giao diện tương tác Anchor client                  |
| `smartContractClient.js` | Cầu nối backend gọi hàm từ `client.ts`             |
| `/entries/onchain` API   | Ghi entry kế toán từ backend vào blockchain Solana |

---

Bạn muốn tôi giúp bạn viết sẵn endpoint `/entries/onchain` hoàn chỉnh trong backend? Hay hỗ trợ batch processing trực tiếp từ CSV?
