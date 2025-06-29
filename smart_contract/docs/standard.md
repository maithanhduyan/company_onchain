# Naming Conventions Between Rust and Typescript 

## 1. Naming Conventions

### Rust
- **Structs, Enums, Traits, Type Aliases:** PascalCase (e.g. `CompanyLedger`, `BatchEntryData`)
- **Functions, Variables, Modules:** snake_case (e.g. `record_entry`, `entry_count`)
- **Constants/Statics:** SCREAMING_SNAKE_CASE (e.g. `MAX_SIZE`)
- **Account fields:** snake_case (e.g. `entry_id`, `total_entries`)
- **Events:** PascalCase for event struct, snake_case for fields

### TypeScript
- **Types/Interfaces/Classes:** PascalCase (e.g. `BatchEntryData`)
- **Variables, Functions:** camelCase (e.g. `recordEntry`, `entryCount`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g. `MAX_SIZE`)
- **Object fields:** Match Rust field names (snake_case) for on-chain data, camelCase for client-only logic

### Metadata/IDL
- **IDL Types:** PascalCase
- **IDL Fields:** snake_case (match Rust)
- **IDL Events:** PascalCase for event name, snake_case for fields

## 2. Build & Test Workflow

1. Chạy `anchor build` để sinh lại IDL chuẩn.
2. Chạy `anchor idl types <PROGRAM>` để sinh typescript types từ IDL.
3. Chạy `npm install` để đảm bảo các dependency test đã đủ.
4. Chạy `anchor test` hoặc `npx mocha -t 1000000 tests/` để kiểm tra toàn bộ test.
5. Đảm bảo không có warning/lỗi khi build/test. Nếu có warning, phải xử lý triệt để trước khi merge.

## 3. General Standards

- Luôn đồng bộ tên type/field giữa Rust, IDL, TypeScript.
- Không sử dụng import hoặc biến không dùng.
- Không để warning khi build/test.
- Đảm bảo test bao phủ các case chính và biên.
- Ghi chú rõ ràng, ưu tiên doc comment cho public API.
- Sử dụng rustfmt và clippy cho Rust, eslint/prettier cho TypeScript.
- Không dùng unwrap/expect trong production code trừ khi có lý do rõ ràng.
- Đảm bảo mọi thay đổi đều được kiểm tra tự động qua CI/CD nếu có.
