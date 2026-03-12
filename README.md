# 🛡️ NateFlux | DevSecOps Pipeline Orchestrator

## Core Concept
NateFlux is a "Single Pane of Glass" architecture designed to orchestrate DevSecOps workflows. It seamlessly triggers **GitLab CI/CD** for security scanning and **HCP Terraform** for infrastructure provisioning simultaneously from a modern Next.js interface. This unified approach ensures that code is both secure and deployable before it reaches production.

## Tech Stack
- **Frontend/Orchestration**: Next.js 15, TypeScript, Tailwind CSS
- **CI/CD & Security**: GitLab CI/CD
- **Infrastructure**: HCP Terraform (Terraform Cloud)
- **Blockchain Integration**: Wagmi/Viem (for potential future Web3 features)

## Troubleshooting

### '422 Configuration Version' Error in HCP Terraform
We encountered a `422 Unprocessable Entity` error when creating configuration versions in HCP Terraform. This was resolved by:
1.  **Ensuring a Non-Empty `main.tf`**: The upload process requires a valid Terraform configuration file. We ensured that the `infrastructure/terraform/main.tf` file was present and contained valid HCL code before packaging.
2.  **Synced VCS Connection**: We verified that the VCS connection between HCP Terraform and the repository was correctly configured and synced, allowing for proper state management and run triggering.
