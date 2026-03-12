
data "tfe_slug" "policies" {
  source_path = "../../policies/oci-governance-policies"
}

data "tfe_workspace" "microservice" {
  name         = "NateFlux"
  organization = "NateFlux"
}

resource "tfe_policy_set" "governance" {
  name          = "oci-governance-policies"
  description   = "Sentinel policies for OCI governance, enforcing security and compliance standards."
  organization  = "NateFlux"
  slug          = data.tfe_slug.policies
  workspace_ids = [data.tfe_workspace.microservice.id]
  overridable   = false
  kind          = "sentinel"
}
