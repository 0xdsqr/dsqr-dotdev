{
  linkWorkspacePackages = ''
    mkdir -p node_modules/@dsqr-dotdev
    rm -rf node_modules/dotdev
    rm -rf node_modules/studio
    rm -rf node_modules/@dsqr-dotdev/api
    rm -rf node_modules/@dsqr-dotdev/database
    rm -rf node_modules/@dsqr-dotdev/react
    rm -rf node_modules/@dsqr-dotdev/tsconfig
    ln -sfn "$PWD/apps/dotdev" node_modules/dotdev
    ln -sfn "$PWD/apps/studio" node_modules/studio
    ln -sfn "$PWD/packages/api" node_modules/@dsqr-dotdev/api
    ln -sfn "$PWD/packages/database" node_modules/@dsqr-dotdev/database
    ln -sfn "$PWD/packages/react" node_modules/@dsqr-dotdev/react
    ln -sfn "$PWD/packages/typescript-config" node_modules/@dsqr-dotdev/tsconfig
  '';

  removeWorkspacePackageLinks = ''
    rm -f "$out/app/node_modules/dotdev"
    rm -f "$out/app/node_modules/studio"
    rm -f "$out/app/node_modules/@dsqr-dotdev/api"
    rm -f "$out/app/node_modules/@dsqr-dotdev/database"
    rm -f "$out/app/node_modules/@dsqr-dotdev/react"
    rm -f "$out/app/node_modules/@dsqr-dotdev/tsconfig"
  '';
}
