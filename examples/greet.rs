use gpui::private::serde_json;
use gpui::{
    px, size, App, AppContext, Application, Bounds, Context, Entity, WindowBounds, WindowOptions,
};
use gpui_wry::command_handlers;
use gpui_wry::webview::WebView;
use gpui_wry::wry::WebViewId;
use serde::{Deserialize, Serialize};
use std::io::Error;

fn main() {
    Application::new().run(|cx: &mut App| {
        cx.activate(true);

        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::centered(
                None,
                size(px(800.), px(600.0)),
                cx,
            ))),
            is_resizable: false,
            ..Default::default()
        };
        cx.open_window(options, greet_view).unwrap();
    });
}

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

// todo: implement macros like #[command] and generate_handler![] in Tauri (if it is necessary)
