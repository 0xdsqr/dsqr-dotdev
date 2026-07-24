{
  lib,
  paths,
}:
let
  root = ../..;
in
lib.fileset.toSource {
  inherit root;
  fileset = lib.fileset.intersection (lib.fileset.unions paths) (lib.fileset.gitTracked root);
}
