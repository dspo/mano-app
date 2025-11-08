example-greet-prepare:
	cd examples/apps/greet && pnpm install && pnpm build

example-greet: example-greet-prepare
	cargo run --example greet

run:
	cargo run -p mano-app