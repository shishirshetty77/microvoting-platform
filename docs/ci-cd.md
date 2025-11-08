# CI/CD

This document explains the CI/CD pipelines for the application, which are managed with GitHub Actions.

## Workflows

There are three main workflows:

-   `ci.yml`: Continuous Integration
-   `cd-dev.yml`: Continuous Deployment to Dev
-   `cd-prod.yml`: Continuous Deployment to Prod

### `ci.yml`

-   **Trigger**: On every push to `main` or a pull request targeting `main`.
-   **Jobs**:
    1.  **`build-and-push`**:
        -   Checks out the code.
        -   Authenticates to Google Cloud using Workload Identity.
        -   Configures Docker to use the Artifact Registry.
        -   Builds a Docker image for each service (`vote-ui`, `vote-api`, `result-api`, `worker`).
        -   Tags the images with the Git SHA.
        -   Pushes the images to the Artifact Registry.
    2.  **`test` (Placeholder)**:
        -   This job is intended for running unit and integration tests.
    3.  **`sonarcloud` (Placeholder)**:
        -   This job performs a static code analysis with SonarQube/SonarCloud.
    4.  **`trivy` (Placeholder)**:
        -   This job scans the Docker images for vulnerabilities with Trivy.

### `cd-dev.yml`

-   **Trigger**: On every push to the `main` branch.
-   **Jobs**:
    1.  **`deploy-dev`**:
        -   Authenticates to Google Cloud.
        -   Gets the credentials for the GKE cluster.
        -   Deploys the application to the `dev` namespace using `helm upgrade --install`.
        -   Uses the `values-dev.yaml` file for configuration.
        -   Sets the image tags to the Git SHA of the commit that triggered the workflow.

### `cd-prod.yml`

-   **Trigger**: Manually, via the GitHub Actions UI (`workflow_dispatch`).
-   **Inputs**:
    -   `image_tag`: The Git SHA or version tag of the images to deploy.
-   **Environment**:
    -   Uses a GitHub environment named `production` which can be configured with protection rules (e.g., required reviewers).
-   **Jobs**:
    1.  **`deploy-prod`**:
        -   Authenticates to Google Cloud.
        -   Gets the credentials for the GKE cluster.
        -   Deploys the application to the `prod` namespace using `helm upgrade --install`.
        -   Uses the `values-prod.yaml` file for configuration.
        -   Sets the image tags to the tag provided as input.

## Secrets

The workflows rely on secrets configured in the GitHub repository settings. Please refer to the `docs/setup-gcp.md` file for a complete list of required secrets.
