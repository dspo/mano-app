//! gpui-wry的过程宏实现

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Ident};

/// 函数式宏，用于将API处理函数转换为(name, handler)元组
/// 用法: api_handler!(function_name)
/// 这会将函数名转换为字符串，并返回包含函数名和函数指针的元组
#[proc_macro]
pub fn generate_single_handler(input: TokenStream) -> TokenStream {
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

/// 批量API处理函数宏
/// 用于同时处理多个API处理函数，将它们转换为(name, handler)元组的集合
/// 用法: api_handlers![function1, function2, function3]
/// 返回一个Vec<(String, fn(http::Request<Vec<u8>>) -> http::Response<Vec<u8>>)>
#[proc_macro]
pub fn generate_handler(input: TokenStream) -> TokenStream {
    // 解析输入为多个函数名，以逗号分隔
    let func_names: Vec<Ident> = syn::parse_macro_input!(input with syn::punctuated::Punctuated::<Ident, syn::token::Comma>::parse_terminated) 
        .into_iter()
        .collect();
    
    // 为每个函数名生成对应的元组
    let tuples = func_names.iter().map(|func_name| {
        let func_str = func_name.to_string();
        quote! {
            (
                #func_str.to_string(),
                #func_name as fn(http::Request<Vec<u8>>) -> http::Response<Vec<u8>>,
            )
        }
    });
    
    // 生成包含所有元组的Vec
    let expanded = quote! {
        vec![#(#tuples),*]
    };
    
    expanded.into()
}
