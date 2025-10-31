//! gpui-wry的过程宏实现

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Ident};

/// 函数式宏，用于将API处理函数转换为(name, handler)元组
/// 用法: api_handler!(function_name)
/// 这会将函数名转换为字符串，并返回包含函数名和函数指针的元组
#[proc_macro]
pub fn handle_api(input: TokenStream) -> TokenStream {
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
pub fn handler_apis(input: TokenStream) -> TokenStream {
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

/// 函数式宏，用于将普通函数直接转换为(name, handler)元组
/// 用法: register_api!(function_name)
/// 这会将普通函数包装成HTTP处理函数，并返回包含函数名和处理函数的元组
#[proc_macro]
pub fn register_api(input: TokenStream) -> TokenStream {
    // 解析输入为函数名
    let func_name = parse_macro_input!(input as Ident);
    let func_str = func_name.to_string();

    // 生成代码，将普通函数包装成HTTP处理函数并返回元组
    let expanded = quote! {
        (
            #func_str.to_string(),
            move |request: http::Request<Vec<u8>>| -> http::Response<Vec<u8>> {
                // 定义必要的常量和辅助函数
                use http::{header::CONTENT_TYPE, HeaderValue, Response, StatusCode};
                use serde::{de::DeserializeOwned, Serialize};
                use serde_json::{from_slice, to_vec, Value};
                
                // 响应构建器
                fn response_builder(status_code: StatusCode) -> http::response::Builder {
                    http::Response::builder()
                        .status(status_code)
                        .header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
                        .header(http::header::ACCESS_CONTROL_EXPOSE_HEADERS, "Tauri-Response")
                        .header("Tauri-Response", "ok")
                }
                
                fn response_bad_request<S: ToString>(content: S) -> http::Result<http::Response<Vec<u8>>> {
                    response_builder(StatusCode::BAD_REQUEST)
                        .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                        .body(content.to_string().into_bytes())
                }
                
                fn response_internal_server_error<S: ToString>(content: S) -> http::Result<http::Response<Vec<u8>>> {
                    response_builder(StatusCode::INTERNAL_SERVER_ERROR)
                        .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                        .body(content.to_string().into_bytes())
                }
                
                // 尝试反序列化请求体
                let request_body = request.into_body();
                // 直接尝试反序列化，让编译器自动推断类型
                let d = match from_slice(&request_body) {
                    Ok(d) => d,
                    Err(e) => {
                        return response_bad_request(e).unwrap();
                    }
                };
                
                // 调用自定义命令
                let r: Result<_, _> = #func_name(d);
                
                // 根据结果构建响应
                match r {
                    Ok(output) => {
                        // 序列化成功结果
                        let serialized = match to_vec(&output) {
                            Ok(bytes) => bytes,
                            Err(err) => {
                                return response_internal_server_error(err).unwrap();
                            }
                        };
                        
                        response_builder(StatusCode::OK)
                            .header(
                                CONTENT_TYPE,
                                if from_slice::<Value>(&serialized).is_ok() {
                                    HeaderValue::from_static("application/json")
                                } else {
                                    HeaderValue::from_static("text/plain")
                                },
                            )
                            .body(serialized)
                            .unwrap()
                    }
                    Err(e) => response_internal_server_error(e).unwrap(),
                }
            },
        )
    };

    expanded.into()
}

/// 批量普通函数宏
/// 用于同时处理多个普通函数，将它们包装成HTTP处理函数并转换为(name, handler)元组的集合
/// 用法: register_apis![function1, function2, function3]
/// 返回一个Vec<(String, fn(http::Request<Vec<u8>>) -> http::Response<Vec<u8>>)>
#[proc_macro]
pub fn register_apis(input: TokenStream) -> TokenStream {
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
                move |request: http::Request<Vec<u8>>| -> http::Response<Vec<u8>> {
                    // 定义必要的常量和辅助函数
                    use http::{header::CONTENT_TYPE, HeaderValue, Response, StatusCode};
                    use serde::{de::DeserializeOwned, Serialize};
                    use serde_json::{from_slice, to_vec, Value};
                    use std::string::ToString;
                    
                    // 响应构建器
                    fn response_builder(status_code: StatusCode) -> http::response::Builder {
                        http::Response::builder()
                            .status(status_code)
                            .header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"))
                            .header(http::header::ACCESS_CONTROL_EXPOSE_HEADERS, "Tauri-Response")
                            .header("Tauri-Response", "ok")
                    }
                    
                    fn response_bad_request<S: ToString>(content: S) -> http::Result<http::Response<Vec<u8>>> {
                        response_builder(StatusCode::BAD_REQUEST)
                            .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                            .body(content.to_string().into_bytes())
                    }
                    
                    fn response_internal_server_error<S: ToString>(content: S) -> http::Result<http::Response<Vec<u8>>> {
                        response_builder(StatusCode::INTERNAL_SERVER_ERROR)
                            .header(CONTENT_TYPE, HeaderValue::from_static("text/plain"))
                            .body(content.to_string().into_bytes())
                    }
                    
                        // 尝试反序列化请求体
                    let request_body = request.into_body();
                    // 直接尝试反序列化，让编译器自动推断类型
                    let d = match from_slice(&request_body) {
                        Ok(d) => d,
                        Err(e) => {
                            return response_bad_request(e).unwrap();
                        }
                    };
                    
                    // 调用自定义命令
                    let r: Result<_, _> = #func_name(d);
                    
                    // 根据结果构建响应
                    match r {
                        Ok(output) => {
                            // 序列化成功结果
                            let serialized = match to_vec(&output) {
                                Ok(bytes) => bytes,
                                Err(err) => {
                                    return response_internal_server_error(err).unwrap();
                                }
                            };
                            
                            response_builder(StatusCode::OK)
                                .header(
                                    CONTENT_TYPE,
                                    if from_slice::<Value>(&serialized).is_ok() {
                                        HeaderValue::from_static("application/json")
                                    } else {
                                        HeaderValue::from_static("text/plain")
                                    },
                                )
                                .body(serialized)
                                .unwrap()
                        }
                        Err(e) => response_internal_server_error(e).unwrap(),
                    }
                },
            )
        }
    });
    
    // 生成包含所有元组的Vec
    let expanded = quote! {
        vec![#(#tuples),*]
    };
    
    expanded.into()
}
