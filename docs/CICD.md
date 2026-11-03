# Web CI/CD remediation (local, disabled)

Updated 2026-11-03. No production workflow/settings/VPS changes or push were performed. CI runs tests and an independent production artifact build on push/PR even with DEPLOY_ENABLED absent. Ubuntu 22.04 and Node 22.23.3 align the native dependency baseline with the VPS. Locked installs, required runtime/static files, private canary scan and extracted EN/AR runtime smoke are mandatory. Actual VPS compatibility is not established by a local build.

Production deploy.yml is workflow_dispatch only. It requires main, an explicitly approved full SHA equal to current main/GITHUB_SHA, DEPLOY_ENABLED exactly true, and literal deploy linklibrary-web (or rollback linklibrary-web with explicit release ID). Leave the variable absent. Builds run without production environment/SSH keys; a separate protected production job downloads/verifies the opaque archive, compares embedded public_origin with LL_PUBLIC_ORIGIN, then performs restricted SSH with EXIT and always-cleanup. It does not run npm or app code with deployment keys.

Manual public_origin must be trusted HTTPS. Independent CI uses reserved https://linklibrary.invalid and a fixture canary, never private production keys. All actions are pinned to upstream-verified commits in deploy/ACTION_PINS.json. Server flock serializes this repository with API deployments.

Before separately approved activation, administrators must protect main with PR/review and successful CI checks, block force-push/deletion/bypass, configure production main-only deployment and independent required reviewers with no self-review/admin bypass. Unsupported reviewer protection means keep deployment disabled. Select actual CI contexts after a real run; no settings were changed here.

Full design, installation hashes, source provenance/permission repair, rollback/disaster recovery, readiness checklist and regression blockers live in the API repository docs/CICD.md, DEPLOYMENT_SECURITY.md, VPS_MANUAL_REMEDIATION.md and REMEDIATION_REPORT.md. The audited active mutable release must not be used as a trusted source. Existing omerali.dev, api.omerali.dev, Strapi and PM2 remain outside scope.
