mano-ui-dev:
	cd mano-ui && pnpm dev

dev:
	cargo tauri dev

build:
	cargo tauri build

clean:
	rm -rf mano-ui/dist mano-tauri/target
