terraform {
  cloud {
    organization = "NateFlux"
    workspaces {
      name = "NateFlux"
    }
  }

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0.0"
    }
  }
}

provider "oci" {
  auth           = "SecurityToken"
  region         = var.region
  security_token = var.oci_token
  private_key    = var.oci_private_key
}

provider "tfe" {
  # Configuration options provided via environment variables
}
