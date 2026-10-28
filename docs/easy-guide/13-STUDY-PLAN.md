# 13 — 30 / 60 / 90 Day Study Plan

This plan assumes **2 hours per day, 5 days per week**. If you have less time, stretch the weeks. Do not skip the hands-on parts.

## The rule

For each day:

1. Read one easy-guide file.
2. Run one command.
3. Write three lines in your own words.
4. Explain it out loud in 60 seconds.

## Days 1-30 — Understand and run

| Week | Goal | Read | Do | Proof |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Big picture | `00`, `01`, `02` | Draw the 3-tier diagram | Photo of your drawing |
| 2 | Backend | `04` | Run API + Postgres, register and login with curl | Saved curl output |
| 3 | Frontend | `05` | Run React, add a skill | Screenshot of the skills table |
| 4 | Local stack | `06` | `docker compose up`, check Prometheus + Grafana | Screenshot of the target UP |

**Day 30 checkpoint:** you can explain the request flow without notes.

## Days 31-60 — Package and orchestrate

| Week | Goal | Read | Do | Proof |
| :--- | :--- | :--- | :--- | :--- |
| 5 | Docker deep | `06` | Build both images, prove non-root, check size | `docker images` output |
| 6 | Kubernetes basics | `07` | kind cluster, apply base manifests | `kubectl get pods` output |
| 7 | Kubernetes debugging | `07`, `11` | Break a Pod 3 ways, fix it | 3 short post-mortems |
| 8 | Kustomize + probes | `07` | Render lab/prod overlays, change replicas | diff of rendered YAML |

**Day 60 checkpoint:** you can deploy to kind and debug `CrashLoopBackOff`, `ImagePullBackOff` and `OOMKilled`.

## Days 61-90 — Cloud and delivery

| Week | Goal | Read | Do | Proof |
| :--- | :--- | :--- | :--- | :--- |
| 9 | Terraform basics | `08` | bootstrap state, `plan` the lab | plan output + cost estimate |
| 10 | AWS deploy | `08`, `11` | apply, install LB controller, deploy, get ALB | ALB hostname + smoke test |
| 11 | CI/CD | `09` | push a branch, run CI, run CD | green run screenshot |
| 12 | Observability + security | `10` | build a Grafana panel, run Trivy | dashboard screenshot + report |
| 13 | Destroy + review | `12` | destroy everything, run post-destroy check | empty audit output |

**Day 90 checkpoint:** you can build, deploy, monitor and destroy the whole system, and explain the cost.

## Weekly proof-of-work

Keep a folder `portfolio/` (create it yourself) with:

- `week-01-diagram.png`
- `week-02-curl.txt`
- `week-03-skills.png`
- `week-04-compose.txt`
- `week-05-docker.txt`
- `week-06-k8s.txt`
- `week-07-postmortems.md`
- `week-08-diff.txt`
- `week-09-plan.txt`
- `week-10-alb.txt`
- `week-11-ci.txt`
- `week-12-grafana.png`
- `week-13-destroy.txt`

In an interview, these artifacts are stronger than "I know DevOps".

## What to study after day 90

Pick two:

- **Kubernetes:** CKA/CKS, operators, Karpenter, Gateway API.
- **Terraform:** Terragrunt, module testing, policy as code.
- **Observability:** OpenTelemetry, tracing, SLO tooling.
- **Security:** SBOM, image signing, Vault, OPA.
- **Platform engineering:** internal developer platform, golden paths.

## The five questions you must answer at the end

1. Why is `/readyz` different from `/healthz`?
2. Why is RDS in a private subnet?
3. Why use OIDC instead of AWS access keys?
4. Why tag images with the Git SHA?
5. How do you find the cause of a 502 in under 5 minutes?

If you can answer all five with a real example from your own lab, you are ready for a junior/mid DevOps role.

## Final checklist

- [ ] I read the easy guide in order.
- [ ] I ran the stack locally.
- [ ] I deployed to Kubernetes.
- [ ] I deployed to AWS and destroyed it.
- [ ] I ran CI and CD.
- [ ] I broke and fixed at least five things.
- [ ] I wrote five short post-mortems.
- [ ] I can explain the five questions above.
