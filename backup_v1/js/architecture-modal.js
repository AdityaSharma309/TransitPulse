// TransitPulse - Academic Architecture Modal Controller
// Comprehensive mapping for System Design, RDBMS (3NF), Azure DP-900 & Cloud Security

class ArchitectureModal {
  constructor() {
    this.modalBackdrop = document.getElementById('architectureModal');
    this.navButtons = document.querySelectorAll('.modal-nav-btn');
    this.contentContainer = document.getElementById('modalTabContent');
    this.activeTab = 'rdbms';

    this.tabData = {
      rdbms: {
        title: '3NF Relational Database Schema (RDBMS & Normalization)',
        subtitle: 'Production Schema Design in Third Normal Form (3NF) ensuring 0% Update Anomalies and ACID Integrity',
        content: `
          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16"></path></svg> 1. Normalization Proof (1NF ➔ 2NF ➔ 3NF)</h3>
            <p>To eliminate redundant data duplication and prevent insertion, deletion, and modification anomalies in mission-critical fleet operations, all entities adhere to strict 3NF:</p>
            <div class="tech-grid">
              <div class="tech-item">
                <h4>1NF: Atomic Attributes</h4>
                <p>Every column contains atomic values (e.g., GPS coordinates split into numeric <code>Latitude DECIMAL(9,6)</code> and <code>Longitude DECIMAL(9,6)</code>; no repeating groups).</p>
              </div>
              <div class="tech-item">
                <h4>2NF: Full Functional Dependency</h4>
                <p>All non-key attributes are fully functionally dependent on the entire primary key. In composite junction tables like <code>WorkOrder_Parts</code>, quantity and unit cost depend strictly on <code>(order_id, part_id)</code>.</p>
              </div>
              <div class="tech-item">
                <h4>3NF: No Transitive Dependencies</h4>
                <p>Non-key attributes never depend on other non-key attributes. Garage Depot location is isolated into a dedicated <code>Depots</code> table rather than repeating address details inside <code>Vehicles</code>.</p>
              </div>
            </div>
          </div>

          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg> 2. Core 3NF DDL (Data Definition Language)</h3>
            <p>Production SQL Server / Azure SQL DDL with enforced foreign keys, check constraints, and B-Tree indexing:</p>
            <pre class="code-block">
-- 1. Depots & Maintenance Hubs
CREATE TABLE Depots (
    depot_id VARCHAR(10) PRIMARY KEY,
    depot_name NVARCHAR(100) NOT NULL,
    city NVARCHAR(60) NOT NULL,
    region VARCHAR(30) NOT NULL,
    max_bay_capacity INT CHECK (max_bay_capacity > 0),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 2. Fleet Vehicle Entity
CREATE TABLE Vehicles (
    vehicle_id VARCHAR(15) PRIMARY KEY,
    vin CHAR(17) UNIQUE NOT NULL,
    registration_plate NVARCHAR(20) UNIQUE NOT NULL,
    model_name NVARCHAR(60) NOT NULL,
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('Diesel-Euro6', 'EV-Battery', 'CNG-Hybrid')),
    odometer_km INT NOT NULL DEFAULT 0,
    current_depot_id VARCHAR(10) REFERENCES Depots(depot_id),
    status VARCHAR(20) CHECK (status IN ('In-Transit', 'Depot-Ready', 'Maintenance-Due', 'Decommissioned')),
    last_service_date DATE
);

-- 3. Maintenance Work Orders (OLTP Transactions)
CREATE TABLE WorkOrders (
    order_id VARCHAR(20) PRIMARY KEY,
    vehicle_id VARCHAR(15) NOT NULL REFERENCES Vehicles(vehicle_id) ON DELETE RESTRICT,
    assigned_mechanic_id VARCHAR(20) NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('Low', 'Normal', 'High', 'Critical-SOS')),
    status VARCHAR(20) CHECK (status IN ('Open', 'In-Progress', 'Pending-Parts', 'Closed-Audited')),
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    closed_at DATETIME2 NULL
);

-- 4. Spare Parts Inventory & Usage Junction (2NF/3NF Resolution)
CREATE TABLE WorkOrder_Parts (
    order_id VARCHAR(20) REFERENCES WorkOrders(order_id),
    part_sku VARCHAR(30) NOT NULL,
    quantity_used INT CHECK (quantity_used > 0),
    unit_cost_inr DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, part_sku)
);

-- 5. Clustered & Non-Clustered Indexes for Sub-Second Telemetry Queries
CREATE NONCLUSTERED INDEX IX_Vehicles_Status_Depot ON Vehicles (status, current_depot_id);
CREATE NONCLUSTERED INDEX IX_WorkOrders_Vehicle_Status ON WorkOrders (vehicle_id, status) INCLUDE (created_at);
            </pre>
          </div>
        `
      },
      dp900: {
        title: 'Azure DP-900 Multi-Tier Cloud Data Architecture',
        subtitle: 'Enterprise Hybrid Data Solution: Relational (Azure SQL), NoSQL (Cosmos DB), Unstructured (Blob Storage) & Analytics (Power BI)',
        content: `
          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> 1. Azure DP-900 Pillar Alignment</h3>
            <p>The TransitPulse architecture maps directly to the Microsoft DP-900 Azure Data Fundamentals curriculum, choosing the optimal data store for each access pattern:</p>
            <div class="tech-grid">
              <div class="tech-item">
                <h4>Azure SQL Database (OLTP)</h4>
                <p><strong>Workload:</strong> Relational structured data, ACID transactions.<br/><strong>Role:</strong> Manages Vehicles, Mechanics, Work Orders, and Parts. Ensures strict transactional integrity and referential constraints.</p>
              </div>
              <div class="tech-item">
                <h4>Azure Cosmos DB (NoSQL)</h4>
                <p><strong>Workload:</strong> High-throughput, low-latency streaming.<br/><strong>Role:</strong> Ingests 10,000+ IoT ECU sensor telemetry pings/sec (RPM, GPS coordinate pairs, battery SOH) partitioned by <code>/vehicleId</code> with 99.999% SLA.</p>
              </div>
              <div class="tech-item">
                <h4>Azure Blob Storage (Data Lake)</h4>
                <p><strong>Workload:</strong> Unstructured large binary files.<br/><strong>Role:</strong> Houses driver pre-trip inspection photo audits, dashcam crash clips, and mechanic OBD-II dump logs across Hot/Cool lifecycle tiers.</p>
              </div>
              <div class="tech-item">
                <h4>Power BI & Synapse (OLAP)</h4>
                <p><strong>Workload:</strong> Executive Business Intelligence.<br/><strong>Role:</strong> Aggregates historical route fuel burn, calculates MTBF (Mean Time Between Failures), and renders real-time Fleet Manager heatmaps.</p>
              </div>
            </div>
          </div>

          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> 2. End-to-End IoT Telemetry Data Pipeline</h3>
            <pre class="code-block">
[Onboard Vehicle ECU / CAN-Bus] 
       │ (MQTT / AMQP over TLS 1.3)
       ▼
[Azure Event Hubs (Partitioned by VIN)]
       │
   ┌───┴───────────────────────────────┐
   ▼                                   ▼
[Azure Stream Analytics]     [Azure Cosmos DB (Hot Path)]
   │                                   │ (Real-time Live Telemetry Feed)
   ├─► Real-time Anomaly (DTC)         ▼
   │   ➔ Push Notification to UI    [TransitPulse Web App Dashboard]
   │
   ▼
[Azure Blob Storage (Cold Tier / Parquet)]
   │
   ▼
[Azure Synapse / Power BI Embedded Analytics]
            </pre>
          </div>
        `
      },
      security: {
        title: 'Cloud Security, Zero-Trust & RBAC Architecture',
        subtitle: 'Enterprise Security Posture combining Least-Privilege RBAC, HSM Secrets, and Dual-Layer Encryption',
        content: `
          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> 1. Role-Based Access Control (RBAC) Matrix</h3>
            <table class="custom-table" style="margin-top:0.75rem;">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Fleet Telemetry</th>
                  <th>Route Dispatch</th>
                  <th>Work Order Creation</th>
                  <th>Safety Checklist Submit</th>
                  <th>Financial / Parts Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Fleet Manager</strong></td>
                  <td>Read / Write All</td>
                  <td>Authorize / Override</td>
                  <td>View & Approve</td>
                  <td>Audit Access</td>
                  <td>Full Financial BI</td>
                </tr>
                <tr>
                  <td><strong>Garage Mechanic</strong></td>
                  <td>Diagnostic Read</td>
                  <td>Restricted</td>
                  <td>Create / Update / Close</td>
                  <td>Inspection Audit</td>
                  <td>Parts SKU Consumption</td>
                </tr>
                <tr>
                  <td><strong>Intercity Driver</strong></td>
                  <td>Assigned Vehicle Only</td>
                  <td>Turn-by-Turn Read</td>
                  <td>Restricted</td>
                  <td>Digital Submit & Sign</td>
                  <td>No Access</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> 2. Azure Key Vault & Encryption Controls</h3>
            <div class="tech-grid">
              <div class="tech-item">
                <h4>Centralized Secrets Management</h4>
                <p>Zero hardcoded connection strings. DB credentials, JWT private signing keys, and Cosmos DB master tokens reside in <strong>Azure Key Vault</strong> with automated 90-day HSM rotation.</p>
              </div>
              <div class="tech-item">
                <h4>Encryption in Transit (TLS 1.3)</h4>
                <p>All ingress traffic enforced over HTTPS/TLS 1.3 with Perfect Forward Secrecy (PFS), HTTP Strict Transport Security (HSTS), and Azure Front Door WAF protection.</p>
              </div>
              <div class="tech-item">
                <h4>Encryption at Rest (AES-256)</h4>
                <p>Azure SQL Transparent Data Encryption (TDE) with Customer-Managed Keys (CMK). Cosmos DB and Blob Storage utilize FIPS 140-2 validated 256-bit AES encryption.</p>
              </div>
              <div class="tech-item">
                <h4>Managed Identities (Entra ID)</h4>
                <p>App Service communicates with Azure SQL and Key Vault via Azure Managed Identities, eliminating passwords and API key leaks entirely from the codebase.</p>
              </div>
            </div>
          </div>
        `
      },
      systemdesign: {
        title: 'System Design, High Availability & Scalability',
        subtitle: 'Fault-Tolerant Distributed Architecture designed for 99.99% Availability & RPO < 5 mins',
        content: `
          <div class="arch-card">
            <h3><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> 1. Distributed Caching & Message Queues</h3>
            <p>To support high-concurrency peak transit traffic across hundreds of vehicles simultaneously:</p>
            <ul style="padding-left:1.25rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.4rem;">
              <li><strong>Azure Cache for Redis:</strong> In-memory caching for frequently requested route elevation profiles, driver profile lookups, and active GPS coordinates (Cache-Aside pattern, reducing SQL read load by 85%).</li>
              <li><strong>Azure Service Bus:</strong> Asynchronous message brokering for Maintenance Work Orders. If the database undergoes maintenance, telemetry work orders are safely queued in FIFO topics without data loss.</li>
              <li><strong>Disaster Recovery & Redundancy:</strong> Multi-region geo-paired zones (Azure East US & Central US) ensuring RPO (Recovery Point Objective) &lt; 5 minutes and RTO (Recovery Time Objective) &lt; 15 minutes.</li>
            </ul>
          </div>
        `
      }
    };

    this.initEventListeners();
  }

  initEventListeners() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) {
          this.close();
        }
      });
    }

    // Open button
    const openBtn = document.getElementById('openArchModalBtn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.open());
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open(tab = 'rdbms') {
    if (!this.modalBackdrop) return;
    this.modalBackdrop.classList.add('open');
    this.switchTab(tab);
  }

  close() {
    if (!this.modalBackdrop) return;
    this.modalBackdrop.classList.remove('open');
  }

  switchTab(tab) {
    if (!this.tabData[tab]) return;
    this.activeTab = tab;

    this.navButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const data = this.tabData[tab];
    this.contentContainer.innerHTML = `
      <div>
        <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin-bottom:0.25rem;">${data.title}</h3>
        <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:1.25rem;">${data.subtitle}</p>
      </div>
      ${data.content}
    `;
  }
}

window.ArchitectureModal = ArchitectureModal;
