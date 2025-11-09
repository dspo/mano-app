use gpui::{
    px, size, AppContext, Application, Bounds, Context, Entity, FocusHandle, Focusable,
    IntoElement, ParentElement, Render, Styled, Window, WindowBounds, WindowOptions,
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
    baidu: Entity<WebView>,
    focus_handle: FocusHandle,
}

impl ManoApp {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let focus_handle = cx.focus_handle();

        let main_state = ResizableState::new(cx);
        let sidebar_state = ResizableState::new(cx);
        let bottom_state = ResizableState::new(cx);

        let github = cx.new(|cx: &mut Context<WebView>| {
            let webview = gpui_wry::Builder::new()
                .with_webview_id(WebViewId::from("mano-app"))
                .apply(|builder| builder.with_url("https://github.com"))
                .build_as_child(window)
                .unwrap();

            WebView::new(webview, window, cx)
        });

        Self {
            main_state,
            sidebar_state,
            bottom_state,
            github,
            google: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("mano-app"))
                    .apply(|builder| builder.with_url("https://google.com"))
                    .build_as_child(window)
                    .unwrap();

                WebView::new(webview, window, cx)
            }),
            bing: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("mano-app"))
                    .apply(|builder| builder.with_url("https://m.bing.com"))
                    .build_as_child(window)
                    .unwrap();

                WebView::new(webview, window, cx)
            }),
            baidu: cx.new(|cx: &mut Context<WebView>| {
                let webview = gpui_wry::Builder::new()
                    .with_webview_id(WebViewId::from("mano-app"))
                    .apply(|builder| builder.with_url("https://m.baidu.com"))
                    .build_as_child(window)
                    .unwrap();

                WebView::new(webview, window, cx)
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
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        h_resizable("ide-main", self.main_state.clone())
            .child(
                resizable_panel()
                    .size(px(300.))
                    .size_range(px(200.)..px(500.))
                    .child(
                        v_resizable("sidebar", self.sidebar_state.clone())
                            .child(resizable_panel().size(px(200.)).child(self.google.clone()))
                            .child(resizable_panel().child(self.bing.clone())),
                    ),
            )
            .child(
                resizable_panel().child(
                    v_resizable("editor-area", self.bottom_state.clone())
                        .child(resizable_panel().child(self.github.clone()))
                        .child(resizable_panel().size(px(300.)).child(self.baidu.clone())),
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
