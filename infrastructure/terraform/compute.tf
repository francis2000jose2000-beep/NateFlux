data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

resource "oci_artifacts_container_repository" "api" {
  compartment_id = var.compartment_ocid
  display_name   = var.ocir_repository_name
  is_public      = var.ocir_repository_is_public
}

resource "oci_container_instances_container_instance" "api" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  shape = "VM.Standard2.1"

  shape_config {
    ocpus         = var.container_instance_ocpus
    memory_in_gbs = var.container_instance_memory_gbs
  }

  vnics {
    subnet_id             = oci_core_subnet.public.id
    is_public_ip_assigned = true
  }

  containers {
    display_name = "api"
    image_url    = local.image_url

    environment_variables = {
      NODE_ENV  = "production"
      LOG_LEVEL = "info"
      PORT      = tostring(var.app_port)
    }
  }
}

