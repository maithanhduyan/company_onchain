# company_onchain
Company onchain

Dưới đây là bản **kiến trúc hệ thống sổ cái kế toán doanh nghiệp sử dụng Solana làm tầng 2**, kết hợp cả **tính thực tế** và **đột phá trong dài hạn**.

---

## 🏗️ Kiến trúc tổng thể

```
        [ Người dùng nội bộ ]  
                │
        +-------▼----------+
        | Hệ thống ERP / kế toán |
        |  (SAP, Odoo, v.v.)     |
        +-------------------+
                │ Sự kiện kế toán (event bus / webhook)
                ▼
      [ Middleware chuyển đổi & serialize dữ liệu ]
                │
       +--------▼----------------+
       | Smart contract writer  |
       | (ghi dữ liệu lên Solana) |
       +------------------------+
                │
        +-------▼----------+
        |   Blockchain Solana   |
        |  (mainnet hoặc subnet)|
        +------------------+
                │
     +----------▼----------+
     | Hệ thống explorer riêng |
     |  (dashboard, audit, API)|
     +------------------------+
```

---

## 🧠 Các thành phần chi tiết

### 1. **Hệ thống ERP nội bộ (Tầng 1 - off-chain)**

* Vẫn là trung tâm điều phối bút toán kế toán.
* Có thể tích hợp webhook hoặc cron để gửi dữ liệu ra ngoài khi cần ghi on-chain.

### 2. **Middleware (Tầng trung gian - xử lý & xác thực dữ liệu)**

* Chức năng:

  * Chuyển đổi các bút toán kế toán thành định dạng chuẩn JSON hoặc binary.
  * Áp dụng rule: tránh dữ liệu nhạy cảm, chỉ hash hoặc tổng hợp.
  * Ký dữ liệu để đảm bảo xác thực (signing).

### 3. **Smart Contract Writer (on-chain writer)**

* Một module ghi lên Solana thông qua:

  * Giao diện `sendTransaction()` chuẩn của Solana
  * Kết nối thông qua RPC / Web3.js / Anchor framework
* Có thể lựa chọn:

  * Ghi từng bút toán → minh bạch cao, tốn fee hơn
  * Batch n giao dịch → tiết kiệm phí, phù hợp kế toán định kỳ

### 4. **Solana Layer (Tầng 2 - blockchain)**

* Ghi nhận dưới dạng:

```json
{
  "entry_id": "uuid",
  "account_debit": "A123",
  "account_credit": "B456",
  "amount": 10000,
  "currency": "USD",
  "hash": "SHA256(payload)",
  "timestamp": "block time",
  "sig": "digital signature"
}
```

### 5. **Explorer riêng / Dashboard kế toán**

* Truy xuất dữ liệu từ Solana bằng indexer (ví dụ: Helius, Dialect, custom RPC).
* Hiển thị theo từng:

  * Account
  * Period (ngày, tuần, quý)
  * Bút toán, báo cáo
  * Audit trail
* Có thể build frontend bằng React + Tailwind, backend Node.js hoặc Python.

---

## 🔐 Mô hình bảo mật & riêng tư

| Mô hình dữ liệu  | Giải pháp riêng tư                         |
| ---------------- | ------------------------------------------ |
| Ghi dữ liệu thô  | Hash SHA-256 hoặc Merkle tree checksum     |
| Dữ liệu chi tiết | Lưu nội bộ, chỉ ghi reference ID on-chain  |
| Bút toán lớn     | Sử dụng IPFS/Akamai, chỉ lưu hash on-chain |

---

## 🚀 Prototype MVP đề xuất

* **Phase 1 (2 tuần)**:

  * Tạo hệ thống backend (Node.js) để lấy dữ liệu từ ERP giả lập (CSV hoặc SQLite).
  * Middleware convert thành format JSON → push lên Solana testnet.

* **Phase 2 (1 tháng)**:

  * Viết smart contract Solana (Anchor) hỗ trợ bút toán kế toán cơ bản.
  * Build dashboard React (hiển thị theo tài khoản & kỳ báo cáo).
  * Cho phép xuất Merkle proof cho từng báo cáo.

* **Phase 3 (2–3 tháng)**:

  * Tích hợp thử nghiệm với Odoo / SAP bằng webhook hoặc API.
  * Chạy song song sổ cái on-chain & off-chain, audit tự động.

---

## 🧨 Mở rộng (tầm nhìn 5–10 năm)

| Ý tưởng                  | Tác động đột phá                                                  |
| ------------------------ | ----------------------------------------------------------------- |
| **Auto-audit AI**        | Dùng AI kiểm soát bút toán bất thường từ dữ liệu Solana real-time |
| **Zero-knowledge proof** | Xác minh đúng sai báo cáo mà không lộ dữ liệu                     |
| **NFT hóa báo cáo**      | Báo cáo tài chính dạng NFT có thể verify nguồn từ blockchain      |
| **Tài chính tự động**    | Kết hợp Oracle → dòng tiền tự động theo smart contract            |
| **Làm nền tảng IPO**     | Dùng sổ cái Solana minh bạch để sẵn sàng IPO                      |

---

Bạn muốn tôi triển khai prototype code (backend + smart contract + dashboard) hay bạn sẽ tự triển khai phần nào? Tôi có thể bắt đầu từ React frontend hoặc Anchor smart contract, tùy theo nhu cầu của bạn.
✅ Hệ thống backend đã được tạo, sử dụng Node.js để lấy dữ liệu kế toán từ **CSV** hoặc **SQLite** – mô phỏng dữ liệu ERP.

### Cấu trúc:

* `GET /csv` → đọc file `data/ledger.csv`
* `GET /sqlite` → truy vấn bảng `entries` trong file `data/ledger.db`

---

### 📁 File dữ liệu mẫu (bạn cần tạo):

#### `data/ledger.csv`

```csv
entry_id,account_debit,account_credit,amount,currency,timestamp
1,1001,4001,1000,USD,2025-06-01T12:00:00Z
2,1002,4002,2000,USD,2025-06-02T14:00:00Z
```

#### `data/ledger.db` (bảng `entries`)

Bạn có thể tạo bằng SQLite CLI:

```sql
CREATE TABLE entries (
  entry_id TEXT,
  account_debit TEXT,
  account_credit TEXT,
  amount REAL,
  currency TEXT,
  timestamp TEXT
);
```

---

Bạn muốn tôi tiếp tục phần nào kế tiếp? Gợi ý:

* Module hash + serialize để ghi lên Solana
* Dashboard truy xuất
* Smart contract ghi bút toán kế toán lên Solana
Tên dự án được cập nhật: **`company_onchain`**.

Bạn có thể áp dụng tên này cho toàn bộ hệ thống, gồm:

* 📁 Thư mục dự án: `company_onchain/`
* 🧠 Tên mô-đun chính: `company_onchain_backend`
* 📦 Tên package/namespace: `company_onchain.api`, `company_onchain.solana`, v.v.
* 🚀 Repository GitHub: `company_onchain`

---

### Gợi ý cấu trúc thư mục dự án:

```
company_onchain/
├── backend/
│   ├── index.js              # API chính
│   ├── data/                 # CSV & SQLite
│   └── services/             # Serialize, hash, solana writer
├── smart_contract/           # Smart contract Solana (Anchor)
├── frontend/                 # Dashboard kế toán (React)
├── docs/                     # Tài liệu mô tả & specs
└── README.md
```

