# GPUI-WRY Application

A desktop application built with the GPUI-WRY framework, combining the power of GPUI (Zed's GUI framework) with Wry (Tauri's WebView library).

## Overview

This binary application demonstrates how to create a modern desktop app using:
- **GPUI**: Modern Rust GUI framework from Zed
- **Wry**: Cross-platform WebView library from Tauri
- **Web Frontend**: HTML/CSS/JavaScript for UI
- **Rust Backend**: High-performance native commands

## Features

- 🪟 Native window management with GPUI
- 🌐 Embedded WebView for rich UI
- ⚡ Fast Rust-to-JavaScript communication
- 🔧 Configurable via TOML files
- 📊 Built-in logging and debugging
- 🎨 Modern, responsive UI design
- 🔥 Hot reload support (development)

## Quick Start

### Prerequisites

- Rust 1.70+ with Cargo
- Node.js 16+ (for frontend development)

### Building

```bash
# Build the application
cargo build --release

# Run in development mode
cargo run --bin mano-app

# Run with custom config
GPUI_WRY_WINDOW_TITLE="My App" cargo run --bin mano-app
```

### Configuration

The application uses a TOML configuration file. Copy the example:

```bash
cp config.example.toml ~/.config/mano-app/config.toml
```

Edit the configuration file to customize your application:

```toml
[app]
name = "My GPUI-WRY App"
version = "1.0.0"

[window]
title = "My Application"
width = 1200.0
height = 800.0
resizable = true

[webview]
serve_path = "dist"
enable_dev_tools = true
```

## API Commands

The application exposes several commands that can be called from the frontend:

### `greet`
Greets a user with a personalized message.

**Request:**
```json
{
  "name": "Alice"
}
```

**Response:**
```json
{
  "message": "Hello, Alice! Welcome to GPUI-WRY Application!",
  "timestamp": 1703123456
}
```

### `get_app_info`
Returns application metadata.

**Response:**
```json
{
  "name": "mano-app",
  "version": "0.1.0",
  "platform": "macos",
  "arch": "aarch64",
  "uptime": 42
}
```

### `get_system_info`
Returns system information.

**Response:**
```json
{
  "os": "macos",
  "arch": "aarch64",
  "hostname": "MacBook-Pro",
  "username": "user"
}
```

### `log_message`
Logs a message from the frontend to the backend console.

**Request:**
```json
{
  "level": "info",
  "message": "Hello from frontend!"
}
```

### `ping`
Simple ping/pong command for testing connectivity.

**Response:**
```json
"pong"
```

## Frontend Integration

From your JavaScript frontend, use the Tauri API to call commands:

```javascript
import { invoke } from '@tauri-apps/api/core';

// Greet user
const response = await invoke('greet', { name: 'Alice' });
console.log(response.message);

// Get app info
const appInfo = await invoke('get_app_info');
console.log(`Running ${appInfo.name} v${appInfo.version}`);

// Log message
await invoke('log_message', { 
  level: 'info', 
  message: 'User clicked button' 
});
```

## Environment Variables

Override configuration with environment variables:

- `GPUI_WRY_WINDOW_TITLE`: Window title
- `GPUI_WRY_WINDOW_WIDTH`: Window width
- `GPUI_WRY_WINDOW_HEIGHT`: Window height
- `GPUI_WRY_DEV_SERVER`: Development server URL
- `GPUI_WRY_LOG_LEVEL`: Log level (trace, debug, info, warn, error)
- `GPUI_WRY_SERVE_PATH`: Static files path

Example:
```bash
cargo run -p mano-app --bin mano-app
```

## Development

### Project Structure

```
src/
├── main.rs          # Application entry point
├── commands.rs      # API command implementations
├── config.rs        # Configuration management
└── ui.rs           # UI view creation

assets/
└── splash.html     # Splash screen template

config.example.toml # Example configuration
```

### Adding New Commands

1. Define your command in `src/commands.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct MyRequest {
    pub data: String,
}

#[derive(Serialize)]
pub struct MyResponse {
    pub result: String,
}

pub fn my_command(req: MyRequest) -> Result<MyResponse, std::io::Error> {
    Ok(MyResponse {
        result: format!("Processed: {}", req.data),
    })
}
```

2. Register it in `src/ui.rs`:

```rust
builder = builder.serve_apis(command_handlers![
    greet,
    get_app_info,
    my_command,  // Add your command here
]);
```

3. Call from frontend:

```javascript
const result = await invoke('my_command', { data: 'test' });
```

### Testing

Run the test suite:

```bash
cargo test -p mano-app --bin mano-app
```

### Logging

The application uses `tracing` for structured logging. View logs by setting the log level:

```bash
RUST_LOG=debug cargo run -p mano-app --bin mano-app
```

## Deployment

### Release Build

```bash
cargo build --release --bin mano-app
```

The binary will be available at `target/release/mano-app`.

### Bundle with Frontend

If you have a web frontend, build it first:

```bash
# Example with Vite
npm run build
# Output goes to dist/

# Then run the app
cargo run --bin mano-app
```

### Cross-Platform

The application supports all platforms that GPUI and Wry support:
- macOS
- Windows
- Linux

Build for different targets:

```bash
# macOS (Intel)
cargo build --release --target x86_64-apple-darwin

# macOS (Apple Silicon)
cargo build --release --target aarch64-apple-darwin

# Windows
cargo build --release --target x86_64-pc-windows-msvc

# Linux
cargo build --release --target x86_64-unknown-linux-gnu
```

## Troubleshooting

### Common Issues

**Window doesn't appear:**
- Check that the window dimensions are valid
- Verify GPUI is properly initialized
- Check logs for WebView creation errors

**WebView blank:**
- Ensure static files exist in the serve path
- Check file permissions
- Try enabling dev tools to see console errors

**Commands not working:**
- Verify command names match exactly
- Check JSON serialization/deserialization
- Look at network tab in dev tools

**Configuration not loaded:**
- Check config file path: `~/.config/mano-app/config.toml`
- Verify TOML syntax
- Check file permissions

### Debug Mode

Run with debug logging:

```bash
RUST_LOG=gpui_wry_app=debug cargo run --bin mano-app
```

Enable WebView dev tools in config:

```toml
[webview]
enable_dev_tools = true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT OR Apache-2.0 license.

## Related Projects

- [GPUI](https://github.com/zed-industries/gpui) - Modern Rust GUI framework
- [Wry](https://github.com/tauri-apps/wry) - Cross-platform WebView library
- [Tauri](https://github.com/tauri-apps/tauri) - Desktop app framework
- [gpui-wry](../gpui-wry/) - The core library powering this application