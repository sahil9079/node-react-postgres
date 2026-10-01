# Terraform Cross-Questioning Drill

### Initial Question: "What does `terraform refresh` do?"
* **Candidate Answer:** *"It updates the state file with the real infrastructure in AWS."*
* **Cross-Question 1:** *"Does `terraform refresh` modify physical infrastructure in the cloud?"*
  * **Strong Answer:** *"No. `terraform refresh` is strictly a read operation. It queries the cloud provider APIs to read current resource attributes and updates the local state file to match reality. It does not create, update, or destroy any cloud resources."*
