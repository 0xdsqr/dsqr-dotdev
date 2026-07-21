# hub-a reconciliation evidence

Evidence captured on 2026-07-21 for the `hub-a` Argo CD installation.

## Webhook request controls

- The public route accepts only `POST /api/webhook` on `argocd-hooks-hub-a.dsqr.dev`.
- Traefik limits request bodies to 5 MiB (`5242880` bytes) and buffers at most 1 MiB in memory.
- Argo CD declares `webhook.maxPayloadSizeMB: "5"` in its Pulumi-owned Helm values.
- A 6 MiB request was rejected with HTTP `413`.
- A small request without a valid GitHub HMAC was rejected with HTTP `400`.

## HMAC rotation

- The Vault KV secret `homelab/platform/argocd/webhooks/github` was rotated from version 1 to version 2.
- External Secrets reconciled version 2 into `argocd/argocd-github-webhook` and reported `SecretSynced=True`.
- The Kubernetes Secret and Vault value were compared by SHA-256 digest without printing the secret.
- GitHub hooks for `0xdsqr/dsqr-dotdev`, `0xdsqr/fidara`, and `0xdsqr/tastingswithtay` were updated to version 2.
- A fresh signed GitHub ping through each hook returned HTTP `200`.

## Polling fallback

The `dsqr-dotdev` GitHub hook was temporarily disabled before pushing commit
`a5662e3db5d6390e56dc3be8b0408810bdf09d61`.

- Push completed: `2026-07-21T17:54:16Z`
- Argo `reconciledAt`: `2026-07-21T17:54:53Z`
- Read-side verification completed: 38 seconds after the push
- Result: `Synced` and `Healthy`
- The GitHub hook was restored immediately after the test.

This satisfies the polling fallback target of 180 seconds or less.

## Signed webhook refresh

Commit `9122903461cdd7dc913b64aec0fa973819cdda6b` was pushed after the HMAC rotation.

- Push completed: `2026-07-21T17:58:00Z`
- GitHub signed delivery: HTTP `200` at `2026-07-21T17:58:02.063Z`
- Argo `reconciledAt`: `2026-07-21T17:58:02Z`
- Read-side verification completed: 13 seconds after the push
- Result: `Synced` and `Healthy`

This satisfies the signed-webhook target of 30 seconds or less.

## Final deployment verification

The Pulumi-owned Argo CD Helm release was updated on the Kubernetes master.

- `argocd-cm` reports `webhook.maxPayloadSizeMB: "5"`.
- Traefik reports `maxRequestBodyBytes: 5242880` and `memRequestBodyBytes: 1048576`.
- The Argo server and application-controller rollouts completed successfully.
- All 16 Applications report `Synced` and `Healthy`.
- All Argo workloads are Ready; the Redis secret initialization Job completed successfully.
- A repeated 6 MiB request returned HTTP `413` and an unsigned request returned HTTP `400`.
- A fresh signed GitHub ping after the rollout returned HTTP `200`.
