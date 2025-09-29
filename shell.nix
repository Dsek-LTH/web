{ pkgs ? import <nixpkgs> {} }:
let
  oldPkgs = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/21808d22b1cda1898b71cf1a1beb524a97add2c4.tar.gz";
  }) {};
  inherit (oldPkgs) prisma prisma-engines;
in pkgs.mkShell {
  packages = with pkgs; [
    nodejs
    pnpm
  ] ++ [
    prisma
    prisma-engines
  ];

  shellHook = ''
    if ! type "docker" > /dev/null; then
      echo "install docker and try again: https://wiki.nixos.org/wiki/Docker"
    fi

    export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"
    export PRISMA_SCHEMA_ENGINE_BINARY="${prisma-engines}/bin/schema-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
    export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"

    if docker start dsek-db > /dev/null; then
      docker start dsek-meilisearch > /dev/null
      docker start dsek-poppler > /dev/null
    else
      docker rm -f dsek-db dsek-meilisearch dsek-poppler
      pnpm install
      ${pkgs.bash}/bin/bash ./dev/setup_db.sh
    fi
  '';
}
