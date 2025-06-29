# Case Study: Đồng bộ chuẩn đặt tên giữa Rust/Anchor và TypeScript khi phát triển smart contract Solana

## Bối cảnh
- Dự án sử dụng Anchor (Rust) để phát triển smart contract trên Solana.
- Test case được viết bằng TypeScript sử dụng Anchor client và Mocha.
- Gặp lỗi khi chạy test: `IdlError: Type not found: {"type":{"defined":{"name":"BatchEntryData"}}}`.

## Phân tích nguyên nhân
- Rust/Anchor quy định tên struct/type phải dùng PascalCase(tham khảo `Rust Coding Conventions Instructions`) (ví dụ: `BatchEntryData`).
- Anchor sinh file IDL giữ nguyên tên type PascalCase.
- Anchor TypeScript client khi thực thi sẽ tìm đúng tên type như trong IDL (PascalCase).
- Nếu test truyền object không đúng định dạng (ví dụ: dùng camelCase cho type hoặc field), sẽ gây lỗi không nhận diện type.

## Quy tắc chuẩn hóa
- **Lấy Rust làm chuẩn**: Định nghĩa struct/type trong Rust phải dùng PascalCase, field dùng snake_case.
- **IDL sinh ra từ Rust**: Tên type giữ nguyên PascalCase, field giữ nguyên snake_case.
- **Test TypeScript phải tuân thủ IDL**: Khi truyền object vào Anchor client, phải dùng đúng tên type (PascalCase) và field (snake_case) như trong IDL.

## Hành động khắc phục
1. Kiểm tra lại định nghĩa struct/type trong Rust, đảm bảo dùng PascalCase.
2. Build lại project để Anchor sinh IDL mới nhất.
3. Regenerate TypeScript types từ IDL nếu cần.
4. Sửa test TypeScript để truyền đúng định dạng object (type PascalCase, field snake_case).
5. Chạy lại test, xác nhận không còn lỗi mismatch.

## Kết luận
- Luôn lấy Rust/Anchor làm chuẩn nguồn gốc cho mọi định nghĩa type/struct.
- Test case TypeScript phải tuân thủ đúng định dạng object như IDL sinh ra từ Rust.
- Việc đồng bộ quy tắc đặt tên giúp tránh lỗi runtime và đảm bảo CI/CD ổn định cho dự án smart contract Solana.
