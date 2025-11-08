example-greet-prepare:
	cd crates/gpui-wry/examples/apps/greet && pnpm install && pnpm build

example-greet: example-greet-prepare
	cd crates/gpui-wry && cargo run --example greet

run:
	cargo run -p mano-app