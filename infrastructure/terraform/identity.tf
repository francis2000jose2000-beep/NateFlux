resource "oci_identity_group" "gitlab_pipeline" {
  compartment_id = var.tenancy_ocid
  name           = "gitlab-pipeline"
  description    = "GitLab CI pipeline principals (OIDC via Identity Propagation Trust)"
}

resource "oci_identity_policy" "gitlab_pipeline" {
  compartment_id = var.compartment_ocid
  name           = "gitlab-pipeline-policy"
  description    = "Allows GitLab pipeline to manage OCI Container Instances + OCIR repos"

  statements = [
    "Allow group ${oci_identity_group.gitlab_pipeline.name} to manage container-instances in compartment ${var.compartment_name}",
    "Allow group ${oci_identity_group.gitlab_pipeline.name} to manage repos in compartment ${var.compartment_name}"
  ]
}

resource "oci_identity_domains_identity_provider" "gitlab" {
  count         = var.idcs_endpoint == "" ? 0 : 1
  idcs_endpoint = var.idcs_endpoint
  schemas       = ["urn:ietf:params:scim:schemas:oracle:idcs:IdentityProvider"]
  name          = "gitlab"
  enabled       = true
}

resource "oci_identity_domains_identity_propagation_trust" "gitlab_jwt" {
  count         = var.idcs_endpoint == "" ? 0 : 1
  idcs_endpoint = var.idcs_endpoint
  schemas       = ["urn:ietf:params:scim:schemas:oracle:idcs:IdentityPropagationTrust"]

  name                    = "gitlab-jwt"
  active                  = true
  type                    = "JWT"
  issuer                  = var.gitlab_issuer
  subject_claim_name      = "sub"
  subject_type            = "User"
  subject_mapping_attribute = "userName"
  client_claim_name       = "aud"
  client_claim_values     = [var.gitlab_audience]
  public_key_endpoint     = var.gitlab_jwks_url
  oauth_clients           = var.idcs_oauth_client_id == "" ? [] : [var.idcs_oauth_client_id]
}

