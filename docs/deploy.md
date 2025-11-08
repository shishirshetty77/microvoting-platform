# Deployment

This guide provides detailed instructions for deploying the application.

## Infrastructure Deployment (Terraform)

1.  **Navigate to the `terraform` directory:**
    ```bash
    cd terraform
    ```

2.  **Initialize Terraform:**
    This command downloads the necessary providers and sets up the backend.
    ```bash
    terraform init
    ```

3.  **Plan the deployment:**
    This command shows you what resources will be created.
    ```bash
    terraform plan -var="gcp_project_id=your-gcp-project-id"
    ```

4.  **Apply the configuration:**
    This command creates the GCP infrastructure.
    ```bash
    terraform apply -var="gcp_project_id=your-gcp-project-id"
    ```
    You will be prompted to confirm the deployment. Type `yes` to proceed.

## Application Deployment (Helm)

1.  **Navigate to the `voting-app` chart directory:**
    ```bash
    cd charts/voting-app
    ```

2.  **Add the required Helm repositories:**
    ```bash
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    ```

3.  **Update Helm dependencies:**
    This command downloads the dependency charts (`redis`, `postgresql`, `kube-prometheus-stack`).
    ```bash
    helm dependency update
    ```

4.  **Deploy to the `dev` environment:**
    ```bash
    helm upgrade --install voting-app . \
      --namespace dev \
      --create-namespace \
      -f values-dev.yaml \
      --set global.imageRegistry=<your-artifact-registry-url>
    ```
    Replace `<your-artifact-registry-url>` with the output from `terraform output artifact_registry_repository_url`.

5.  **Deploy to the `prod` environment:**
    Deployment to production is typically done via the CI/CD pipeline, but can also be done manually:
    ```bash
    helm upgrade --install voting-app . \
      --namespace prod \
      --create-namespace \
      -f values-prod.yaml \
      --set global.imageRegistry=<your-artifact-registry-url>
    ```

## Rollback

If a deployment fails, you can roll back to a previous revision:

```bash
helm rollback voting-app <REVISION_NUMBER> -n <namespace>
```
You can find the revision number with `helm history voting-app -n <namespace>`.
