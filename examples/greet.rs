use gpui::{App, AppContext, Application, Context, Entity, WindowOptions};
use gpui_component::webview::WebView;

fn main() {
    Application::new().run(|cx: &mut App| {
        cx.activate(true);

        cx.open_window(WindowOptions::default(), greet_view)
            .unwrap();
    });
}

pub fn greet_view(window: &mut gpui::Window, app: &mut App) -> Entity<WebView> {
    app.new(|cx: &mut Context<WebView>| {
        let webview = {
            gpui_wry::Builder::new()
                .apply(|b| b.with_url("https://v2.tauri.org.cn"))
                .build_as_child(window)
                .unwrap()
        };
        WebView::new(webview, window, cx)
    })
}
