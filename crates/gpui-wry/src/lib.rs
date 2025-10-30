use gpui_component::wry::{Error as WryError, Result, WebView, WebViewBuilder, WebViewId};
use http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE};
use http::{Request as HttpRequest, Response as HttpResponse, Result as HttpResult, StatusCode};
use serde::Serialize;
use serialize_to_javascript::{DefaultTemplate, Template, default_template};
use std::path::PathBuf;

pub struct Builder<'a> {
    builder: WebViewBuilder<'a>,
    webview_id: WebViewId<'a>,
}

impl<'a> Builder<'a> {
    pub fn new() -> Self {
        Builder {
            builder: WebViewBuilder::new(),
            webview_id: WebViewId::default(),
        }
    }

    pub fn with_webview_id(mut self, webview_id: WebViewId<'a>) -> Self {
        self.webview_id = webview_id;
        self
    }

    pub fn apply<F>(mut self, f: F) -> Self
    where
        F: FnOnce(WebViewBuilder<'a>) -> WebViewBuilder<'a>,
    {
        self.builder = f(self.builder);
        self
    }

    pub fn build_as_child(self, window: &mut gpui::Window) -> Result<WebView> {
        if self.webview_id.is_empty() {
            return Result::Err(WryError::InitScriptError);
        }

        use raw_window_handle::HasWindowHandle;

        let window_handle = window.window_handle()?;
        let webview_id = self.webview_id;
        self.with_initialization_script_for_main_only()
            .builder
            .with_id(webview_id)
            .build_as_child(&window_handle)
    }

    pub fn webview_builder(self) -> WebViewBuilder<'a> {
        self.builder
    }

    pub fn serve_static(self, static_root: String) -> Self {
        self.apply(move |b| {
            b.with_asynchronous_custom_protocol(
                "wry".into(),
                move |_webview_id, request, responder| {
                    let response =
                        response_static(&static_root, request).unwrap_or_else(internal_server_err);
                    responder.respond(response)
                },
            )
            .with_url("wry://localhost")
        })
    }

    fn with_initialization_script_for_main_only(mut self) -> Self {
        // todo: 搞懂一下 tauri 拿到 window label 和 webview label 做什么用
        let scripts = prepare_scripts(
            String::from("mocked_window_id"),
            self.webview_id.to_string(),
        )
        .unwrap();
        for s in scripts {
            self = self.apply(|b| b.with_initialization_script_for_main_only(s.script, true));
        }
        self
    }
}

// todo: 查看下 tauri 是怎么实现的
fn response_static(
    static_path: &str,
    request: HttpRequest<Vec<u8>>,
) -> HttpResult<HttpResponse<Vec<u8>>> {
    let path = request.uri().path();
    println!(
        "method: {:?}, scheme: {:?}, host: {:?}, path: {:?}",
        request.method(),
        request.uri().scheme(),
        request.uri().host(),
        request.uri().path()
    );
    // Read the file content from file path
    let root = PathBuf::from(static_path);
    let path = if path == "/" {
        "index.html"
    } else {
        //  removing leading slash
        &path[1..]
    };

    let content = match std::fs::canonicalize(root.join(path)) {
        Ok(path) => match std::fs::read(path) {
            Ok(content) => content,
            Err(err) => {
                println!("failed to read file: {err}");
                return Ok(page_not_found());
            }
        },
        Err(err) => {
            println!("failed to canonicalize path: {err}");
            return Ok(page_not_found());
        }
    };

    // Return asset contents and mime types based on file extentions
    // If you don't want to do this manually, there are some crates for you.
    // Such as `infer` and `mime_guess`.
    let mimetype = if path.ends_with(".html") || path == "/" {
        "text/html"
    } else if path.ends_with(".js") {
        "text/javascript"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".wasm") {
        "application/wasm"
    } else if path.ends_with(".css") {
        "text/css"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else {
        return Ok(not_yet_implemented());
    };

    http::Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, mimetype)
        .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(content)
        .map_err(Into::into)
}

fn page_not_found() -> HttpResponse<Vec<u8>> {
    http::Response::builder()
        .status(StatusCode::NOT_FOUND)
        .header(CONTENT_TYPE, "text/plain")
        .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(String::from("page not found").into_bytes())
        .unwrap()
}

fn not_yet_implemented() -> HttpResponse<Vec<u8>> {
    http::Response::builder()
        .status(StatusCode::NOT_IMPLEMENTED)
        .header(CONTENT_TYPE, "text/plain")
        .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(String::from("not yet implemented for the ext of the path").into_bytes())
        .unwrap()
}

fn internal_server_err<S: ToString>(content: S) -> HttpResponse<Vec<u8>> {
    HttpResponse::builder()
        .status(StatusCode::INTERNAL_SERVER_ERROR)
        .header(CONTENT_TYPE, "text/plain")
        .body(content.to_string().as_bytes().to_vec())
        .unwrap()
}

fn prepare_scripts(
    current_window_label: String,
    current_webview_label: String,
) -> std::result::Result<Vec<InitializationScript>, Box<dyn std::error::Error>> {
    let ipc_init = IpcJavascript {
        isolation_origin: "",
    }
    .render_default(&core::default::Default::default())?;

    let pattern_init = PatternJavascript {
        pattern: PatternObject::Brownfield,
    }
    .render_default(&core::default::Default::default())?;

    let mut list: Vec<InitializationScript> = Vec::new();

    list.push(InitializationScript::main_frame_script(
        r"
        Object.defineProperty(window, 'isTauri', {
          value: true,
        });

        if (!window.__TAURI_INTERNALS__) {
          Object.defineProperty(window, '__TAURI_INTERNALS__', {
            value: {
              plugins: {}
            }
          })
        }
      "
        .to_owned(),
    ));

    list.push(InitializationScript::main_frame_script(format!(
        r#"
          Object.defineProperty(window.__TAURI_INTERNALS__, 'metadata', {{
            value: {{
              currentWindow: {{ label: {current_window_label} }},
              currentWebview: {{ label: {current_webview_label} }}
            }}
          }})
        "#,
    )));

    list.push(InitializationScript::main_frame_script(
        initialization_script(&ipc_init.into_string(), &pattern_init.into_string())?,
    ));

    list.push(InitializationScript::main_frame_script(
        HotkeyZoom {
            os_name: std::env::consts::OS,
        }
        .render_default(&core::default::Default::default())?
        .into_string(),
    ));

    list.push(InitializationScript::main_frame_script(
        InvokeInitializationScript {
            process_ipc_message_fn: include_str!("scripts/tauri/process-ipc-message-fn.js"),
            os_name: std::env::consts::OS,
            fetch_channel_data_command: "plugin:__TAURI_CHANNEL__|fetch",
            invoke_key: "gpui",
        }
        .render_default(&core::default::Default::default())?
        .into_string(),
    ));

    Ok(list)
}

/// An initialization script
#[derive(Debug, Clone)]
pub struct InitializationScript {
    /// The script to run
    pub script: String,
    /// Whether the script should be injected to main frame only
    pub for_main_frame_only: bool,
}

impl core::default::Default for InitializationScript {
    fn default() -> Self {
        InitializationScript {
            script: "".to_string(),
            for_main_frame_only: true,
        }
    }
}

impl InitializationScript {
    // todo: 搞明白什么叫 main_frame_script
    fn main_frame_script(script: String) -> Self {
        InitializationScript {
            script,
            ..Self::default()
        }
    }
}

#[derive(Template)]
#[default_template("scripts/tauri/ipc.js")]
pub(crate) struct IpcJavascript<'a> {
    pub(crate) isolation_origin: &'a str,
}

#[derive(Template)]
#[default_template("scripts/tauri/pattern.js")]
pub(crate) struct PatternJavascript {
    pub(crate) pattern: PatternObject,
}

#[derive(Template)]
#[default_template("scripts/webview/zoom-hotkey.js")]
struct HotkeyZoom<'a> {
    os_name: &'a str,
}

/// The shape of the JavaScript Pattern config
#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase", tag = "pattern")]
enum PatternObject {
    /// Brownfield pattern.
    Brownfield,
    // todo: isolation mode
    //
    // Isolation pattern. Recommended for security purposes.
    // #[cfg(feature = "isolation")]
    // Isolation {
    //     /// Which `IsolationSide` this `PatternObject` is getting injected into
    //     side: IsolationSide,
    // },
}

fn initialization_script(
    ipc_script: &str,
    pattern_script: &str,
    // use_https_scheme: bool, // todo: use_https_scheme
) -> std::result::Result<String, Box<dyn std::error::Error>> {
    let core_script = &CoreJavascript {
        os_name: std::env::consts::OS,
        protocol_scheme: "http",
        invoke_key: "gpui",
    }
    .render_default(&core::default::Default::default())?
    .to_string();
    let event_initialization_script = &event_initialization_script(
        "__internal_unstable_listeners_function_id__",
        "__internal_unstable_listeners_object_id__",
    );
    let freeze_prototype = false;
    let freeze_prototype = if freeze_prototype {
        include_str!("scripts/tauri/freeze_prototype.js")
    } else {
        ""
    };
    InitJavascript {
        pattern_script,
        ipc_script,
        core_script,
        event_initialization_script,
        freeze_prototype,
    }
    .render_default(&core::default::Default::default())
    .map(|s| s.into_string())
    .map_err(Into::into)
}

#[derive(Template)]
#[default_template("scripts/tauri/ipc-protocol.js")]
pub(crate) struct InvokeInitializationScript<'a> {
    /// The function that processes the IPC message.
    #[raw]
    pub(crate) process_ipc_message_fn: &'a str,
    pub(crate) os_name: &'a str,
    pub(crate) fetch_channel_data_command: &'a str,
    pub(crate) invoke_key: &'a str,
}

#[derive(Template)]
#[default_template("scripts/tauri/core.js")]
struct CoreJavascript<'a> {
    os_name: &'a str,
    protocol_scheme: &'a str,
    invoke_key: &'a str,
}

pub(crate) fn event_initialization_script(function_name: &str, listeners: &str) -> String {
    format!(
        "Object.defineProperty(window, '{function_name}', {{
      value: function (eventData, ids) {{
        const listeners = (window['{listeners}'] && window['{listeners}'][eventData.event]) || []
        for (const id of ids) {{
          const listener = listeners[id]
          if (listener) {{
            eventData.id = id
            window.__TAURI_INTERNALS__.runCallback(listener.handlerId, eventData)
          }}
        }}
      }}
    }});
  "
    )
}

#[derive(Template)]
#[default_template("scripts/tauri/init.js")]
struct InitJavascript<'a> {
    #[raw]
    pattern_script: &'a str,
    #[raw]
    ipc_script: &'a str,
    #[raw]
    core_script: &'a str,
    #[raw]
    event_initialization_script: &'a str,
    #[raw]
    freeze_prototype: &'a str,
}
