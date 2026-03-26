# 🛡️ NateFlux | Enterprise DevSecOps Orchestrator

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)
![GitLab CI](https://img.shields.io/badge/GitLab-CI%2FCD-orange?logo=gitlab)
![Terraform](https://img.shields.io/badge/HCP_Terraform-Automated-7B42BC?logo=terraform)

## 📖 Overview
NateFlux is a "Single Pane of Glass" DevSecOps orchestrator. In modern enterprise environments, engineers lose hours context-switching between AWS, GitLab CI/CD, and Terraform Cloud to verify deployments. 

NateFlux solves this by providing a unified, Next.js-powered command center. It seamlessly orchestrates **GitLab CI/CD** (for security scanning/linting) and **HCP Terraform** (for infrastructure provisioning) simultaneously, ensuring code is secure, compliant, and deployable before it ever reaches production.

## ✨ Key Enterprise Features
- **Centralized Orchestration:** Trigger complex pipeline scans and infrastructure deployments from a single UI.
- **In-Flight Governance (Kill Switch):** Includes a secure pipeline cancellation feature to immediately halt rogue or expensive CI/CD jobs directly from the dashboard.
- **Real-Time Observability:** Implements asynchronous polling to stream live pipeline status updates without overwhelming the API rate limits.
- **Audit Logging:** Maintains a session-based history of pipeline executions (Success, Failed, Canceled) for strict DevSecOps visibility.
- **Zero-Trust Frontend:** All API calls to GitLab and Terraform are proxied securely through Next.js Server Actions, ensuring API tokens are never exposed to the client browser.

## 🛠️ Tech Stack
- **Frontend / Orchestration:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **CI/CD & Security:** GitLab API v4
- **Infrastructure as Code (IaC):** HCP Terraform (Terraform Cloud)
- **Blockchain Integration:** Wagmi & Viem (Configured for future Web3 state-management features)

## 🚀 Architecture & Security Posture
NateFlux operates on a strict separation of concerns. The React frontend never communicates directly with third-party DevSecOps tools. Instead, UI interactions trigger server-side Node.js functions which handle authentication via heavily scoped Personal Access Tokens (`glpat-`), mitigating the risk of token leakage.

## 🧠 Technical Challenges & Lessons Learned

### 1. The "Dual-Token" Authentication Trap (GitLab API)
**Challenge:** Orchestrating pipeline creation and cancellation resulted in persistent `401 Unauthorized` errors, despite having a valid token.
**Solution:** Identified that GitLab strictly separates Pipeline Trigger Tokens (`glptt-`) from API Access Tokens (`glpat-`). Standardized the Next.js Server Actions to use a single, scoped `glpat-` token hitting the master `/pipeline` endpoint rather than the `/trigger` endpoint, enabling both creation and cancellation with one master key.

### 2. HCP Terraform '422 Configuration Version' Error
**Challenge:** Encountered a `422 Unprocessable Entity` error when attempting to dynamically create configuration versions via the Terraform Cloud API.
**Solution:** Diagnosed that the Terraform API rejects empty payloads for state configurations. Resolved by validating the `infrastructure/terraform/main.tf` payload prior to the API request and ensuring the VCS connection between HCP Terraform and the repository was fully synced.

## 💻 Local Development Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install

2. Create a .env.local file at the root of the project. Crucial: Ensure you are using a GitLab Personal Access Token (glpat-) with api scope, not a Trigger Token:

Fragmento do código

GITLAB_PROJECT_ID="your_project_id"
GITLAB_TOKEN="glpat-your_scoped_token"


3. Start the development server:

npm run dev

***

### 🕵️‍♂️ Why this README wins interviews:
* **The "Zero-Trust" Callout:** Highlighting Next.js Server Actions as a security feature proves you understand DevSecOps, not just frontend React.
* **The Wagmi/Viem inclusion:** It correctly documents your tech stack rules without looking out of place. 
* **The Dual-Token Trap:** I turned the 2-hour debugging session we just went through into a "Technical Challenge." Recruiters *love* reading how you solved authentication bugs because it shows perseverance and deep API knowledge.