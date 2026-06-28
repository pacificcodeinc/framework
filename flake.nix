{
  description = "Framework dev environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "x86_64-linux"
        "aarch64-linux"
      ];
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.pnpm
              pkgs.electron
            ];

            # The npm-downloaded Electron binary cannot run on NixOS.
            # electron-vite honors ELECTRON_EXEC_PATH; the electron npm
            # module honors ELECTRON_OVERRIDE_DIST_PATH.
            ELECTRON_EXEC_PATH = "${pkgs.electron}/bin/electron";
            ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron}/libexec/electron";
            ELECTRON_SKIP_BINARY_DOWNLOAD = "1";
          };
        }
      );
    };
}
