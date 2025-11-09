use gpui::{
    px, size, AppContext, Application, Bounds, Context, Entity, FocusHandle, Focusable, Hsla,
    IntoElement, Render, Styled, Window, WindowBounds, WindowOptions,
};
use gpui_component::resizable::{h_resizable, resizable_panel, v_resizable, ResizableState};
use gpui_component::Root;
use gpui_wry::webview::WebView;
use gpui_wry::wry::WebViewId;

struct ManoApp {
    main_state: Entity<ResizableState>,
    sidebar_state: Entity<ResizableState>,
    bottom_state: Entity<ResizableState>,
    github: Entity<WebView>,
    google: Entity<WebView>,
    bing: Entity<WebView>,
    rust_org: Entity<WebView>,
    focus_handle: FocusHandle,
}

impl ManoApp {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let focus_handle = cx.focus_handle();

        let main_state = ResizableState::new(cx);
        let sidebar_state = ResizableState::new(cx);
        let bottom_state = ResizableState::new(cx);

        Self {
            main_state,
            sidebar_state,
            bottom_state,
            github: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("mano-app"))
                    .apply(|builder| builder.with_user_agent("Mozilla/5.0 (Linux; Android 12; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"))
                    .apply(|builder| builder.with_url("https://github.com"))
                    .build_as_child(window)
                    .unwrap();
                WebView::new(webview, window, cx).more_style(|div| div.border_3().border_color(Hsla::transparent_black()))
            }),
            google: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("mano-app"))
                    .apply(|builder| builder.with_user_agent("Mozilla/5.0 (Linux; Android 12; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"))
                    .apply(|builder| builder.with_url("https://rust-lang.org/"))
                    .build_as_child(window)
                    .unwrap();
                WebView::new(webview, window, cx).more_style(|div| div.border_3().border_color(Hsla::transparent_black()))
            }),
            bing: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("greet"))
                    .serve_static("examples/apps/greet/dist")
                    .build_as_child(window)
                    .unwrap();

                WebView::new(webview, window, cx).more_style(|div| div.border_3().border_color(Hsla::transparent_black()))
            }),
            rust_org: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("mano-app"))
                    .apply(|builder| builder.with_user_agent("Mozilla/5.0 (Linux; Android 12; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"))
                    .apply(|builder| builder.with_url("https://tauri.app"))
                    .build_as_child(window)
                    .unwrap();

                WebView::new(webview, window, cx).more_style(|div| div.border_3().border_color(Hsla::transparent_black()))
            }),
            focus_handle,
        }
    }
}

impl Focusable for ManoApp {
    fn focus_handle(&self, _cx: &gpui::App) -> FocusHandle {
        self.focus_handle.clone()
    }
}

impl Render for ManoApp {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        h_resizable("main-horizontal-split", self.main_state.clone())
            .child(
                resizable_panel()
                    .size(px(300.))
                    .size_range(px(200.)..px(500.))
                    .child(
                        v_resizable("left-vertical-split", self.sidebar_state.clone())
                            .child(resizable_panel().size(px(200.)).child(self.google.clone()))
                            .child(resizable_panel().child(self.bing.clone())),
                    ),
            )
            .child(
                resizable_panel().child(
                    v_resizable("right-vertical-split", self.bottom_state.clone())
                        .child(resizable_panel().child(self.github.clone()))
                        .child(
                            resizable_panel()
                                .size(px(300.))
                                .child(self.rust_org.clone()),
                        ),
                ),
            )
    }
}

pub fn run() {
    Application::new().run(|cx| {
        gpui_component::init(cx);

        cx.activate(true);

        let options = WindowOptions {
            window_bounds: Some(WindowBounds::Windowed(Bounds::centered(
                None,
                size(px(1024.), px(768.0)),
                cx,
            ))),
            is_resizable: true,
            ..Default::default()
        };

        cx.open_window(options, |window, cx| {
            let view = cx.new(|cx| ManoApp::new(window, cx));
            cx.new(|cx| Root::new(view.into(), window, cx))
        })
        .unwrap();
    });
}
