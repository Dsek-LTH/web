{
  pkgs ? import <nixpkgs> { },
}:
let
  inherit (pkgs) nodejs_24 pnpm_12 openssl go;
in
pkgs.mkShell {
  packages = [
    nodejs_24
    pnpm_12
    openssl
    go
  ];

  shellHook = ''
    onExit() {
      docker compose down

      # nix specific
      _nix_shell_clean_tmpdir
      exitHandler
    }

    if ! type "docker" > /dev/null; then
      echo "install docker and try again: https://wiki.nixos.org/wiki/Docker"
      exit 1
    fi

    trap onExit EXIT

    # Stop pnpm from replacing itself with the exact version in "packageManager",
    # since the binary it downloads can't run on NixOS.
    export pnpm_config_pm_on_fail="ignore"

    export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"

    docker compose up -d
  '';
}
