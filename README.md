# On-Demand LLM Detector with Automated CI/CD

[![Deploy Frontend](https://github.com/georgewallden/LLM-Detector/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/georgewallden/LLM-Detector/actions/workflows/deploy-frontend.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack NLP project to detect AI-generated text. This application features a fine-tuned transformer model served via a FastAPI backend, deployed as a serverless container on AWS Fargate. The entire system is architected to be **cost-conscious**, with an on-demand, auto-shutdown backend that only runs when a user is present.

**Live Demo:** [**georgewallden.com/llm-detector**](https://www.georgewallden.com/llm-detector/)

---

## Key Features

*   **🧠 Fine-Tuned Transformer Model:** Utilizes `distilbert-base-uncased` fine-tuned on a Kaggle dataset to classify text as Human or AI-written.
*   **🚀 On-Demand Serverless Backend:** The FastAPI container on AWS Fargate is launched on-demand via a Lambda trigger, ensuring **zero cost when idle**.
*   **💤 Auto-Shutdown Watchdog:** A custom multi-threaded watchdog within the container monitors for inactivity and terminates the task after 15 minutes, preventing runaway costs.
*   **☁️ Production-Grade Cloud Architecture:** Deployed on AWS using a secure, scalable, and professional architecture including a VPC, private/public subnets, NAT Gateway, and an Application Load Balancer.
*   **🤖 Automated Frontend CI/CD:** A path-filtered GitHub Actions workflow automatically deploys frontend changes (HTML/CSS/JS) to an S3 bucket and invalidates the CloudFront cache.
*   **🔐 Secure, Keyless Deployments:** Leverages AWS IAM OIDC to establish a secure, keyless trust relationship between GitHub Actions and AWS, eliminating the need for long-lived access keys.

---

## Architecture Deep Dive

The core challenge of this project was to host a resource-intensive ML model without incurring high costs for a personal portfolio project that sees infrequent traffic. The architecture is designed around this on-demand principle.

### Request Flow & Cold Start Process:
1.  **User Visits:** The user accesses the static frontend hosted on **S3** and served globally via **CloudFront**.
2.  **Wake-Up Call:** The JavaScript sees the server is "asleep" and presents the "Wake Up" button. When clicked, it sends a request to a **Lambda Function URL**.
3.  **The Manager (Lambda):** The Lambda function's sole responsibility is to make one API call: `ecs:UpdateService`, setting the `desiredCount` of the `llm-detector-service` from `0` to `1`.
4.  **The Factory (ECS):**
    *   **ECS** receives the command and begins provisioning a new **Fargate** task in a **private subnet**.
    *   The task needs to download its Docker image. It sends this request from the private subnet through a **NAT Gateway** to reach the **ECR** registry on the public internet. This ensures the container itself is never directly exposed.
    *   As the task starts, ECS automatically registers its private IP address with the **Application Load Balancer (ALB)** target group.
5.  **The Waiter (ALB) & The Cook (Fargate Task):**
    *   The frontend polls the ALB's static DNS name (e.g., `llm-detector.georgewallden.com`).
    *   Initially, the ALB returns `503 Service Unavailable` because the container is still booting and failing health checks.
    *   Once the FastAPI app and the ML model are loaded, the task passes the ALB health check and is marked "healthy".
6.  **Serving Traffic:** The ALB now forwards traffic to the healthy Fargate task. The user can submit text for analysis.
7.  **Auto-Shutdown:** If no requests are received for 15 minutes, the watchdog thread in the Python script exits the container, the task stops, and the ECS service's running count returns to `0`.

---

## Tech Stack

| Category             | Technology / Service                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Backend**          | Python, FastAPI, PyTorch, Hugging Face Transformers, Docker                                                            |
| **Frontend**         | HTML5, CSS3, Vanilla JavaScript                                                                                        |
| **Machine Learning** | `distilbert-base-uncased`, Kaggle Essay Dataset, Local training on RTX 4090, Hugging Face Hub for model hosting          |
| **Cloud/DevOps**     | **AWS:** (S3, CloudFront, Lambda, ECS, Fargate, ECR, ALB, Route 53, ACM, IAM, VPC, NAT Gateway), GitHub Actions, OIDC |

---

## Lessons Learned & Challenges Overcome

This project was a deep dive into solving real-world cloud architecture problems.
*   **Secure Networking:** The biggest challenge was the `ResourceInitializationError` in ECS. This led to a complete network overall, building a proper VPC with public subnets for internet-facing resources (ALB, NAT Gateway) and private subnets for secure compute (Fargate). This was a practical lesson in why NAT Gateways are essential for secure container deployments.
*   **IAM Permissions:** Debugging the CI/CD pipeline involved several `AccessDenied` errors. This forced a deep understanding of IAM policies, specifically the distinction between permissions for a bucket (`s3:ListBucket`) and permissions for objects within it (`s3:PutObject`), and the importance of precise trust policies for OIDC.
*   **CI/CD & Secret Management:** The initial CI/CD setup failed because the `config.js` file (containing API keys) was in `.gitignore`. The solution was to implement a professional pattern: storing URLs as encrypted GitHub Secrets and dynamically generating the configuration file during the workflow run.

---

## Future Improvements

*   **Backend CI/CD Automation:** Implement the parallel GitHub Actions workflow (`deploy-backend.yml`) to automatically build and push the Docker image to ECR and force a new deployment on the ECS service whenever backend code is updated.
*   **Enhanced Cold Start UX:** Replace the simple polling mechanism with WebSockets or Server-Sent Events to provide a more responsive, real-time progress indicator to the user as the server is waking up.

---

*This project was developed by George Wallden as a portfolio piece. Feel free to connect!*

[**LinkedIn**](https://www.linkedin.com/in/your-profile/) | [**GitHub**](https://github.com/georgewallden)
