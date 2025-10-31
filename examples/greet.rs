use gpui::private::serde_json;
use gpui::{App, AppContext, Application, Context, Entity, WindowOptions};
use gpui_component::webview::WebView;
use gpui_component::wry::WebViewId;
use http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_EXPOSE_HEADERS, CONTENT_TYPE};
use http::{HeaderValue, StatusCode};
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
            // .serve_apis(generate_handler![greet])
            .serve_api((String::from("greet"), wrap_command_1(greet_0)))
            .build_as_child(window)
            .unwrap();
        WebView::new(webview, window, cx)
    })
}

fn wrap_command_1<C, D, S>(c: C) -> impl Fn(http::Request<Vec<u8>>) -> http::Response<Vec<u8>>
where
    D: for<'de> Deserialize<'de>, // 或者使用 serde::de::DeserializeOwned
    S: Serialize,
    C: Fn(D) -> Result<S, Error>,
{
    move |request: http::Request<Vec<u8>>| -> http::Response<Vec<u8>> {
        // 尝试将请求体反序列化为 D
        let body_bytes = request.into_body();
        let deserialized: D = match serde_json::from_slice(&body_bytes) {
            Ok(d) => d,
            Err(e) => {
                // 反序列化失败，返回 400
                return http::Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                    .header(ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
                    .header(
                        ACCESS_CONTROL_EXPOSE_HEADERS,
                        HeaderValue::from_static("Tauri-Response"),
                    )
                    .header("Tauri-Response", HeaderValue::from_static("ok"))
                    .header(
                        ACCESS_CONTROL_EXPOSE_HEADERS,
                        HeaderValue::from_static("Tauri-Response"),
                    )
                    .body(format!("Bad Request: {}", e).into_bytes())
                    .unwrap();
            }
        };

        // 调用用户提供的函数 C
        let result: Result<S, Error> = c(deserialized);

        // 根据结果构建响应
        match result {
            Ok(output) => {
                // 序列化成功结果
                let serialized = match serde_json::to_vec(&output) {
                    Ok(bytes) => bytes,
                    Err(e) => {
                        // 序列化失败，返回 500
                        return http::Response::builder()
                            .status(StatusCode::INTERNAL_SERVER_ERROR)
                            .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                            .header(ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
                            .header(
                                ACCESS_CONTROL_EXPOSE_HEADERS,
                                HeaderValue::from_static("Tauri-Response"),
                            )
                            .header("Tauri-Response", HeaderValue::from_static("ok"))
                            .body(format!("Internal Server Error: {}", e).into_bytes())
                            .unwrap();
                    }
                };

                http::Response::builder()
                    .status(StatusCode::OK)
                    .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                    .header(ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
                    .header(
                        ACCESS_CONTROL_EXPOSE_HEADERS,
                        HeaderValue::from_static("Tauri-Response"),
                    )
                    .header("Tauri-Response", HeaderValue::from_static("ok"))
                    .body(serialized)
                    .unwrap()
            }
            Err(e) => {
                // 用户函数返回错误，返回 500
                http::Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                    .header(ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
                    .header(
                        ACCESS_CONTROL_EXPOSE_HEADERS,
                        HeaderValue::from_static("Tauri-Response"),
                    )
                    .header("Tauri-Response", HeaderValue::from_static("ok"))
                    .body(format!("Internal Server Error: {}", e).into_bytes())
                    .unwrap()
            }
        }
    }
}

#[derive(Deserialize, Serialize)]
struct Namer {
    name: String,
}

fn greet_0(namer: Namer) -> Result<Namer, Error> {
    Ok(namer)
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
