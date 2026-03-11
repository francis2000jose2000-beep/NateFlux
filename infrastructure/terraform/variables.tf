variable "oci_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "oci_private_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "tenancy_ocid" {
  type      = string
  sensitive = true
}

variable "user_ocid" {
  type      = string
  sensitive = true
}

variable "region" {
  type = string
}

variable "compartment_ocid" {
  type      = string
  sensitive = true
}

variable "compartment_name" {
  type = string
}

variable "oci_auth" {
  type    = string
  default = "SecurityToken"
}

variable "fingerprint" {
  type      = string
  sensitive = true
  default   = ""
}

variable "private_key_path" {
  type      = string
  sensitive = true
  default   = ""
}

variable "security_token_file" {
  type      = string
  sensitive = true
  default   = ""
}

variable "vcn_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "allowed_ingress_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "container_instance_ocpus" {
  type    = number
  default = 1
}

variable "container_instance_memory_gbs" {
  type    = number
  default = 6
}

variable "ocir_repository_name" {
  type    = string
  default = "portfolio-api"
}

variable "ocir_repository_is_public" {
  type    = bool
  default = false
}

variable "ocir_region_key" {
  type = string
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "idcs_endpoint" {
  type    = string
  default = ""
}

variable "gitlab_issuer" {
  type    = string
  default = "https://gitlab.com"
}

variable "gitlab_audience" {
  type    = string
  default = "https://gitlab.com"
}

variable "gitlab_jwks_url" {
  type    = string
  default = "https://gitlab.com/-/jwks"
}

variable "gitlab_subject" {
  type    = string
  default = "project_path:YOUR_GROUP/YOUR_PROJECT:ref_type:branch:ref:main"
}

variable "idcs_oauth_client_id" {
  type    = string
  default = ""
}

