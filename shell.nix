{
  pkgs ? import <nixpkgs> { },
}:
let
  oldPkgs = import (pkgs.fetchFromGitHub {
    owner = "nixos";
    repo = "nixpkgs";
    rev = "21808d22b1cda1898b71cf1a1beb524a97add2c4";
    hash = "sha256-j4HeaLw1LZxkCvuOxdO1xTnPYLSOQuzOjGEuCK80X2w=";
  }) { };
  inherit (pkgs) nodejs pnpm;
  inherit (oldPkgs) prisma prisma-engines;
in
pkgs.mkShell {
  packages = [
    nodejs
    pnpm
    prisma
    prisma-engines
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
    export PRISMA_SCHEMA_ENGINE_BINARY="${prisma-engines}/bin/schema-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
    export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"

    docker compose up -d
  '';
}
