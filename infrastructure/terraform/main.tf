terraform {
  cloud {
    organization = "NateFlux"

    workspaces {
      name = "NateFlux"
    }
  }
}

# This is a "fake" resource that just prints a message. 
# It proves your Next.js app is talking to Terraform!
resource "null_resource" "orchestration_test" {
  provisioner "local-exec" {
    command = "echo 'Success: NateFlux has triggered Terraform!'"
  }
}