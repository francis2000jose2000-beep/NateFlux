terraform {
  cloud {
    organization = "DevSecOps_Pipeline_Project"

    workspaces {
      name = "DevSecOps_Pipeline_Project"
    }
  }
}

# This is a "dummy" resource that just proves the connection works.
resource "null_resource" "pipeline_test" {
  provisioner "local-exec" {
    command = "echo 'DevSecOps Pipeline Triggered Successfully!'"
  }
}