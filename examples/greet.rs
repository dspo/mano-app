use gpui::private::serde_json;
use gpui::{App, AppContext, Application, Context, Entity, WindowOptions};
use gpui_component::webview::WebView;
use gpui_component::wry::WebViewId;
use gpui_wry::api_handler;
use http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_EXPOSE_HEADERS, CONTENT_TYPE};
use http::{HeaderValue, StatusCode};
use serde::Deserialize;

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
            .serve_apis(vec![api_handler!(greet)])
            .build_as_child(window)
            .unwrap();
        WebView::new(webview, window, cx)
    })
}

// todo: 学习 tauri 是如何封装 command 的
fn greet(request: http::Request<Vec<u8>>) -> http::Response<Vec<u8>> {
    http::Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
        .header(ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
        .header(
            ACCESS_CONTROL_EXPOSE_HEADERS,
            HeaderValue::from_static(ACCESS_CONTROL_ALLOW_ORIGIN.as_ref()),
        )
        .header(
            ACCESS_CONTROL_EXPOSE_HEADERS,
            HeaderValue::from_static("Tauri-Response"),
        )
        .header("Tauri-Response", HeaderValue::from_static("ok"))
        .body({
            #[derive(Deserialize)]
            struct Greet {
                name: String,
            }
            let request_body = &request.into_body();
            let request_body: Greet = serde_json::from_slice(request_body).unwrap();
            let body = format!(
                "Hello, {}! You've been greeted from Rust!",
                request_body.name
            );
            println!("{}", body);
            body.into_bytes()
        })
        .map_err(|err| format!("{err}"))
        .unwrap()
}
