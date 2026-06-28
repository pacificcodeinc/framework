# Framework

An agent harness for building domain-specific workflows.

## Structure

- `apps/desktop` — Electron shell (electron-vite)
- `packages/app` — the shared React application
- `packages/ui` — design system: Tailwind CSS v4 + shadcn-style components

## Development

```sh
pnpm install
pnpm dev          # starts the Electron app with HMR
pnpm build        # builds all packages
pnpm typecheck    # typechecks all packages
```

### NixOS

The npm-downloaded Electron binary cannot run on NixOS. Use the flake dev
shell, which provides Electron from nixpkgs and points electron-vite at it
(via `ELECTRON_EXEC_PATH` / `ELECTRON_OVERRIDE_DIST_PATH`):

```sh
nix develop -c pnpm dev   # or, if you use direnv: `direnv allow` once, then just `pnpm dev`
```

### Screenshots

`FRAMEWORK_CAPTURE=/path/out.png pnpm dev` renders the window offscreen,
saves a PNG, and exits — handy for visual checks without a window popping up.
