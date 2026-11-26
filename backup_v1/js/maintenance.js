// TransitPulse - Predictive Maintenance & OBD-II Diagnostics Engine
class MaintenanceHub {
  constructor() {
    this.vehicles = [
      {
        id: 'TP-1081',
        model: 'Volvo 9800 Intercity HD',
        driver: 'Rajesh Sharma (DRV-882)',
        status: 'In-Transit',
        healthScore: 98,
        mileage: '142,500 km',
        sensors: {
          rpm: 1650,
          coolantTemp: 89, // Celsius
          oilPressure: 44, // PSI
          brakeWear: 78,   // % remaining
          batterySOH: 97,  // State of Health %
          tirePSI: 112     // PSI
        },
        dtc: []
      },
      {
        id: 'TP-2044',
        model: 'Scania Metrolink Multi-Axle',
        driver: 'Vikram Singh (DRV-714)',
        status: 'In-Transit',
        healthScore: 84,
        mileage: '210,800 km',
        sensors: {
          rpm: 1820,
          coolantTemp: 101, // High
          oilPressure: 38,
          brakeWear: 34,
          batterySOH: 92,
          tirePSI: 106
        },
        dtc: [
          { code: 'P0128', desc: 'Coolant Temp Below Thermostat Regulating Temp', severity: 'Warning', component: 'Cooling Loop' }
        ]
      },
      {
        id: 'TP-3092',
        model: 'BharatBenz 1624 Heavy Hauler',
        driver: 'Anil Kumar (DRV-903)',
        status: 'Maintenance Due',
        healthScore: 68,
        mileage: '284,120 km',
        sensors: {
          rpm: 850,
          coolantTemp: 94,
          oilPressure: 28, // Low
          brakeWear: 18,   // Critical
          batterySOH: 82,
          tirePSI: 98
        },
        dtc: [
          { code: 'C0035', desc: 'Left Front Wheel Speed Sensor Circuit Fault', severity: 'Critical', component: 'ABS / Brakes' },
          { code: 'P0524', desc: 'Engine Oil Pressure Too Low', severity: 'High', component: 'Lubrication' }
        ]
      },
      {
        id: 'TP-4115',
        model: 'Tata Marcopolo Paradiso Intercity',
        driver: 'Sunil Verma (DRV-629)',
        status: 'Depot Ready',
        healthScore: 99,
        mileage: '68,400 km',
        sensors: {
          rpm: 0,
          coolantTemp: 32,
          oilPressure: 45,
          brakeWear: 94,
          batterySOH: 99,
          tirePSI: 114
        },
        dtc: []
      }
    ];

    this.workOrders = [
      {
        id: 'WO-8821',
        vehicleId: 'TP-3092',
        type: 'Predictive Brake Overhaul',
        mechanic: 'Master Tech Harpreet',
        priority: 'High',
        status: 'In Progress',
        createdDate: '2026-10-27 14:30',
        parts: 'Ceramic Brake Pad Kit, Rotors 420mm',
        rdbmsTxId: 'TX-SQL-981048-AZ'
      },
      {
        id: 'WO-8819',
        vehicleId: 'TP-2044',
        type: 'Thermostat Valve Calibration',
        mechanic: 'Tech Somnath',
        priority: 'Medium',
        status: 'Pending Parts',
        createdDate: '2026-10-27 18:15',
        parts: 'Thermostat Sensor OEM-B',
        rdbmsTxId: 'TX-SQL-980921-AZ'
      },
      {
        id: 'WO-8790',
        vehicleId: 'TP-1081',
        type: 'Scheduled 140K Preventative Inspection',
        mechanic: 'Master Tech Harpreet',
        priority: 'Normal',
        status: 'Closed & Audited',
        createdDate: '2026-10-25 09:00',
        parts: 'Synthetic Oil 15W40, Fleet Fuel Filter',
        rdbmsTxId: 'TX-SQL-979402-AZ'
      }
    ];

    this.partsInventory = [
      { sku: 'BRK-PAD-CER-42', name: 'Heavy Duty Ceramic Brake Pads', inStock: 32, threshold: 10, unitCost: '₹4,800', status: 'Optimal' },
      { sku: 'FLT-OIL-SYN-15W', name: 'Shell Rimula 15W40 Full Synthetic (20L)', inStock: 14, threshold: 15, unitCost: '₹7,200', status: 'Reorder Triggered' },
      { sku: 'SNS-TEMP-THM-09', name: 'Coolant Thermostat Temperature Sensor', inStock: 5, threshold: 8, unitCost: '₹1,450', status: 'Low Stock' },
      { sku: 'ACT-TURBO-VGT-4', name: 'Variable Geometry Turbo Actuator', inStock: 9, threshold: 4, unitCost: '₹18,500', status: 'Optimal' }
    ];

    this.activeVehicleId = 'TP-1081';
    this.startTelemetryJitter();
  }

  startTelemetryJitter() {
    // Subtle real-time ECU jitter simulation
    setInterval(() => {
      const active = this.vehicles.find(v => v.id === this.activeVehicleId);
      if (active && active.status === 'In-Transit') {
        active.sensors.rpm = Math.floor(1600 + Math.random() * 80);
        active.sensors.coolantTemp = Math.floor(88 + Math.random() * 3);
        if (window.appInstance) {
          window.appInstance.updateTelemetryDisplay();
        }
      }
    }, 2500);
  }

  getActiveVehicle() {
    return this.vehicles.find(v => v.id === this.activeVehicleId) || this.vehicles[0];
  }

  setActiveVehicle(vehicleId) {
    this.activeVehicleId = vehicleId;
  }

  createWorkOrder(vehicleId, type, priority, mechanic, parts) {
    const id = `WO-${Math.floor(8822 + Math.random() * 1000)}`;
    const txId = `TX-SQL-${Math.floor(982000 + Math.random() * 9000)}-AZ`;
    const newOrder = {
      id,
      vehicleId,
      type,
      mechanic: mechanic || 'Unassigned',
      priority,
      status: 'Open',
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      parts: parts || 'Standard Inspection Kit',
      rdbmsTxId: txId
    };
    this.workOrders.unshift(newOrder);
    return newOrder;
  }

  updateOrderStatus(orderId, newStatus) {
    const order = this.workOrders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      return true;
    }
    return false;
  }
}

window.MaintenanceHub = MaintenanceHub;
