{
  pkgs ? import <nixpkgs> { },
}:
let
  inherit (pkgs) nodejs pnpm go;
in
pkgs.mkShell {
  packages = [
    nodejs
    pnpm
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

    export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"

    docker compose up -d
  '';
}
