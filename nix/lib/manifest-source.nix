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
    type == "directory"
    || builtins.elem name [
      "package-lock.json"
      "package.json"
    ];
}
