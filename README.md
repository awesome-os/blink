# `@awesome-os/blink`

Modular Blink HTML/CSS/DOM component shard wired to Awesome-OS **`b8g-ghost @ cas-v1`** for **Sectium Browser** and **`libelectron`**.

## Why Modular Shards Eliminate 4-Hour Monolith Rebuilds

Traditional Chromium and Electron builds compile V8, Skia, Dawn, Blink, and dozens of C/C++ third-party libraries into a single multi-gigabyte monolith — turning even minor DOM or UI changes into 4-hour rebuilds and multi-minute links.

`awesome-os/blink` breaks that monolith into independently cached, content-addressed (`sha256`) component shards composed at link and runtime:

| Layer | Upstream Shard Repo | Role in Composition |
| :--- | :--- | :--- |
| **JS Runtime** | [`awesome-os/libv8_monolith`](https://github.com/awesome-os/libv8_monolith) | Shared V8 dynamic library & external startup snapshot (`v8-shared-*` in `cas-v1`) |
| **2D Graphics** | [`awesome-os/skia`](https://github.com/awesome-os/skia) | Externalized Skia 2D canvas & text rasterization shard |
| **WebGPU / GPU** | [`awesome-os/dawn`](https://github.com/awesome-os/dawn) | Externalized Dawn WebGPU backend shard |
| **Core C Shards & ABI** | [`awesome-os/b8g-ghost`](https://github.com/awesome-os/b8g-ghost) (`cas-v1`) | Pre-built 5-OS `libbrotli`, `libwebp`, `libexpat`, `libsqlite3`, `liblz4`, `libsectium_display`, and `b8g-ghost-abi` |
| **HTML / CSS / DOM** | `awesome-os/blink` *(this repo)* | Component-build GN overlay (`config/blink-component-cas.gn`) + live `cas-v1` hydration & audit engine |

Because V8, Skia, Dawn, and all core C libraries are hydrated in $O(1)$ from `b8g-ghost @ cas-v1` instead of recompiled from source, Blink compiles and links purely as a thin component shard on top of pre-verified binaries.

## Repository Layout

- `config/blink-component-cas.gn` — Chromium Blink component GN overlay (`is_component_build = true`, `v8_use_external_startup_data = true`, `use_system_libbrotli = true`, `use_system_libwebp = true`, `use_system_expat = true`, targeting `cas-v1` `v8`, `skia`, `dawn`, and `libsectium_display`).
- `src/hydrate.mts` — Resolves and audits live Blink prerequisite shards from `awesome-os/b8g-ghost @ cas-v1` and parses `config/blink-component-cas.gn`.
- `src/index.mts` — Public erasable TypeScript module exports.
- `test/blink-cas.test.mts` — Live `cas-v1` shard resolution and GN overlay validation test suite.

## Usage

Runs directly on Node.js 22.18+ / 24+ using native erasable TypeScript (zero build step):

```bash
# Run verification suite
node --test test/blink-cas.test.mts

# Print live JSON audit of all Blink cas-v1 prerequisite shards
node src/hydrate.mts
```

## License

BSD-3-Clause
