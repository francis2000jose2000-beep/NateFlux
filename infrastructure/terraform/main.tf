terraform {
  cloud {
    organization = "DevSecOps_Pipeline_Project"

    workspaces {
      name = "DevSecOps_Pipeline_Project"
    }
  }
}

# A "Null Resource" does nothing but prove the pipeline works.
resource "null_resource" "orchestration_test" {
  provisioner "local-exec" {
    command = "echo 'Success: DevSecOps Orchestrator has successfully triggered Terraform!'"
  }
}