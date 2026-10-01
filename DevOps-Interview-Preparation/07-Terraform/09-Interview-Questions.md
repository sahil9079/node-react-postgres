# Terraform Interview Question Bank

### Q1: What is the difference between `terraform.tfstate` and `terraform.tfstate.backup`?
**Answer:** `terraform.tfstate` contains the current mapped state of managed infrastructure after the most recent successful apply. `terraform.tfstate.backup` is an automatic snapshot of the state file created immediately prior to the latest modification, allowing recovery in case an apply operation fails or corrupts the primary state.
