/**
 * File: fetch_entry_example.ts
 *
 * Nhiệm vụ:
 * - Kiểm thử khả năng fetch (truy xuất) dữ liệu entry kế toán từ smart contract Solana Anchor bằng client TypeScript.
 * - Đảm bảo client Anchor có thể truy xuất đúng dữ liệu entry đã lưu trên blockchain qua PDA.
 *
 * Mục tiêu cần đạt được:
 * 1. Client Anchor có thể kết nối, tính đúng PDA cho entry dựa trên ledgerPda và entryId.
 * 2. Fetch thành công account entry từ blockchain, dữ liệu trả về đúng cấu trúc, không lỗi IDL.
 * 3. Nếu entry không tồn tại, trả về lỗi rõ ràng, không crash chương trình.
 *
 * Ý nghĩa:
 * - Xác nhận contract và IDL đã chuẩn, client Anchor có thể truy xuất dữ liệu thực tế.
 * - Phát hiện sớm các lỗi về IDL, PDA, hoặc serialization khi tích hợp frontend/backend.
 */

import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { CompanyOnchain } from "../target/types/company_onchain";

(async () => {
  // Thiết lập provider và program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const programId = new anchor.web3.PublicKey("5A3ZEMpudXKh5KMTuZoNesPGWpUoYuHnFKAhzYQoEeqH");
  const idl = require("../target/idl/company_onchain.json");
  const program = new anchor.Program(idl, programId, provider);

  // Thay bằng ledgerPda và entryId thực tế của bạn
  const ledgerPda = new anchor.web3.PublicKey("PASTE_LEDGER_PDA_HERE");
  const entryId = "TEST001"; // hoặc entry_id bạn muốn fetch

  // Tính PDA cho entry
  const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("entry"),
      ledgerPda.toBuffer(),
      Buffer.from(entryId)
    ],
    program.programId
  );

  // Fetch account entry
  try {
    const entryAccount = await program.account.entry.fetch(entryPda);
    console.log("Entry data:", entryAccount);
  } catch (e) {
    console.error("Không tìm thấy entry hoặc lỗi:", e);
  }
})();
