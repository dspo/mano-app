use gpui::private::serde_json;
use gpui::{App, AppContext, Application, Context, Entity, WindowOptions};
use gpui_component::webview::WebView;
use gpui_component::wry::WebViewId;
use gpui_wry::command_handlers;
use serde::{Deserialize, Serialize};
use std::io::Error;

fn main() {
    Application::new().run(|cx: &mut App| {
        cx.activate(true);

        cx.open_window(WindowOptions::default(), greet_view)
            .unwrap();
    });
}

// todo: 窗口大小跟 tauri 示例项目保持一致
fn greet_view(window: &mut gpui::Window, app: &mut App) -> Entity<WebView> {
    app.new(|cx: &mut Context<WebView>| {
        let webview = gpui_wry::Builder::new()
            .with_webview_id(WebViewId::from("greet"))
            .serve_static(String::from("examples/apps/greet/dist"))
            .serve_apis(command_handlers![greet])
            .build_as_child(window)
            .unwrap();
        WebView::new(webview, window, cx)
    })
}

#[derive(Deserialize, Serialize)]
struct Namer {
    name: String,
}

fn greet(namer: Namer) -> Result<String, Error> {
    Ok(format!(
        "Hello, {}! You've been greeted from Rust!",
        namer.name
    ))
}

// todo: 学习 tauri 是如何封装 command 的
