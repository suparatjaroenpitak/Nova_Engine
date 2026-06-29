# Nova Engine — Kubernetes manifests

Reference manifests for a single-namespace deployment. Adjust storage class, replicas, and
ingress host to suit your cluster.

```bash
kubectl apply -f deploy/k8s/
```

Production notes:
- Replace the example `nova-secrets` with values from your secret manager (Sealed Secrets /
  external-secrets / Vault).
- Put an Ingress with TLS in front of `nova-web` and `nova-api`.
- For HA, scale `nova-api` (stateless) horizontally behind the Ingress; run `nova-api-migrate`
  as an init Job before rolling out a new version.
- Use managed Postgres/Redis/MinIO for production instead of the bundled StatefulSets where
  possible.
