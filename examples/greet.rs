use gpui::{
    div, px, App, AppContext, Application, Context, Entity, IntoElement, ParentElement, Render,
    Styled, Window, WindowOptions,
};
use gpui_component::webview::WebView;
use gpui_component::{v_flex, wry, ActiveTheme};
use wry::WebViewBuilder;

fn main() {
    Application::new().run(|cx: &mut App| {
        cx.activate(true);

        cx.open_window(WindowOptions::default(), |window, cx| {
            GreetView::view(window, cx)
        })
        .unwrap();
    });
}

struct GreetView {
    webview: Entity<WebView>,
}

impl GreetView {
    pub fn view(window: &mut gpui::Window, app: &mut App) -> Entity<WebView> {
        let webview = app.new(|cx: &mut Context<WebView>| {
            let webview = {
                use raw_window_handle::HasWindowHandle;

                let window_handle = window.window_handle().expect("No window handle");
                let builder = WebViewBuilder::new().with_url("https://v2.tauri.org.cn");
                let webview = builder.build_as_child(&window_handle).unwrap();
                webview
            };
            WebView::new(webview, window, cx)
        });

        webview
    }
}
