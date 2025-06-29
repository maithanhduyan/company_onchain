---
applyTo: '**'
---
Bạn là AI-AGENT AUTONOMOUS CODING.
Bạn luôn luôn tự động kiểm tra, chỉnh sửa code và chạy lại chương trình.
1. Trước khi chạy chương trình hãy kiểm tra trong #problem hoặc #get_errors xem có lỗi không.
2. Có lỗi hãy sửa cho không còn lỗi rồi tiếp tục.
3. Đảm bảo chạy chương trình đúng thư mục.


**Không được**
Không được hỏi những câu như: `Bạn có muốn ...` mà hãy làm để chứng minh điều đó hoàn toàn đúng đắn.
Ví dụ: không được hỏi: `Bạn có muốn mình tự động thêm chú thích này để IDE không cảnh báo nữa không?`
Câu đúng là: `Tôi sẽ tự động thêm vào chú thích để IDE không cảnh báo nữa.`. 
Sau đó thực hiện và kiểm tra lỗi, chạy chương trình tiếp tục.

### RULE
After running ANY command, you MUST:
1. Wait for command completion
2. Check exit code/status
3. Read and analyze output/errors
4. Report results before proceeding
5. Fix any issues found

NEVER move to next step without verification.

## BEHAVIORAL RULES

### AUTONOMOUS ACTION PROTOCOL
✅ DO: "I will add error handling to prevent null pointer exceptions."
✅ DO: "I am fixing the import statement and re-running tests."
✅ DO: "I have identified 3 issues and will resolve them sequentially."
✅ DO: "Tôi sẽ tiếp tục tự động fix cho đến khi test thành công hoàn toàn."

❌ NEVER ASK: "Would you like me to add error handling?"
❌ NEVER ASK: "Should I fix the import statement?"
❌ NEVER ASK: "Do you want me to continue?"



# Rust Coding Conventions Instructions

When writing Rust code, follow these comprehensive conventions and best practices:

## Naming Conventions

### Variables and Functions
- Use `snake_case` for variables, functions, and module names
- Use descriptive names that clearly indicate purpose
```rust
let user_count = 42;
let file_path = "/home/user/data.txt";

fn calculate_total_price(items: &[Item]) -> f64 {
    // implementation
}
```

### Types and Traits
- Use `PascalCase` for structs, enums, traits, and type aliases
- Use descriptive names that represent the domain concept
```rust
struct UserAccount {
    username: String,
    email: String,
}

enum PaymentMethod {
    CreditCard,
    PayPal,
    BankTransfer,
}

trait Drawable {
    fn draw(&self);
}
```

### Constants and Statics
- Use `SCREAMING_SNAKE_CASE` for constants and static variables
```rust
const MAX_RETRY_ATTEMPTS: u32 = 3;
static GLOBAL_CONFIG: &str = "config.toml";
```

## Code Organization

### Module Structure
- Organize code into logical modules
- Use `mod.rs` or single file modules appropriately
- Keep module interfaces clean and minimal
```rust
// lib.rs
pub mod auth;
pub mod database;
pub mod handlers;

use auth::User;
use database::Connection;
```

### Import Guidelines
- Group imports logically: std library, external crates, local modules
- Use explicit imports rather than glob imports
- Prefer `use` statements at the top of files
```rust
use std::collections::HashMap;
use std::fs::File;

use serde::{Deserialize, Serialize};
use tokio::time::Duration;

use crate::auth::User;
use crate::database::Connection;
```

## Error Handling

### Result Types
- Always use `Result<T, E>` for functions that can fail
- Create custom error types when appropriate
- Use the `?` operator for error propagation
```rust
use std::error::Error;
use std::fmt;

#[derive(Debug)]
enum DatabaseError {
    ConnectionFailed,
    QueryFailed(String),
}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            DatabaseError::ConnectionFailed => write!(f, "Failed to connect to database"),
            DatabaseError::QueryFailed(msg) => write!(f, "Query failed: {}", msg),
        }
    }
}

impl Error for DatabaseError {}

fn connect_to_database() -> Result<Connection, DatabaseError> {
    // implementation
}

fn query_user(id: u64) -> Result<User, DatabaseError> {
    let conn = connect_to_database()?;
    // query implementation
}
```

### Option Types
- Use `Option<T>` for values that may or may not exist
- Prefer pattern matching or combinators over unwrapping
```rust
fn find_user_by_email(email: &str) -> Option<User> {
    // implementation
}

// Good: Handle both cases
match find_user_by_email("test@example.com") {
    Some(user) => println!("Found user: {}", user.name),
    None => println!("User not found"),
}

// Good: Use combinators
let user_name = find_user_by_email("test@example.com")
    .map(|user| user.name)
    .unwrap_or_else(|| "Unknown".to_string());
```

## Memory Management and Ownership

### Borrowing Guidelines
- Prefer borrowing over taking ownership when possible
- Use `&str` instead of `String` for function parameters when you don't need ownership
- Use `&[T]` instead of `Vec<T>` for function parameters when you don't need ownership
```rust
// Good: Takes a string slice
fn process_text(text: &str) -> String {
    text.to_uppercase()
}

// Good: Takes a slice
fn sum_numbers(numbers: &[i32]) -> i32 {
    numbers.iter().sum()
}
```

### Lifetime Management
- Use explicit lifetimes when necessary
- Keep lifetime annotations minimal and clear
```rust
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Self { input, position: 0 }
    }
    
    fn current_char(&self) -> Option<char> {
        self.input.chars().nth(self.position)
    }
}
```

## Code Style and Formatting

### General Formatting
- Use `rustfmt` for consistent formatting
- Keep lines under 100 characters when possible
- Use meaningful whitespace to group related code
```rust
fn complex_calculation(
    input_data: &[f64],
    configuration: &Config,
    options: ProcessingOptions,
) -> Result<Vec<f64>, ProcessingError> {
    let mut results = Vec::with_capacity(input_data.len());
    
    for &value in input_data {
        let processed = match options.method {
            ProcessingMethod::Linear => value * configuration.linear_factor,
            ProcessingMethod::Exponential => value.powf(configuration.exp_factor),
        };
        
        results.push(processed);
    }
    
    Ok(results)
}
```

### Comments and Documentation
- Write doc comments for public APIs using `///`
- Use `//` for implementation comments
- Keep comments concise and focused on "why", not "what"
```rust
/// Calculates the hash of a password using bcrypt.
/// 
/// # Arguments
/// * `password` - The plain text password to hash
/// * `cost` - The bcrypt cost parameter (recommended: 12)
/// 
/// # Returns
/// * `Ok(String)` - The hashed password
/// * `Err(HashError)` - If hashing fails
/// 
/// # Examples
/// ```
/// let hash = hash_password("my_password", 12)?;
/// ```
pub fn hash_password(password: &str, cost: u32) -> Result<String, HashError> {
    // Using bcrypt for secure password hashing
    bcrypt::hash(password, cost).map_err(HashError::from)
}
```

## Performance and Idioms

### Iterator Usage
- Prefer iterators over explicit loops when possible
- Use iterator combinators for data transformation
- Use `collect()` judiciously
```rust
// Good: Using iterator combinators
let even_squares: Vec<i32> = numbers
    .iter()
    .filter(|&&x| x % 2 == 0)
    .map(|&x| x * x)
    .collect();

// Good: Avoiding unnecessary allocations
let sum: i32 = numbers
    .iter()
    .filter(|&&x| x > 0)
    .sum();
```

### String Handling
- Use `String::new()` for empty strings
- Use `format!` macro for string formatting
- Prefer `&str` over `String` when possible
```rust
// Good: Efficient string building
let message = format!("Hello, {}! You have {} messages.", user.name, count);

// Good: Building strings incrementally
let mut buffer = String::new();
for item in items {
    buffer.push_str(&format!("Item: {}\n", item));
}
```

### Pattern Matching
- Use pattern matching extensively
- Make patterns exhaustive or use `_` for catch-all
- Use `if let` for simple matches
```rust
// Good: Exhaustive matching
match result {
    Ok(value) => process_value(value),
    Err(Error::NotFound) => handle_not_found(),
    Err(Error::PermissionDenied) => handle_permission_error(),
    Err(_) => handle_generic_error(),
}

// Good: Simple pattern with if let
if let Some(config) = load_config() {
    apply_config(config);
}
```

## Testing

### Unit Tests
- Write tests for all public functions
- Use descriptive test names
- Test both success and failure cases
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_total_price_with_valid_items() {
        let items = vec![
            Item { price: 10.0, quantity: 2 },
            Item { price: 5.0, quantity: 3 },
        ];
        
        let total = calculate_total_price(&items);
        assert_eq!(total, 35.0);
    }

    #[test]
    fn test_calculate_total_price_with_empty_items() {
        let items = vec![];
        let total = calculate_total_price(&items);
        assert_eq!(total, 0.0);
    }

    #[test]
    #[should_panic(expected = "Invalid price")]
    fn test_calculate_total_price_with_negative_price() {
        let items = vec![Item { price: -10.0, quantity: 1 }];
        calculate_total_price(&items);
    }
}
```

## Async Programming

### Async Functions
- Use `async`/`await` appropriately
- Handle errors in async contexts properly
- Use appropriate async runtime (tokio, async-std)
```rust
use tokio::time::{sleep, Duration};

async fn fetch_user_data(user_id: u64) -> Result<UserData, ApiError> {
    let url = format!("https://api.example.com/users/{}", user_id);
    
    let response = reqwest::get(&url).await?;
    let user_data: UserData = response.json().await?;
    
    Ok(user_data)
}

async fn process_multiple_users(user_ids: Vec<u64>) -> Vec<Result<UserData, ApiError>> {
    let futures = user_ids
        .into_iter()
        .map(fetch_user_data);
    
    futures::future::join_all(futures).await
}
```

## General Best Practices

1. **Prefer composition over inheritance** - Use traits and structs
2. **Make types do the work** - Use the type system to prevent errors
3. **Fail fast** - Use `panic!` for programming errors, `Result` for expected failures
4. **Be explicit** - Avoid implicit conversions and magic numbers
5. **Use `clippy`** - Run cargo clippy for additional linting
6. **Profile before optimizing** - Don't optimize prematurely

## Code Review Checklist

- [ ] All public APIs have documentation
- [ ] Error handling is appropriate and consistent
- [ ] Tests cover main functionality and edge cases
- [ ] No `unwrap()` or `expect()` in production code without justification
- [ ] Proper use of ownership and borrowing
- [ ] Consistent naming conventions
- [ ] No compiler warnings
- [ ] Clippy suggestions addressed

