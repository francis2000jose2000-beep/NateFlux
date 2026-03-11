
data "tfe_slug" "policies" {
  source_path = "../../policies/oci-governance-policies"
}

data "tfe_workspace" "microservice" {
  name         = "DevSecOps_Pipeline_Project"
  organization = "DevSecOps_Pipeline_Project"
}

resource "tfe_policy_set" "governance" {
  name          = "oci-governance-policies"
  description   = "Sentinel policies for OCI governance, enforcing security and compliance standards."
  organization  = "DevSecOps_Pipeline_Project"
  slug          = data.tfe_slug.policies
  workspace_ids = [data.tfe_workspace.microservice.id]
  overridable   = false
  kind          = "sentinel"
}
