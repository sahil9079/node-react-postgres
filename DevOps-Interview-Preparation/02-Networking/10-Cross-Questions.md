# Networking Cross-Questioning Drill

### Initial Question: "What is the difference between Security Groups and NACLs in AWS?"
* **Candidate Answer:** *"Security Groups are stateful and operate at the instance level; NACLs are stateless and operate at the subnet level."*
* **Cross-Question 1:** *"What does 'stateful' mean in practical terms when an EC2 instance sends an outbound request?"*
  * **Strong Answer:** *"Because Security Groups are stateful, if an outbound request is permitted, the return response traffic is automatically allowed back in, regardless of inbound rules. For stateless NACLs, both outbound traffic and inbound response traffic on ephemeral ports (1024-65535) must be explicitly allowed."*
