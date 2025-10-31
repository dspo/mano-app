//! gpui-wry的过程宏实现

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Ident};

/// 函数式宏，用于将API处理函数转换为(name, handler)元组
/// 用法: api_handler!(function_name)
/// 这会将函数名转换为字符串，并返回包含函数名和函数指针的元组
#[proc_macro]
pub fn api_handler(input: TokenStream) -> TokenStream {
    // 解析输入为函数名
    let func_name = parse_macro_input!(input as Ident);
    let func_str = func_name.to_string();

    // 生成代码，返回(函数名字符串, 函数指针)元组
    let expanded = quote! {
        (
            #func_str.to_string(),
            #func_name as fn(http::Request<Vec<u8>>) -> http::Response<Vec<u8>>,
        )
    };

    expanded.into()
}
