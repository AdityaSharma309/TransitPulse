// TransitPulse - Maintenance & Fleet Operations Domain Controller
// Enforces role-based authorization on state mutations alongside UI controls.

class MaintenanceHub {
  constructor() {
    this.data = window.TransitPulseData || { vehicles: [], workOrders: [], partsInventory: [] };
    this.vehicles = this.data.vehicles;
    this.workOrders = this.data.workOrders;
    this.partsInventory = this.data.partsInventory;
    this.activeVehicleId = 'TP-1081';

    this.startTelemetryJitter();
  }

  // Service-layer authorization check
  assertAuthorized(actorRole, allowedRoles) {
    if (!actorRole || !allowedRoles.includes(actorRole)) {
      return {
        ok: false,
        error: `Access denied: action requires ${allowedRoles.join(' or ')} role.`
      };
    }
    return { ok: true };
  }

  // Simulated ECU bench readout drift for active in-transit coaches
  startTelemetryJitter() {
    setInterval(() => {
      const active = this.vehicles.find(v => v.id === this.activeVehicleId);
      if (active && active.status === 'In-Transit') {
        active.sensors.rpm = Math.floor(1620 + Math.random() * 80);
        active.sensors.coolantTemp = Math.floor(88 + Math.random() * 4);
        active.sensors.oilPressure = Math.floor(42 + Math.random() * 4);
        if (window.appInstance) {
          window.appInstance.updateTelemetryReadouts();
        }
      }
    }, 3200);
  }

  getActiveVehicle() {
    return this.vehicles.find(v => v.id === this.activeVehicleId) || this.vehicles[0];
  }

  setActiveVehicle(vehicleId) {
    this.activeVehicleId = vehicleId;
  }

  // Create Work Order (Mechanic or Manager)
  createWorkOrder(vehicleId, type, priority, mechanic, parts, notes, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['mechanic', 'manager']);
    if (!auth.ok) return { error: auth.error };

    const randomId = Math.floor(8822 + Math.random() * 1000);
    const txId = `TX-SQL-${Math.floor(982000 + Math.random() * 9000)}-AZ`;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const initialStatus = priority === 'Critical-SOS' ? 'Under repair' : 'Open';

    const newOrder = {
      id: `WO-${randomId}`,
      vehicleId,
      type,
      mechanic: mechanic || 'Master Tech Harpreet Singh',
      priority: priority || 'High',
      status: initialStatus,
      createdDate: dateStr,
      parts: parts || 'Standard Inspection Kit',
      rdbmsTxId: txId,
      notes: notes || 'Work order logged at terminal garage.'
    };

    this.workOrders.unshift(newOrder);

    const v = this.vehicles.find(veh => veh.id === vehicleId);
    if (v && (priority === 'Critical-SOS' || priority === 'High')) {
      v.status = 'Maintenance Due';
      v.healthLabel = initialStatus === 'Under repair' ? 'Under repair' : 'Maintenance required';
      v.subStatus = `Work Order ${newOrder.id} Logged`;
    }

    return newOrder;
  }

  // Advance work order status: Open / Inspection required -> Under repair -> Closed & Audited
  advanceOrderStatus(orderId, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['mechanic']);
    if (!auth.ok) return { error: auth.error };

    const order = this.workOrders.find(o => o.id === orderId);
    if (!order) return null;

    const v = this.vehicles.find(veh => veh.id === order.vehicleId);

    if (order.status === 'Open' || order.status === 'Inspection required' || order.status === 'Pending-Parts') {
      order.status = 'Under repair';
      if (v) {
        v.status = 'Maintenance Due';
        v.healthLabel = 'Under repair';
        v.subStatus = `Under repair (${order.id})`;
      }
    } else if (order.status === 'Under repair' || order.status === 'In-Progress') {
      order.status = 'Closed & Audited';
      if (v) {
        v.status = 'Depot Ready';
        v.healthLabel = 'Healthy';
        v.healthScore = Math.min(99, Math.max(90, v.healthScore + 25));
        v.lastService = new Date().toISOString().slice(0, 10);
        v.subStatus = 'Cleared in Garage • Available';
        v.sensors.brakeWear = Math.max(v.sensors.brakeWear, 88);
        v.sensors.oilPressure = Math.max(v.sensors.oilPressure, 45);
        v.dtc = [];
      }
    }
    return order;
  }

  // Update repair notes or status directly (Mechanic only)
  updateWorkOrderDetails(orderId, updates, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['mechanic']);
    if (!auth.ok) return { error: auth.error };

    const order = this.workOrders.find(o => o.id === orderId);
    if (!order) return null;

    if (typeof updates.notes === 'string') {
      order.notes = updates.notes.trim() || order.notes;
    }
    if (updates.status) {
      order.status = updates.status;
      const v = this.vehicles.find(veh => veh.id === order.vehicleId);
      if (v) {
        if (updates.status === 'Under repair') {
          v.status = 'Maintenance Due';
          v.healthLabel = 'Under repair';
        } else if (updates.status === 'Closed & Audited') {
          v.status = 'Depot Ready';
          v.healthLabel = 'Healthy';
          v.lastService = new Date().toISOString().slice(0, 10);
          v.dtc = [];
        }
      }
    }
    return order;
  }

  // Record vehicle inspection outcome (Mechanic only)
  recordInspection(vehicleId, healthLabel, notes, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['mechanic']);
    if (!auth.ok) return { error: auth.error };

    const v = this.vehicles.find(veh => veh.id === vehicleId);
    if (!v) return null;

    const today = new Date().toISOString().slice(0, 10);
    v.lastService = today;
    v.healthLabel = healthLabel;

    if (healthLabel === 'Healthy') {
      v.status = 'Depot Ready';
      v.healthScore = Math.max(v.healthScore, 94);
      v.subStatus = 'Inspection Passed • Available';
      v.dtc = [];
    } else if (healthLabel === 'Inspection required') {
      v.healthScore = Math.min(v.healthScore, 84);
      v.subStatus = 'Inspection Flagged';
    } else if (healthLabel === 'Maintenance required') {
      v.status = 'Maintenance Due';
      v.healthScore = Math.min(v.healthScore, 69);
      v.subStatus = 'Scheduled for Service';
    } else if (healthLabel === 'Under repair') {
      v.status = 'Maintenance Due';
      v.healthScore = Math.min(v.healthScore, 68);
      v.subStatus = 'Stationed in Garage Workshop';
    }

    if (notes) {
      const openWo = this.workOrders.find(o => o.vehicleId === vehicleId && !o.status.includes('Closed'));
      if (openWo) {
        openWo.notes = notes;
      } else {
        this.createWorkOrder(
          vehicleId,
          `Garage Inspection: ${healthLabel}`,
          healthLabel === 'Healthy' ? 'Normal' : 'High',
          'Master Tech Harpreet Singh',
          'Inspection Checklist',
          notes,
          actorRole
        );
      }
    }

    return v;
  }

  // Reorder spare parts (Mechanic only)
  reorderPart(sku, amount = 10, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['mechanic']);
    if (!auth.ok) return { error: auth.error };

    const part = this.partsInventory.find(p => p.sku === sku);
    if (part) {
      part.inStock += amount;
      if (part.inStock > part.threshold) {
        part.status = 'Optimal';
      }
      return part;
    }
    return null;
  }

  // Reassign driver to a bus (Fleet Manager only)
  assignDriver(vehicleId, driverName, driverId, driverPhone, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['manager']);
    if (!auth.ok) return { error: auth.error };

    const v = this.vehicles.find(veh => veh.id === vehicleId);
    if (v) {
      v.driver.name = driverName;
      v.driver.id = driverId || v.driver.id;
      if (driverPhone) v.driver.phone = driverPhone;
      return { ok: true, vehicle: v };
    }
    return { ok: false, error: 'Vehicle not found.' };
  }

  // Update bus details & status (Fleet Manager only)
  updateVehicleDetails(vehicleId, updates, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['manager']);
    if (!auth.ok) return { error: auth.error };

    const v = this.vehicles.find(veh => veh.id === vehicleId);
    if (!v) return { ok: false, error: 'Vehicle not found.' };

    if (updates.status) {
      v.status = updates.status;
      if (updates.status === 'Depot Ready') {
        v.subStatus = updates.subStatus || 'Ready on Stand';
        if (v.healthLabel === 'Under repair') v.healthLabel = 'Healthy';
      } else if (updates.status === 'In-Transit') {
        v.subStatus = updates.subStatus || 'Active Corridor Trip';
      } else if (updates.status === 'Maintenance Due') {
        v.subStatus = updates.subStatus || 'Assigned to Garage';
        v.healthLabel = 'Maintenance required';
      }
    }
    if (updates.seating) v.seating = updates.seating;
    if (updates.nextService) v.nextService = updates.nextService;
    if (updates.bay) v.bay = updates.bay;

    if (updates.origin && updates.destination && window.appInstance && window.appInstance.routeEngine) {
      const calculated = window.appInstance.routeEngine.calculateOptimization(updates.origin, updates.destination);
      if (calculated && !calculated.error) {
        v.route.origin = updates.origin;
        v.route.destination = updates.destination;
        v.route.corridorCode = calculated.corridorCode;
        v.route.distance = calculated.distance;
        v.route.estDuration = calculated.optimizedDuration;
        v.route.tollFastTag = calculated.tolls;
        v.route.stops = calculated.stops;
        v.route.weatherAdvisory = calculated.activeHazards;
      }
    }
    if (updates.scheduledDeparture) {
      v.route.scheduledDeparture = updates.scheduledDeparture;
    }

    return { ok: true, vehicle: v };
  }

  // Driver Pre-Trip Inspection Sign-Off (Driver only)
  submitPreTripInspection(vehicleId, allPassed, actorRole) {
    const auth = this.assertAuthorized(actorRole, ['driver']);
    if (!auth.ok) return { error: auth.error };

    const v = this.vehicles.find(veh => veh.id === vehicleId);
    if (!v) return { error: 'Assigned vehicle not found.' };

    if (allPassed) {
      v.driver.preTripSigned = true;
      v.driver.lastSignedTime = 'Signed & Verified';
      return { ok: true, vehicle: v };
    }

    v.driver.preTripSigned = false;
    v.driver.lastSignedTime = 'Flagged for Garage Review';
    v.healthLabel = 'Inspection required';
    return { ok: false, flagged: true, vehicle: v };
  }
}

window.MaintenanceHub = MaintenanceHub;
