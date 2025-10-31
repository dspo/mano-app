use gpui::private::serde_json;
use gpui::private::serde_json::Value;
use gpui::{App, AppContext, Application, Context, Entity, WindowOptions};
use gpui_component::webview::WebView;
use gpui_component::wry::WebViewId;
use gpui_wry::register_api;
use http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_EXPOSE_HEADERS, CONTENT_TYPE};
use http::{HeaderValue, StatusCode};
use serde::{Deserialize, Serialize};
use std::io::Error;
use gpui_wry_macros::register_apis;

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
            // .serve_apis(register_apis![greet])
            .serve_api(register_api!(greet))
            .build_as_child(window)
            .unwrap();
        WebView::new(webview, window, cx)
    })
}

fn command<C, D, S>(c: C) -> impl Fn(http::Request<Vec<u8>>) -> http::Response<Vec<u8>>
where
    D: for<'de> Deserialize<'de>,
    S: Serialize,
    C: Fn(D) -> Result<S, Error>,
{
    move |request: http::Request<Vec<u8>>| -> http::Response<Vec<u8>> {
        // try to deserialize request body
        let request_body = request.into_body();
        let d: D = match serde_json::from_slice(&request_body) {
            Ok(d) => d,
            Err(e) => {
                return response_bad_request(e).unwrap();
            }
        };

        // call the custom command
        let r: Result<S, Error> = c(d);

        // 根据结果构建响应
        match r {
            Ok(output) => {
                // 序列化成功结果
                let serialized = match serde_json::to_vec(&output) {
                    Ok(bytes) => bytes,
                    Err(err) => {
                        return response_internal_server_error(err).unwrap();
                    }
                };

                response_builder(StatusCode::OK)
                    .header(
                        CONTENT_TYPE,
                        if serde_json::from_slice::<Value>(&serialized).is_ok() {
                            APPLICATION_JSON
                        } else {
                            TEXT_PLAIN
                        },
                    )
                    .body(serialized)
                    .unwrap()
            }
            Err(e) => response_internal_server_error(e).unwrap(),
        }
    }
}

const TAURI_RESPONSE_HEADER_NAME: &str = "Tauri-Response";
const TEXT_PLAIN: HeaderValue = HeaderValue::from_static("text/plain");
const APPLICATION_JSON: HeaderValue = HeaderValue::from_static("application/json");
const TAURI_RESPONSE_HEADER_OK: HeaderValue = HeaderValue::from_static("ok");

pub fn response_builder(status_code: StatusCode) -> http::response::Builder {
    http::Response::builder()
        .status(status_code)
        .header(ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
        .header(ACCESS_CONTROL_EXPOSE_HEADERS, TAURI_RESPONSE_HEADER_NAME)
        .header(TAURI_RESPONSE_HEADER_NAME, TAURI_RESPONSE_HEADER_OK)
}
fn response_bad_request<S: ToString>(content: S) -> http::Result<http::Response<Vec<u8>>> {
    response_builder(StatusCode::BAD_REQUEST)
        .header(CONTENT_TYPE, TEXT_PLAIN)
        .body(content.to_string().into_bytes())
}

fn response_internal_server_error<S: ToString>(
    content: S,
) -> http::Result<http::Response<Vec<u8>>> {
    response_builder(StatusCode::INTERNAL_SERVER_ERROR)
        .header(CONTENT_TYPE, TEXT_PLAIN)
        .body(content.to_string().into_bytes())
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
