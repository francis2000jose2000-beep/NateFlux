terraform {
  cloud {
    organization = "DevSecOps_Pipeline_Project"

    workspaces {
      name = "DevSecOps_Pipeline_Project"
    }
  }
}

# This is a "fake" resource that just proves the connection works.
# It doesn't cost money and doesn't need the CLI to run.
resource "null_resource" "orchestration_test" {
  provisioner "local-exec" {
    command = "echo 'DevSecOps Pipeline Successfully Triggered!'"
  }
}