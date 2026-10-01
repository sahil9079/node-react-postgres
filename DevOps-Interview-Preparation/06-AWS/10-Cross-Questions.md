# AWS Cross-Questioning Drill

### Initial Question: "How do you securely give an EC2 instance access to an S3 bucket?"
* **Candidate Answer:** *"I attach an IAM Role to the EC2 instance."*
* **Cross-Question 1:** *"How does the EC2 instance actually get the credentials at runtime?"*
  * **Strong Answer:** *"The instance accesses the **Instance Metadata Service (IMDSv2)** at `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>`. AWS STS automatically provisions temporary, rotating access keys, secret keys, and session tokens to the instance, eliminating any hardcoded credentials."*
