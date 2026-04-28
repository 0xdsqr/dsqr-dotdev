{ lib }:
let
  root = ../..;
in
lib.cleanSourceWith {
  src = root;
  filter =
    path: type:
    let
      name = baseNameOf (toString path);
    in
    if type == "directory" then
      !(builtins.elem name [
        ".direnv"
        ".git"
        ".tanstack"
        ".turbo"
        ".vinxi"
        "dist"
        "node_modules"
        "result"
      ])
    else
      !(builtins.elem name [
        ".DS_Store"
      ]);
}
