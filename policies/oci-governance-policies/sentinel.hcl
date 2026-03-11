policy "restrict-oci-shapes" {
    source = "./restrict-oci-shapes.sentinel"
    enforcement_level = "hard-mandatory"
}

policy "restrict-ssh-access" {
    source = "./restrict-ssh-access.sentinel"
    enforcement_level = "hard-mandatory"
}
