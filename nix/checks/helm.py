"""Offline chart contracts; synthetic digests and names are never deploy values."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile

import jsonschema
import yaml

chart, kubernetes_file, gateway_file = map(Path, sys.argv[1:])
digest = "sha256:" + "a" * 64


def strict_schema(value):
    """Translate Kubernetes OpenAPI's int-or-string and reject unknown fields."""
    if isinstance(value, list):
        return [strict_schema(item) for item in value]
    if not isinstance(value, dict):
        return value
    if value.get("format") == "int-or-string" or value.get("x-kubernetes-int-or-string"):
        return {"anyOf": [{"type": "integer"}, {"type": "string"}]}
    result = {key: strict_schema(item) for key, item in value.items()}
    if result.get("type") == "object" and "properties" in result:
        result.setdefault("additionalProperties", False)
    return result


definitions = strict_schema(json.loads(kubernetes_file.read_text())["definitions"])
validators = {}
for name, definition in definitions.items():
    for gvk in definition.get("x-kubernetes-group-version-kind", []):
        version = "/".join(filter(None, [gvk["group"], gvk["version"]]))
        validators[(version, gvk["kind"])] = jsonschema.Draft4Validator(
            {"$ref": f"#/definitions/{name}", "definitions": definitions}
        )
crd = yaml.safe_load(gateway_file.read_text())
route_schema = next(v["schema"]["openAPIV3Schema"] for v in crd["spec"]["versions"] if v["name"] == "v1")
validators[("gateway.networking.k8s.io/v1", "HTTPRoute")] = jsonschema.Draft7Validator(strict_schema(route_schema))


def helm(command, application, overrides, success=True):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as values:
        json.dump(overrides, values)
        values.flush()
        args = ["helm", command]
        if command == "template":
            args.append(f"test-{application}")
        args += [str(chart), "--namespace", "test-apps", "--kube-version", "1.36.0",
                 "-f", str(chart / f"values-{application}.yaml"), "-f", values.name]
        if command == "lint":
            args.append("--strict")
        result = subprocess.run(args, text=True, capture_output=True)
        if success and result.returncode:
            raise AssertionError(result.stdout + result.stderr)
        if not success:
            assert result.returncode != 0, f"Unsafe values accepted: {overrides}"
            assert "schema" in result.stderr.lower(), result.stderr
        return result.stdout


def check(application, overrides):
    helm("lint", application, overrides)
    rendered = helm("template", application, overrides)
    assert rendered == helm("template", application, overrides), "Non-deterministic rendering"
    documents = [d for d in yaml.safe_load_all(rendered) if d]
    resources = {d["kind"]: d for d in documents}
    expected = {"Deployment", "Service", "ServiceAccount", "NetworkPolicy"}
    if application != "dotdev":
        expected.add("PodDisruptionBudget")
    if overrides.get("route", {}).get("enabled"):
        expected.add("HTTPRoute")
    assert len(documents) == len(expected) and set(resources) == expected
    for document in documents:
        validators[(document["apiVersion"], document["kind"])].validate(document)
        assert document["metadata"]["namespace"] == "test-apps"
        assert document["metadata"]["name"] == f"test-{application}"
    deployment = resources["Deployment"]["spec"]
    pod = deployment["template"]["spec"]
    selector = deployment["selector"]["matchLabels"]
    labels = deployment["template"]["metadata"]["labels"]
    assert all(labels[key] == value for key, value in selector.items())
    assert resources["Service"]["spec"]["selector"] == selector
    assert resources["Service"]["spec"]["type"] == "ClusterIP"
    assert resources["Service"]["spec"]["ports"] == [{"name": "http", "port": 80, "targetPort": "http", "protocol": "TCP"}]
    assert not pod["automountServiceAccountToken"] and not pod["enableServiceLinks"]
    assert not resources["ServiceAccount"]["automountServiceAccountToken"]
    assert pod["serviceAccountName"] == f"test-{application}"
    assert pod["securityContext"]["runAsNonRoot"]
    assert pod["securityContext"]["runAsUser"] == 10001
    assert pod["securityContext"]["seccompProfile"] == {"type": "RuntimeDefault"}
    assert len(pod["containers"]) == 1
    container = pod["containers"][0]
    image_name = {"dotdev": "dotdev-web", "labs": "dotdev-labs", "studio": "dotdev-studio"}[application]
    repository = overrides["image"].get("repository", f"ghcr.io/0xdsqr/{image_name}")
    assert container["image"] == f"{repository}@{digest}"
    assert container["securityContext"] == {
        "allowPrivilegeEscalation": False, "readOnlyRootFilesystem": True,
        "capabilities": {"drop": ["ALL"]},
    }
    for probe in ["startupProbe", "livenessProbe", "readinessProbe"]:
        path = "/api/healthz" if probe == "readinessProbe" else "/api/livez"
        assert container[probe]["httpGet"] == {"path": path, "port": "http"}
    assert set(container["resources"]) == {"limits", "requests"}
    expressions = pod["affinity"]["nodeAffinity"]["requiredDuringSchedulingIgnoredDuringExecution"]["nodeSelectorTerms"]
    assert expressions == [{"matchExpressions": [
        {"key": "platform.dsqr.dev/node-pool", "operator": "In", "values": ["applications"]},
        {"key": "kubernetes.io/os", "operator": "In", "values": ["linux"]},
    ]}]
    assert pod["tolerations"] == [{"key": "platform.dsqr.dev/dedicated", "operator": "Equal", "value": "applications", "effect": "NoSchedule"}]
    policy = resources["NetworkPolicy"]["spec"]
    assert policy["podSelector"]["matchLabels"] == selector
    assert policy["policyTypes"] == ["Ingress", "Egress"]
    assert len(policy["ingress"]) == 1
    ingress = policy["ingress"][0]
    assert ingress["ports"] == [{"protocol": "TCP", "port": 3000}]
    assert ingress["from"] == [{
        "namespaceSelector": {"matchLabels": {"kubernetes.io/metadata.name": "envoy-gateway-system"}},
        "podSelector": {"matchLabels": {
            "gateway.envoyproxy.io/owning-gateway-name": "shared",
            "gateway.envoyproxy.io/owning-gateway-namespace": "gateway-system",
        }},
    }]
    assert policy["egress"][0] == {
        "to": [{"namespaceSelector": {"matchLabels": {"kubernetes.io/metadata.name": "kube-system"}},
                "podSelector": {"matchLabels": {"k8s-app": "kube-dns"}}}],
        "ports": [{"protocol": "UDP", "port": 53}, {"protocol": "TCP", "port": 53}],
    }
    env = {e["name"]: e for e in container["env"]}
    if application == "dotdev":
        assert deployment["replicas"] == 1 and deployment["strategy"] == {"type": "Recreate"}
        assert "topologySpreadConstraints" not in pod
        assert env["DATABASE_URL"]["valueFrom"]["secretKeyRef"] == {"name": "test-db", "key": "DATABASE_URL"}
        assert env["PGSSLROOTCERT"]["value"] == "/etc/dsqr-db-ca/ca.crt"
        assert len(policy["egress"]) == 2
        assert policy["egress"][1] == {"to": [{"ipBlock": {"cidr": "192.0.2.10/32"}}], "ports": [{"protocol": "TCP", "port": 5432}]}
    else:
        assert deployment["replicas"] == 3
        assert deployment["strategy"]["rollingUpdate"] == {"maxSurge": 1, "maxUnavailable": 0}
        spread = pod["topologySpreadConstraints"][0]
        assert spread["topologyKey"] == "kubernetes.io/hostname"
        assert spread["maxSkew"] == 1 and spread["minDomains"] == 2
        assert spread["whenUnsatisfiable"] == "DoNotSchedule"
        assert spread["matchLabelKeys"] == ["pod-template-hash"]
        assert spread["labelSelector"]["matchLabels"] == selector
        assert resources["PodDisruptionBudget"]["spec"]["maxUnavailable"] == 1
        assert "DATABASE_URL" not in env and len(policy["egress"]) == 1
    if "HTTPRoute" in resources:
        route = resources["HTTPRoute"]["spec"]
        assert route["parentRefs"] == [{"name": "shared", "namespace": "gateway-system", "sectionName": "https"}]
        assert route["rules"][0]["backendRefs"] == [{"name": f"test-{application}", "port": 80}]
    print(f"Validated {application}: schemas, security, scheduling, policy and routing")


for application in ["dotdev", "labs", "studio"]:
    values = {"image": {"digest": digest}}
    if application == "dotdev":
        values["database"] = {"existingSecret": "test-db", "caConfigMap": "test-db-ca", "address": "192.0.2.10"}
    check(application, values)
    routed = copy.deepcopy(values)
    routed["route"] = {"enabled": True, "hostnames": [f"{application}.example.com"]}
    routed["trustedOrigins"] = [f"https://{application}.example.com"]
    check(application, routed)
    helm("template", application, {**values, "image": {"digest": ""}}, success=False)
    helm("template", application, {**values, "route": {"enabled": True}}, success=False)
    helm("template", application, {**values, "replicaCount": 0}, success=False)
    helm("template", application, {**values, "securityContext": {"privileged": True}}, success=False)

for invalid in [
    {"image": {"digest": "latest"}},
    {"image": {"digest": digest, "repository": "ghcr.io/0xdsqr/dotdev-labs:latest"}},
    {"image": {"digest": digest, "tag": "latest"}},
    {"trustedOrigins": ["*"]},
    {"trustProxy": "true"},
    {"resources": {"requests": {"cpu": "0"}}},
]:
    helm("template", "labs", {"image": {"digest": digest}, **invalid}, success=False)
helm("template", "dotdev", {"image": {"digest": digest}}, success=False)
helm("template", "dotdev", {
    "image": {"digest": digest}, "replicaCount": 3,
    "database": {"existingSecret": "test-db", "caConfigMap": "test-ca", "address": "192.0.2.10"},
}, success=False)
# Registry portability (Harbor later) and private image pull references.
check("labs", {"image": {"repository": "registry.example.com:8443/apps/labs", "digest": digest},
               "imagePullSecrets": [{"name": "test-pull"}]})
print("Rejected missing digests, tag references, unsafe/unknown values, incomplete DB/route and premature Dotdev HA")
