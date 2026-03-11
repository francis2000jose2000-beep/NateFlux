terraform {
  required_version = ">= 1.6.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 6.0.0"
    }
    tfe = {
      source  = "hashicorp/tfe"
      version = "0.58.1"
    }
  }
}

