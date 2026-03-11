# Enterprise Node.js AWS Pipeline

This repository is a production-grade "IaC + CI/CD showcase" centered on a single TypeScript microservice running on **Oracle Cloud Infrastructure (OCI) Container Instances** (Always Free-friendly), provisioned by **Terraform (HCL)**, and deployed by a **GitLab CI/CD pipeline using OIDC** (no static OCI API keys).

## 🏗 Architectural High-Points

- **Zero-Trust Security:** Authenticates to AWS via **OpenID Connect (OIDC)**. No long-lived IAM keys are stored in GitLab.
- **Infrastructure as Code (IaC):** AWS CDK v2 provisions all cloud resources to ensure environment parity and drift detection.
- **Automated Quality Gates:** The pipeline enforces 100% passing tests, linting, and security vulnerability scanning (SAST) before any deployment.
- **Node.js Excellence:** Built with TypeScript, utilizing clean architecture principles and containerized via Docker for Amazon ECS (Fargate).

## 🛠 Tech Stack

* **Runtime:** Node.js (v20+) / TypeScript
* **Infrastructure:** OCI (Container Instances, OCIR, VCN)
* **Pipeline:** GitLab CI/CD
* **IaC:** Terraform (HCL)
* **Security:** GitLab OIDC → OCI Identity Propagation Trust (JWT → UPST token exchange)

## 📂 Repository Structure

```text
├── .gitlab-ci.yml      # Multi-stage deployment pipeline
├── infrastructure/     # OCI Terraform definitions
├── src/                # Node.js source code (Clean Architecture)
├── tests/              # Unit, Integration, and E2E suites
├── Dockerfile          # Multi-stage production build
└── package.json        # Strict dependency management

```

## ✅ API Endpoints

- `GET /health` — readiness/liveness style health response
- `POST /audit` — sample endpoint that records an audit event and returns an `id`

## 🔐 GitLab CI/CD OIDC Variables

The pipeline expects the following GitLab CI/CD variables:

- `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_REGION`
- `OCI_IDCS_ENDPOINT` (identity domain URL)
- `OCI_IDCS_CLIENT_ID`, `OCI_IDCS_CLIENT_SECRET` (confidential app used for token exchange)
- `OCIR_REGISTRY` (e.g. `iad.ocir.io`), `OCIR_REPOSITORY` (e.g. `namespace/portfolio-api`)
- `OCIR_USERNAME`, `OCIR_AUTH_TOKEN` (registry push credentials)

## 🧱 Terraform

Terraform lives in `infrastructure/terraform` and is organized into:

- `network.tf` — VCN + public subnet + Internet Gateway
- `compute.tf` — OCIR repo + OCI Container Instance (`CI.Standard.A1.Flex`)
- `identity.tf` — GitLab pipeline group/policy + Identity Propagation Trust scaffolding

## 🏁 Local Commands

- Install service deps: `npm ci`
- Run lint + tests: `npm run lint && npm test`
- Run service locally: `npm run dev`
