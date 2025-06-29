# company_onchain Smart Contract (Anchor)

Smart contract ghi bút toán kế toán lên Solana, sử dụng Anchor framework.

## Mục tiêu dự án
- Xây dựng smart contract kế toán (Anchor/Solana) cho hệ thống Company Onchain.
- Đảm bảo khả năng ghi nhận, xác thực, truy vấn các bút toán kế toán (entries) trên blockchain Solana.
- Tích hợp kiểm thử tự động với Anchor, TypeScript, Mocha/Chai.
- Hỗ trợ phát triển, build, test hoàn toàn tự động trên môi trường Linux/WSL/Docker DevContainer.

## Thông tin cho Copilot và các AI agent
- **Luôn kiểm tra lỗi, tự động sửa và chạy lại build/test.**
- **Chỉ sử dụng các lệnh, toolchain, script tương thích Linux (không dùng lệnh Windows).**
- **Luôn đảm bảo chạy đúng thư mục `/workspace/smart_contract` khi build/test.**
- **Sử dụng các lệnh chuẩn:**
  - Build: `anchor build`
  - Test: `anchor test`
  - Local validator: `solana-test-validator`
- **Không hỏi lại các bước đã rõ, chỉ thực hiện và báo cáo kết quả.**

## Cấu trúc
- `lib.rs`: Logic xử lý chính
- `state.rs`: Định nghĩa struct Entry, EntryData
- `Cargo.toml`, `Anchor.toml`: Cấu hình project
- `tests/`: Test script bằng TypeScript
- `.devcontainer/`: Dockerfile, docker-compose, devcontainer.json cho môi trường phát triển tự động hóa

## Triển khai
```sh
anchor build
anchor test
```

## Hướng dẫn nhanh
1. Mở thư mục `smart_contract` trong VS Code, chọn "Reopen in Container".
2. Build contract: `anchor build`
3. Test contract: `anchor test`

## Liên hệ
- Tác giả: AI Copilot/Autonomous Agent
- Mọi thay đổi phải tuân thủ quy tắc tự động hóa, không hỏi lại thao tác rõ ràng.
