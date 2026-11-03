# CI/CD

The web workflows (`.github/workflows/`) share the server tooling, secrets/variables and procedures documented in the API repository: `docs/CICD.md`.
Extra variable for this repo: `LL_PUBLIC_ORIGIN` (https origin baked into the build). Deployment is off until `DEPLOY_ENABLED=true`.
