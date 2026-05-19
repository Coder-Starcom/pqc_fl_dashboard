# PQC Fraud Monitor (Frontend Dashboard) 📊🛡️

### Real-Time Telemetry and Observability Dashboard for Lattice-Blinded Federated Learning Pipelines

<p align="left">
  <img src="https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue?style=flat-square&logo=python&logoColor=white" alt="Python Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/UI--Framework-Streamlit%20%2F%20Dash-ff4b4b?style=flat-square" alt="UI Framework">
  <img src="https://img.shields.io/badge/Service-Netlify%20Secure%20Proxy-00C7B7?style=flat-square" alt="Network Proxy">
</p>

[![Live Demo Dashboard](https://img.shields.io/badge/Live-Demo--Dashboard-ff4b4b?style=for-the-badge&logo=netlify&logoColor=white)](https://pqc-fl-dashboard.netlify.app)

An industrial-grade telemetry and visualization cockpit designed to monitor distributed, privacy-preserving machine learning nodes. This application ingests secure, high-dimensional cryptographic metrics and convergence streams from the live cloud orchestrator, turning raw post-quantum data arrays into actionable health diagnostics for security and system administrators.

---

## 🌌 System Observability Flow

The frontend dashboard serves as a decoupled, read-only analytics consumer. It bridges the gap between headless backend computations and human operators without risking cleartext exposure.

```art
 ┌────────────────────────────────────────┐
 │ post-quantum-federated-fraud-detection │ (Backend Core Cluster)
 └────────────────────────────────────────┘
                    │
                    │ Exposes Telemetry Streams (JSON / WebSocket)
                    ▼
 ┌──────────────────────────────────────┐
 │    Netlify Secure Proxy Gateway      │ (Network Auth Barrier)
 └──────────────────────────────────────┘
                    │
                    │ Proxied Metrics API Payload
                    ▼
 ┌──────────────────────────────────────┐
 │        PQC-FraudMonitor-FL           │ 🚀 YOU ARE HERE
 │      (Headless Logging UI Engine)    │ (Visualizes 6 Telemetry Layers)
 └──────────────────────────────────────┘
```

---

## 📈 Real-Time Engine Diagnostic Layers

The application structures and renders six specific tracking vectors to evaluate structural stability, data balancing lift, and cryptographic privacy limits:

### 📊 01: Real-Time Convergence Horizon

Plots the macro Cross-Entropy Loss trajectory round-over-round. It visually alerts operators if the global model breaks past the random-guessing baseline ($\approx 0.693$) and scales downward into clean optimization zones.

### 📉 02: Area Under Precision-Recall Curve (AUPRC)

The mission-critical metric for the underlying 9% target fraud distribution. Tracks real-time precision-recall tradeoffs to ensure localized updates successfully isolate minority class fraud clusters.

### 🧬 03: Lattice Noise Budget Horizon

Monitors the discrete Gaussian noise width ($\sigma = 2.75$) error growth inside the cyclotomic ring $\mathbb{Z}_q[X] / (X^{512} + 1)$. This gauge ensures aggregated client ciphertexts have sufficient structural safety budget remaining prior to decryption limits.

### ⚖️ 04: SMOTE Class Imbalance Lift Profile

Visualizes synthetic data generation geometry. Ensures that localized minority up-sampling adjustments on edge nodes do not induce malicious gradients or distort the global convergence vector.

### 🛡️ 05: Differential Privacy Utility Bounds

Maps the localized mathematical trade-offs between strict information blinding parameters ($\epsilon, \delta$) and the preservation of model validation utility.

### 🔑 06: Cryptographic Weight Entropy (Blindness)

Measures the mathematical randomness (entropy profile) of ciphertexts traversing the network wire, confirming complete data blindness and validating that zero cleartext parameter leakage is occurring.

---

## 🚀 Getting Started

### 1. Installation & Environment Setup

Clone this visualizer repository and initialize a localized virtual environment:

```bash
# Clone the frontend visualizer repo
git clone https://github.com/Coder-Starcom/PQC-FraudMonitor-FL.git
cd PQC-FraudMonitor-FL

# Setup clean virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install visualizer stack
pip install -r requirements.txt

```

### 2. Execution Configuration

To view the live production tracking system, navigate directly to our active Netlify cloud instance:

🔗 **Live Interface**: [pqc-fl-dashboard.netlify.app](https://pqc-fl-dashboard.netlify.app)

---

## 🛠️ Repository File Map

```text
PQC-FraudMonitor-FL/
│
├── index.html         # Main structural layout and UI viewport mapping
├── app.js             # Core telemetry engine parsing JSON vectors & charting via JavaScript
├── style.css          # Production UI style sheets and responsive layout geometry
├── README.md          # Project documentation manual
│
├── plots_data_dp.json
├── plots_data_entropy.json
└── plots_data_smote.json
```

---

## 🛡️ Security & Authentication Integration

To protect against monitoring-side inference or fingerprinting attacks, all incoming analytical metrics streams are routed through **Netlify Secure Proxy Gateways**. This abstracts backend API infrastructure URLs and guarantees that only authorized client nodes can push telemetry artifacts into the central logging state machine.
