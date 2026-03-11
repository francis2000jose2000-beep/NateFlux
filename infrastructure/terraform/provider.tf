terraform {
  cloud {
    organization = "DevSecOps_Pipeline_Project"
    workspaces {
      name = "DevSecOps_Pipeline_Project"
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
