# GCP Setup

This guide walks you through setting up your Google Cloud Platform environment to deploy the application.

## 1. Create a GCP Project

If you don't have one already, create a new GCP project in the [Google Cloud Console](https://console.cloud.google.com/).

## 2. Enable APIs

Enable the following APIs for your project:

-   **Compute Engine API**: `compute.googleapis.com`
-   **Kubernetes Engine API**: `container.googleapis.com`
-   **Artifact Registry API**: `artifactregistry.googleapis.com`
-   **Cloud Resource Manager API**: `cloudresourcemanager.googleapis.com`
-   **IAM API**: `iam.googleapis.com`
-   **Secret Manager API**: `secretmanager.googleapis.com`

You can enable them with the following `gcloud` command:

```bash
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com
```

## 3. Create a GCS Bucket for Terraform State

Terraform uses a remote backend to store its state. Create a GCS bucket for this purpose:

```bash
gsutil mb gs://your-tf-state-bucket-name # Replace with a unique bucket name
```

Update the `backend` block in `terraform/providers.tf` with your bucket name.

## 4. Configure Authentication

Ensure your local environment is authenticated with GCP:

```bash
gcloud auth login
gcloud auth application-default login
```

Set your project configuration:

```bash
gcloud config set project YOUR_PROJECT_ID
```

## 5. Workload Identity for GitHub Actions

To allow GitHub Actions to securely authenticate with GCP, you need to set up Workload Identity Federation.

1.  **Create a Workload Identity Pool:**
    ```bash
    gcloud iam workload-identity-pools create "your-pool-name" \
      --location="global" \
      --display-name="GitHub Actions Pool"
    ```

2.  **Create a Workload Identity Provider:**
    ```bash
    gcloud iam workload-identity-pools providers create-oidc "your-provider-name" \
      --workload-identity-pool="your-pool-name" \
      --location="global" \
      --issuer-uri="https://token.actions.githubusercontent.com" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"
    ```

3.  **Create a Service Account for GitHub Actions:**
    - This is already handled by the Terraform configuration (`github_actions_sa`). After running `terraform apply`, you will get the service account email as an output.

4.  **Allow the provider to impersonate the service account:**
    ```bash
    gcloud iam service-accounts add-iam-policy-binding "github-actions-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/your-pool-name/attribute.repository/your-github-username/your-repo-name"
    ```

## 6. GitHub Secrets

Configure the following secrets in your GitHub repository settings:

-   `GCP_PROJECT_ID`: Your GCP project ID.
-   `GCP_PROJECT_NUMBER`: Your GCP project number.
-   `GCP_REGION`: The GCP region you are deploying to (e.g., `us-central1`).
-   `GCP_WIF_POOL`: The name of your Workload Identity Pool.
-   `GCP_WIF_PROVIDER`: The name of your Workload Identity Provider.
-   `GCP_SA_EMAIL`: The email of the service account created by Terraform.
-   `GKE_CLUSTER_NAME`: The name of the GKE cluster (e.g., `voting-app-cluster`).
-   `SONAR_TOKEN`: Your SonarQube/SonarCloud token.
