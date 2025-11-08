# Teardown

This guide provides instructions for tearing down the application and infrastructure.

## Application Teardown (Helm)

To remove the application from your GKE cluster, you can use `helm uninstall`.

1.  **Uninstall the release from the `dev` namespace:**
    ```bash
    helm uninstall voting-app -n dev
    ```

2.  **Uninstall the release from the `prod` namespace:**
    ```bash
    helm uninstall voting-app -n prod
    ```

This will remove all Kubernetes resources associated with the application, including deployments, services, and secrets.

## Infrastructure Teardown (Terraform)

To destroy all the GCP infrastructure created by Terraform, follow these steps.

**Warning**: This will permanently delete your GKE cluster, VPC network, Artifact Registry, and other resources. This action cannot be undone.

1.  **Navigate to the `terraform` directory:**
    ```bash
    cd terraform
    ```

2.  **Destroy the infrastructure:**
    ```bash
    terraform destroy -var="gcp_project_id=your-gcp-project-id"
    ```
    Terraform will show you a plan of the resources to be destroyed. You will be prompted to confirm the action. Type `yes` to proceed.

## GCS Backend Bucket

The GCS bucket used for the Terraform backend is not managed by Terraform itself, so it will not be deleted by the `terraform destroy` command. You must delete it manually if you no longer need it.

```bash
gsutil rm -r gs://your-tf-state-bucket-name
```
