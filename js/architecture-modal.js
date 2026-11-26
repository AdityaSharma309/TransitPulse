// TransitPulse - System Architecture & Academic Compliance Modal
// Clearly distinguishes implemented client-side behaviors from proposed Azure cloud blueprint tiers.

class ArchitectureModal {
  constructor() {
    this.modalBackdrop = document.getElementById('architectureModal');
    this.navButtons = document.querySelectorAll('.modal-nav-btn');
    this.contentContainer = document.getElementById('modalTabContent');
    this.activeTab = 'rdbms';

    this.tabData = {
      rdbms: {
        title: 'RDBMS & Third Normal Form (3NF) Schema',
        subtitle: 'Normalized relational schema matching the TransitPulse fleet, driver, route, and maintenance entities.',
        content: `
          <div class="arch-section">
            <div class="arch-status-row">
              <span class="arch-tag implemented">Implemented in Browser Store (data.js + localStorage)</span>
              <span class="arch-tag conceptual">Target Engine: Azure SQL Database</span>
            </div>
            <h3>1. Normalization Structure (1NF → 2NF → 3NF)</h3>
            <div class="arch-grid">
              <div class="arch-box">
                <h4>1NF · Atomic Attributes</h4>
                <p>Repeating groups eliminated. Vehicle identifiers, registration plates, route origin/destination terminals, and sensor readings are stored as atomic scalar attributes.</p>
              </div>
              <div class="arch-box">
                <h4>2NF · Full Key Dependency</h4>
                <p>Composite junction table <code>WorkOrder_Parts(order_id, part_sku)</code> binds quantity and cost to the complete composite primary key rather than partial keys.</p>
              </div>
              <div class="arch-box">
                <h4>3NF · No Transitive Dependencies</h4>
                <p>Depot locations, driver profiles, and mechanic certifications are separated into <code>Depots</code>, <code>Drivers</code>, and <code>Mechanics</code> tables so updates occur in one place.</p>
              </div>
            </div>
          </div>

          <div class="arch-section">
            <h3>2. Relational DDL Alignment</h3>
            <pre class="code-block">CREATE TABLE Depots (
    depot_id VARCHAR(10) PRIMARY KEY,
    depot_name NVARCHAR(100) NOT NULL,
    city NVARCHAR(60) NOT NULL
);

CREATE TABLE Drivers (
    driver_id VARCHAR(15) PRIMARY KEY,
    full_name NVARCHAR(80) NOT NULL,
    license_no VARCHAR(30) UNIQUE NOT NULL,
    contact_phone VARCHAR(20)
);

CREATE TABLE Vehicles (
    vehicle_id VARCHAR(15) PRIMARY KEY,      -- e.g. TP-1081
    registration_plate NVARCHAR(20) UNIQUE NOT NULL,
    model_name NVARCHAR(80) NOT NULL,
    seating_capacity NVARCHAR(40) NOT NULL,
    assigned_driver_id VARCHAR(15) REFERENCES Drivers(driver_id),
    current_depot_id VARCHAR(10) REFERENCES Depots(depot_id),
    operational_status VARCHAR(24) NOT NULL, -- In-Transit | Depot Ready | Maintenance Due
    last_service_date DATE,
    next_service_date DATE
);

CREATE TABLE WorkOrders (
    order_id VARCHAR(20) PRIMARY KEY,        -- e.g. WO-8821
    vehicle_id VARCHAR(15) NOT NULL REFERENCES Vehicles(vehicle_id) ON DELETE RESTRICT,
    assigned_mechanic NVARCHAR(80) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    repair_status VARCHAR(24) NOT NULL,      -- Open | Under repair | Closed & Audited
    repair_notes NVARCHAR(400),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE WorkOrder_Parts (
    order_id VARCHAR(20) REFERENCES WorkOrders(order_id),
    part_sku VARCHAR(30) NOT NULL,
    quantity_used INT CHECK (quantity_used > 0),
    PRIMARY KEY (order_id, part_sku)
);</pre>
          </div>
        `
      },
      dp900: {
        title: 'Azure Data Architecture (DP-900 Alignment)',
        subtitle: 'Multi-tier cloud data architecture mapping operational, telemetry, unstructured, and analytical workloads.',
        content: `
          <div class="arch-section">
            <div class="arch-status-row">
              <span class="arch-tag conceptual">Conceptual Cloud Blueprint (Azure DP-900)</span>
              <span class="arch-tag implemented">Simulated Locally in Current Static Build</span>
            </div>
            <h3>1. Storage Tier Assignment</h3>
            <div class="arch-grid">
              <div class="arch-box">
                <h4>Azure SQL Database (OLTP)</h4>
                <p><strong>Proposed Role:</strong> Authoritative 3NF transactional store for vehicles, drivers, routes, work orders, and parts inventory.<br><strong>Current App:</strong> Simulated via <code>TransitPulseData</code> &amp; <code>localStorage</code>.</p>
              </div>
              <div class="arch-box">
                <h4>Azure Cosmos DB (NoSQL)</h4>
                <p><strong>Proposed Role:</strong> High-throughput telemetry ingestion partitioned by <code>/vehicleId</code> for engine RPM, coolant, brake wear, and GPS pings.<br><strong>Current App:</strong> Simulated in-memory sensor baselines.</p>
              </div>
              <div class="arch-box">
                <h4>Azure Blob Storage</h4>
                <p><strong>Proposed Role:</strong> Immutable object storage for signed pre-trip inspection records and inspection photos.<br><strong>Current App:</strong> Generates local audit proof receipts on checklist sign-off.</p>
              </div>
              <div class="arch-box">
                <h4>Power BI</h4>
                <p><strong>Proposed Role:</strong> Executive reporting over historical maintenance costs, mean time between failures, and corridor fuel consumption.<br><strong>Current App:</strong> Not connected; represented conceptually.</p>
              </div>
            </div>
          </div>
        `
      },
      security: {
        title: 'Cloud Security, RBAC & Key Management',
        subtitle: 'Access separation across Fleet Manager, Garage Mechanic, and Intercity Driver roles.',
        content: `
          <div class="arch-section">
            <div class="arch-status-row">
              <span class="arch-tag implemented">Enforced in UI + Domain Service Layer</span>
              <span class="arch-tag conceptual">Production Target: Entra ID + Azure Key Vault + TLS 1.3</span>
            </div>
            <h3>1. Role-Based Access Control (RBAC) Matrix</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Terminal Overview</th>
                  <th>Fleet &amp; Driver Assignment</th>
                  <th>Garage Repairs &amp; Parts</th>
                  <th>Routes &amp; Pre-Trip Audit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Fleet Manager</strong></td>
                  <td>Full View</td>
                  <td>Read, Update Status, Assign Driver, Manage Routes</td>
                  <td>View &amp; Dispatch Work Orders</td>
                  <td>Corridor Optimizer &amp; Route Assignment</td>
                </tr>
                <tr>
                  <td><strong>Garage Mechanic</strong></td>
                  <td>Full View</td>
                  <td>Restricted (Read-Only Dossier)</td>
                  <td>Record Inspections, Update Repairs, Reorder Parts</td>
                  <td>Restricted</td>
                </tr>
                <tr>
                  <td><strong>Intercity Driver</strong></td>
                  <td>Full View</td>
                  <td>Restricted</td>
                  <td>Restricted</td>
                  <td>Assigned Bus Route, Trip Status &amp; Pre-Trip Sign-Off</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="arch-section">
            <h3>2. Transport &amp; Secret Controls</h3>
            <div class="arch-grid">
              <div class="arch-box">
                <h4>HTTPS / TLS Transport</h4>
                <p><strong>Production Hosting:</strong> Served over HTTPS with strict transport security and security headers (<code>X-Frame-Options: DENY</code>, <code>X-Content-Type-Options: nosniff</code>).</p>
              </div>
              <div class="arch-box">
                <h4>Azure Key Vault (Proposed Backend)</h4>
                <p><strong>Conceptual Target:</strong> In a full server deployment, SQL connection strings, JWT signing keys, and Cosmos DB tokens live in Azure Key Vault accessed via Managed Identities—never in client code.</p>
              </div>
            </div>
          </div>
        `
      },
      systemdesign: {
        title: 'System Design & Data Flow',
        subtitle: 'End-to-end separation between client control interface, API boundary, and data stores.',
        content: `
          <div class="arch-section">
            <div class="arch-status-row">
              <span class="arch-tag implemented">Static Client Architecture (Current Deployment)</span>
              <span class="arch-tag conceptual">Distributed Cloud Target</span>
            </div>
            <h3>1. Implemented vs. Proposed Topology</h3>
            <pre class="code-block">CURRENT DEPLOYED APPLICATION (Static Client SPA)
  [Browser UI: Terminal · Fleet · Garage · Routes · Profile]
        │
        ├──► RouteEngine (Dijkstra shortest-path on stored corridor graph)
        ├──► MaintenanceHub (Role-checked mutations + inspection workflow)
        └──► localStorage (Client-side session &amp; state persistence)

PROPOSED PRODUCTION CLOUD ARCHITECTURE (Academic Specification)
  [TransitPulse Client] ──(HTTPS / TLS 1.3)──► [API Gateway + RBAC Auth]
                                                      │
         ┌────────────────────────────────────────────┼──────────────────────┐
         ▼                                            ▼                      ▼
  [Azure SQL Database]                        [Azure Cosmos DB]      [Azure Blob Storage]
  (3NF Fleet &amp; WorkOrders)                    (Telemetry Stream)     (Pre-Trip Audits)
         │                                            │
         └──────────────────────┬─────────────────────┘
                                ▼
                     [Power BI Reporting]   +   [Azure Key Vault (Secrets)]</pre>
          </div>
        `
      }
    };

    this.initEventListeners();
  }

  initEventListeners() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
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

    const openBtn = document.getElementById('openArchModalBtn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.open());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalBackdrop && this.modalBackdrop.classList.contains('open')) {
        this.close();
      }
    });
  }

  open(tab = 'rdbms') {
    if (!this.modalBackdrop) return;
    this.modalBackdrop.classList.add('open');
    this.modalBackdrop.setAttribute('aria-hidden', 'false');
    this.switchTab(tab);
  }

  close() {
    if (!this.modalBackdrop) return;
    this.modalBackdrop.classList.remove('open');
    this.modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  switchTab(tab) {
    if (!this.tabData[tab]) return;
    this.activeTab = tab;

    this.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    const data = this.tabData[tab];
    if (this.contentContainer) {
      this.contentContainer.innerHTML = `
        <div class="arch-header-block">
          <h3>${data.title}</h3>
          <p>${data.subtitle}</p>
        </div>
        ${data.content}
      `;
    }
  }
}

window.ArchitectureModal = ArchitectureModal;
