# Observability

This document explains how to access the monitoring and observability tools.

## Prometheus

Prometheus is deployed as part of the `kube-prometheus-stack`. It automatically discovers and scrapes metrics from the application services.

### Accessing Prometheus

You can access the Prometheus UI via port-forwarding:

```bash
kubectl port-forward svc/prometheus-operated 9090:9090 -n <namespace>
```

Then, open `http://localhost:9090` in your browser.

### Metrics

The application exposes the following custom metrics:

-   `votes_total`: A counter for the total number of votes cast for each candidate.
-   `vote_results`: A gauge that shows the current vote count for each candidate.

You can query these metrics in the Prometheus UI. For example:

```promql
# Get the total number of votes for candidate 'A'
sum(rate(votes_total{candidate="A"}[5m]))

# Get the current number of votes for all candidates
vote_results
```

## Grafana

Grafana is also deployed as part of the `kube-prometheus-stack` and is pre-configured with a data source for Prometheus.

### Accessing Grafana

1.  **Get the Grafana admin password:**
    ```bash
    kubectl get secret grafana -n <namespace> -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
    ```

2.  **Port-forward to the Grafana service:**
    ```bash
    kubectl port-forward svc/grafana 3000:80 -n <namespace>
    ```

3.  **Log in to Grafana:**
    -   Open `http://localhost:3000` in your browser.
    -   Username: `admin`
    -   Password: The password from the previous step.

### Dashboards

A sample dashboard for the voting application is included in the Helm chart. You can find it in the "Dashboards" section of Grafana.

## Alertmanager

Alertmanager is configured to manage alerts sent by Prometheus. You can define alerting rules in the `kube-prometheus-stack` values file.

### Accessing Alertmanager

```bash
kubectl port-forward svc/alertmanager-operated 9093:9093 -n <namespace>
```
Then, open `http://localhost:9093` in your browser.
