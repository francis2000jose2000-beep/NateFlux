data "oci_objectstorage_namespace" "this" {}

locals {
  ocir_repo_path = "${var.ocir_region_key}.ocir.io/${data.oci_objectstorage_namespace.this.namespace}/${var.ocir_repository_name}"
  image_url      = "${local.ocir_repo_path}:${var.image_tag}"
}

