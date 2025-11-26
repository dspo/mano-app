mano-app-dev:
	cd mano-app && pnpm dev

dev:
	cargo tauri dev

build:
	cargo tauri build

clean:
	rm -rf mano-app/dist mano-tauri/target
