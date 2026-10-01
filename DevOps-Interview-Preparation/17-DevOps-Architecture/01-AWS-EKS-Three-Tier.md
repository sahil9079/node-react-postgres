# Enterprise AWS EKS Production Architecture
```
                                     INTERNET
                                        |
                                        v (Route 53 DNS + ACM SSL)
                       +---------------------------------+
                       |    AWS WAF + Public Subnets     |
                       |  Application Load Balancer(ALB) |
                       +---------------------------------+
                                        |
                     +------------------+------------------+
                     | (Target Group: IP Mode Routing)     |
                     v                                     v
       +----------------------------+        +----------------------------+
       | Private Subnet (AZ-1a)     |        | Private Subnet (AZ-1b)     |
       |  EKS Worker Node Group     |        |  EKS Worker Node Group     |
       |  +-----------------------+ |        |  +-----------------------+ |
       |  | Frontend React Pods   | |        |  | Frontend React Pods   | |
       |  +-----------------------+ |        |  +-----------------------+ |
       |  +-----------------------+ |        |  +-----------------------+ |
       |  | Backend Node/Java API | |        |  | Backend Node/Java API | |
       |  +-----------------------+ |        |  +-----------------------+ |
       +----------------------------+        +----------------------------+
                     |                                     |
                     +------------------+------------------+
                                        | (Internal ClusterIP / RDS Subnet)
                                        v
                       +---------------------------------+
                       | Secure Database Subnet (Multi-AZ)|
                       |   AWS RDS PostgreSQL / MySQL    |
                       | Primary (AZ-1a) <-> Standby(1b) |
                       +---------------------------------+
```
