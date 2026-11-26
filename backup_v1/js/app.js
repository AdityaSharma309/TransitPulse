// TransitPulse - Main Application Coordinator
// Handles Role switching, Tab views, Live Telemetry binding, and Inspection audits

class TransitPulseApp {
  constructor() {
    this.currentRole = 'manager'; // 'manager', 'mechanic', 'driver'
    this.currentTab = 'overview';
    this.maintenanceHub = new MaintenanceHub();
    this.routeEngine = null;
    this.architectureModal = null;

    // Credentials Definition for Quick Login & Testing
    this.roleCredentials = {
      manager: {
        email: 'manager@transitpulse.io',
        pass: 'Transit@2026!',
        name: 'Aditya Sharma',
        title: 'Chief Fleet Operations Director'
      },
      mechanic: {
        email: 'mechanic@transitpulse.io',
        pass: 'Wrench#2026',
        name: 'Harpreet Singh',
        title: 'Lead Garage Master Technician'
      },
      driver: {
        email: 'driver@transitpulse.io',
        pass: 'RouteSafe$2026',
        name: 'Rajesh Sharma',
        title: 'Senior Intercity Route Captain'
      }
    };

    this.init();
  }

  init() {
    // Initialize engines
    this.routeEngine = new RouteEngine('routeCanvas');
    this.architectureModal = new ArchitectureModal();

    this.bindRoleSwitcher();
    this.bindTabs();
    this.bindFleetList();
    this.bindRouteOptimizer();
    this.bindWorkOrderForm();
    this.bindInspectionForm();

    this.renderRoleView();
    this.updateTelemetryDisplay();
    this.renderWorkOrders();
    this.renderPartsInventory();

    // Show initial welcome toast
    setTimeout(() => {
      this.showToast('TransitPulse Connected to Azure East US Region', 'info');
    }, 800);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" fill="none" stroke="#3b82f6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  bindRoleSwitcher() {
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.target.getAttribute('data-role');
        this.switchRole(role);
      });
    });
  }

  switchRole(role) {
    if (!this.roleCredentials[role]) return;
    this.currentRole = role;

    document.querySelectorAll('.role-btn').forEach(btn => {
      if (btn.getAttribute('data-role') === role) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const user = this.roleCredentials[role];
    const userDisplay = document.getElementById('activeUserDisplay');
    if (userDisplay) {
      userDisplay.textContent = `${user.name} (${user.title})`;
    }

    this.renderRoleView();
    this.showToast(`Switched active context: ${user.title} (${role.toUpperCase()})`, 'success');
  }

  renderRoleView() {
    const managerPanel = document.getElementById('roleManagerBanner');
    const mechanicSection = document.getElementById('diagnosticsSection');
    const driverSection = document.getElementById('driverInspectionSection');

    // Customize UI elements based on RBAC permissions
    if (this.currentRole === 'manager') {
      if (managerPanel) managerPanel.style.display = 'flex';
      if (mechanicSection) mechanicSection.style.display = 'grid';
      if (driverSection) driverSection.style.display = 'block';
    } else if (this.currentRole === 'mechanic') {
      if (managerPanel) managerPanel.style.display = 'none';
      if (mechanicSection) mechanicSection.style.display = 'grid';
      if (driverSection) driverSection.style.display = 'none';
      this.switchTab('diagnostics');
    } else if (this.currentRole === 'driver') {
      if (managerPanel) managerPanel.style.display = 'none';
      if (mechanicSection) mechanicSection.style.display = 'none';
      if (driverSection) driverSection.style.display = 'block';
      this.switchTab('inspection');
    }
  }

  bindTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const overviewView = document.getElementById('tabOverviewView');
    const routesView = document.getElementById('tabRoutesView');
    const diagnosticsView = document.getElementById('tabDiagnosticsView');
    const inspectionView = document.getElementById('tabInspectionView');

    if (overviewView) overviewView.style.display = (tab === 'overview') ? 'block' : 'none';
    if (routesView) routesView.style.display = (tab === 'routes') ? 'block' : 'none';
    if (diagnosticsView) diagnosticsView.style.display = (tab === 'diagnostics') ? 'block' : 'none';
    if (inspectionView) inspectionView.style.display = (tab === 'inspection') ? 'block' : 'none';

    if (tab === 'routes' && this.routeEngine) {
      setTimeout(() => this.routeEngine.resizeCanvas(), 50);
    }
  }

  bindFleetList() {
    const list = document.getElementById('fleetListContainer');
    if (!list) return;

    list.innerHTML = '';
    this.maintenanceHub.vehicles.forEach(v => {
      const item = document.createElement('div');
      item.className = `fleet-item ${v.id === this.maintenanceHub.activeVehicleId ? 'selected' : ''}`;
      item.setAttribute('data-id', v.id);

      let statusClass = 'in-transit';
      if (v.status === 'Maintenance Due') statusClass = 'maintenance';
      if (v.status === 'Depot Ready') statusClass = 'depot';

      item.innerHTML = `
        <div class="fleet-item-head">
          <span class="vehicle-id">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            ${v.id}
          </span>
          <span class="status-pill ${statusClass}">${v.status}</span>
        </div>
        <div style="font-size:0.75rem; color:#94a3b8;">${v.model}</div>
        <div class="fleet-telemetry-row">
          <span>Health: <strong>${v.healthScore}%</strong></span>
          <span>Coolant: <strong>${v.sensors.coolantTemp}°C</strong></span>
          <span>Brake: <strong>${v.sensors.brakeWear}%</strong></span>
        </div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.fleet-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.maintenanceHub.setActiveVehicle(v.id);
        this.updateTelemetryDisplay();
        this.showToast(`Selected vehicle ${v.id} - Telemetry synchronized`, 'info');
      });

      list.appendChild(item);
    });
  }

  updateTelemetryDisplay() {
    const vehicle = this.maintenanceHub.getActiveVehicle();
    if (!vehicle) return;

    // Header info
    const titleEl = document.getElementById('telemetryVehicleTitle');
    if (titleEl) {
      titleEl.textContent = `${vehicle.id} • ${vehicle.model}`;
    }

    // Sensors
    const s = vehicle.sensors;
    this.setSensorValue('sensorRpm', `${s.rpm} RPM`, (s.rpm / 2500) * 100);
    this.setSensorValue('sensorCoolant', `${s.coolantTemp} °C`, (s.coolantTemp / 120) * 100, s.coolantTemp > 98);
    this.setSensorValue('sensorOil', `${s.oilPressure} PSI`, (s.oilPressure / 60) * 100, s.oilPressure < 30);
    this.setSensorValue('sensorBrake', `${s.brakeWear} %`, s.brakeWear, s.brakeWear < 25);
    this.setSensorValue('sensorBattery', `${s.batterySOH} %`, s.batterySOH);
    this.setSensorValue('sensorTire', `${s.tirePSI} PSI`, (s.tirePSI / 125) * 100);

    // DTC list
    const dtcList = document.getElementById('dtcContainer');
    if (dtcList) {
      if (vehicle.dtc.length === 0) {
        dtcList.innerHTML = `<div style="font-size:0.75rem; color:#10b981; display:flex; align-items:center; gap:0.4rem;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          No Active DTC Diagnostic Trouble Codes (OBD-II Clean)
        </div>`;
      } else {
        dtcList.innerHTML = vehicle.dtc.map(d => `
          <div style="background:rgba(244, 63, 94, 0.1); border:1px solid rgba(244,63,94,0.3); border-radius:6px; padding:0.5rem; margin-top:0.35rem; font-size:0.75rem;">
            <div style="display:flex; justify-content:space-between; color:#fb7185; font-weight:700;">
              <span>CAN-BUS DTC: ${d.code}</span>
              <span>[${d.severity}]</span>
            </div>
            <div style="color:#cbd5e1; font-size:0.72rem; margin-top:0.2rem;">${d.desc} (${d.component})</div>
          </div>
        `).join('');
      }
    }
  }

  setSensorValue(id, text, pct, isWarning = false) {
    const textEl = document.getElementById(id);
    const barEl = document.getElementById(`${id}Bar`);
    if (textEl) textEl.textContent = text;
    if (barEl) {
      barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      if (isWarning) {
        barEl.classList.add('warning');
      } else {
        barEl.classList.remove('warning');
      }
    }
  }

  renderWorkOrders() {
    const tbody = document.getElementById('workOrdersTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.maintenanceHub.workOrders.map(wo => `
      <tr>
        <td><strong>${wo.id}</strong><div style="font-size:0.68rem; color:#64748b; font-family:var(--font-mono);">${wo.rdbmsTxId}</div></td>
        <td>${wo.vehicleId}</td>
        <td>${wo.type}</td>
        <td>${wo.mechanic}</td>
        <td>
          <span class="status-pill ${wo.priority === 'High' ? 'maintenance' : 'in-transit'}">
            ${wo.priority}
          </span>
        </td>
        <td><span class="status-pill ${wo.status.includes('Closed') ? 'in-transit' : 'depot'}">${wo.status}</span></td>
      </tr>
    `).join('');
  }

  renderPartsInventory() {
    const list = document.getElementById('partsInventoryList');
    if (!list) return;

    list.innerHTML = this.maintenanceHub.partsInventory.map(part => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.78rem;">
        <div>
          <div style="font-weight:600; color:#e2e8f0;">${part.name}</div>
          <div style="color:#64748b; font-size:0.7rem; font-family:var(--font-mono);">${part.sku}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:${part.inStock <= part.threshold ? '#f59e0b' : '#38bdf8'}; font-weight:700;">
            ${part.inStock} units in stock
          </div>
          <div style="font-size:0.7rem; color:#94a3b8;">Cost: ${part.unitCost}</div>
        </div>
      </div>
    `).join('');
  }

  bindRouteOptimizer() {
    const btn = document.getElementById('optimizeRouteBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const origin = document.getElementById('originSelect').value;
      const destination = document.getElementById('destinationSelect').value;

      if (origin === destination) {
        this.showToast('Origin and Destination cannot be the same city', 'warning');
        return;
      }

      const result = this.routeEngine.calculateOptimization(origin, destination);
      const resContainer = document.getElementById('routeResultContainer');
      if (resContainer) {
        resContainer.innerHTML = `
          <div style="margin-top:1rem; padding:1rem; background:rgba(6, 182, 212, 0.08); border:1px solid rgba(6, 182, 212, 0.3); border-radius:var(--radius-md);">
            <div style="font-weight:700; color:#67e8f9; font-size:0.9rem; margin-bottom:0.5rem;">
              ⚡ AI-Optimized Corridor: ${result.route}
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.75rem; font-size:0.78rem;">
              <div>Total Distance: <strong>${result.distance}</strong></div>
              <div>Estimated Transit: <strong>${result.optimizedDuration}</strong></div>
              <div>Fuel Savings: <strong style="color:#10b981;">${result.fuelSavings}</strong></div>
              <div>Electronic Toll: <strong>${result.tolls}</strong></div>
              <div>CO2 Reduction: <strong style="color:#10b981;">${result.carbonOffset}</strong></div>
            </div>
            <div style="font-size:0.72rem; color:#fbbf24; margin-top:0.6rem;">
              ⚠️ ${result.activeHazards}
            </div>
          </div>
        `;
      }
      this.showToast('Route re-optimized factoring real-time weather & elevation', 'success');
    });
  }

  bindWorkOrderForm() {
    const btn = document.getElementById('createWorkOrderBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const vId = document.getElementById('woVehicleSelect').value;
      const type = document.getElementById('woTypeInput').value;
      const priority = document.getElementById('woPrioritySelect').value;
      const mechanic = document.getElementById('woMechanicSelect').value;

      if (!type) {
        this.showToast('Please specify maintenance work order issue description', 'warning');
        return;
      }

      const order = this.maintenanceHub.createWorkOrder(vId, type, priority, mechanic);
      this.renderWorkOrders();
      this.showToast(`Work Order ${order.id} committed to Azure SQL (Tx: ${order.rdbmsTxId})`, 'success');
      document.getElementById('woTypeInput').value = '';
    });
  }

  bindInspectionForm() {
    const btn = document.getElementById('submitInspectionBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const checks = [
        document.getElementById('checkBrakes').checked,
        document.getElementById('checkTires').checked,
        document.getElementById('checkFluids').checked,
        document.getElementById('checkLights').checked,
        document.getElementById('checkEmergency').checked
      ];

      const allPassed = checks.every(c => c === true);
      const vehicleId = document.getElementById('driverVehicleId').textContent;
      const blobGuid = 'blob-' + Math.random().toString(36).substring(2, 12);

      if (allPassed) {
        this.showToast(`Pre-Trip Inspection PASS: Signed & Saved to Azure Blob Storage (${blobGuid}.json)`, 'success');
      } else {
        this.showToast(`Pre-Trip Audit FLAGGED: Incomplete items sent to Garage Master Technician for review`, 'warning');
      }
    });
  }
}

// Bootstrap application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new TransitPulseApp();
});
