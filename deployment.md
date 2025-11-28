# Deployment Guide

This guide provides step-by-step instructions to set up a local Kubernetes cluster using Kind, deploy the Microvoting Platform using Helm, and configure a complete monitoring stack with Prometheus, Grafana, and Loki.

## Prerequisites

Ensure you have the following tools installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Helm](https://helm.sh/docs/intro/install/)

---

## 1. Cluster Setup

Create a new Kubernetes cluster using Kind.

```bash
kind create cluster --name microvoting
```

Verify the cluster is running:

```bash
kubectl cluster-info --context kind-microvoting
```

---

## 2. Application Deployment

Deploy the voting application using the provided Helm chart.

### Install the Chart

Navigate to the project root and run:

```bash
helm install voting-app ./charts/voting-app --namespace voting --create-namespace
```

### Verify Deployment

Check if all application pods are running:

```bash
kubectl get pods -n voting
```

### Access the Application

To access the Vote UI and Result API locally, use port-forwarding:

**Vote UI:**

```bash
kubectl port-forward svc/vote-ui 3000:80 -n voting
```

Access at: [http://localhost:3000](http://localhost:3000)

**Result API:**

```bash
kubectl port-forward svc/result-api 8081:80 -n voting
```

Access at: [http://localhost:8081](http://localhost:8081)

---

## 3. Monitoring Stack Setup (PLG Stack)

We will install Prometheus (Metrics), Loki (Logs), and Grafana (Visualization).

### Add Helm Repositories

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### Create Monitoring Namespace

```bash
kubectl create namespace monitoring
```

### Install Prometheus & Grafana

This installs the `kube-prometheus-stack` which includes Prometheus, Grafana, and Node Exporter.

```bash
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring
```

### Install Loki & Promtail

This installs Loki for log storage and Promtail for log shipping. We disable the extra Grafana instance included in this chart.

```bash
helm install loki grafana/loki-stack --namespace monitoring --set promtail.enabled=true,grafana.enabled=false,loki.isDefault=false
```

_Note: `loki.isDefault=false` is important to prevent conflicts with Prometheus as the default datasource._

---

## 4. Configuration & Access

### Access Grafana

1.  **Get the Admin Password:**

    ```bash
    kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
    ```

2.  **Port Forward Grafana:**

    ```bash
    kubectl port-forward svc/prometheus-grafana 3001:80 --namespace monitoring
    ```

    _If running on a remote server (like EC2), add `--address 0.0.0.0` to the command._

3.  **Login:**
    - URL: [http://localhost:3001](http://localhost:3001)
    - User: `admin`
    - Password: (The output from step 1)

### Configure Loki Datasource

1.  In Grafana, go to **Configuration** (Gear Icon) -> **Data Sources**.
2.  Click **Add data source**.
3.  Select **Loki**.
4.  **Name:** `Loki-Manual`
5.  **URL:** `http://loki:3100`
6.  Click **Save & Test**.

### Import Dashboard

To visualize cluster metrics (CPU, Memory, Network):

1.  Go to **Dashboards** (Four Squares Icon) -> **Import**.
2.  Enter Dashboard ID: **315** (Kubernetes Cluster Monitoring).
3.  Click **Load**.
4.  Select **Prometheus** as the data source.
5.  Click **Import**.

---

## 5. Troubleshooting

**"Too many open files" Error in Promtail:**
If Promtail crashes, you may need to increase file watch limits on your node (especially for EC2/Linux):

```bash
sudo sysctl -w fs.inotify.max_user_instances=512
sudo sysctl -w fs.inotify.max_user_watches=524288
```

Restart the Promtail pods after applying this fix.
