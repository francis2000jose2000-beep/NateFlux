terraform {
  cloud {
    organization = "DevSecOps_Pipeline_Project"

    workspaces {
      name = "DevSecOps_Pipeline_Project"
    }
  }
}

# This is a "fake" resource that just prints a message. 
# It proves your Next.js app is talking to Terraform!
resource "null_resource" "orchestration_test" {
  provisioner "local-exec" {
    command = "echo 'Success: DevSecOps Orchestrator has triggered Terraform!'"
  }
}