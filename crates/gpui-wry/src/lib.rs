use gpui_component::wry::{Result, WebView, WebViewBuilder};

pub struct Builder<'a> {
    builder: WebViewBuilder<'a>,
}

impl<'a> Builder<'a> {
    pub fn new() -> Self {
        Builder {
            builder: WebViewBuilder::new(),
        }
    }

    pub fn apply<F>(mut self, f: F) -> Self
    where
        F: FnOnce(WebViewBuilder<'a>) -> WebViewBuilder<'a>,
    {
        self.builder = f(self.builder);
        self
    }

    pub fn build_as_child(self, window: &mut gpui::Window) -> Result<WebView> {
        use raw_window_handle::HasWindowHandle;

        let window_handle = window.window_handle()?;
        self.builder.build_as_child(&window_handle)
    }

    pub fn webview_builder(self) -> WebViewBuilder<'a> {
        self.builder
    }
}
