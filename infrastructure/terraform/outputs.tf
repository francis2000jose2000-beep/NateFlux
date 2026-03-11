output "ocir_repo_path" {
  value = local.ocir_repo_path
}

output "container_instance_id" {
  value = oci_container_instances_container_instance.api.id
}

output "public_ip" {
  value = try(oci_container_instances_container_instance.api.vnics[0].public_ip, null)
}

