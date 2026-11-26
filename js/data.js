// TransitPulse - Central Domain Data Model & Persistence Store
// Preserves relational vehicle, driver, route, work order, and parts data with localStorage sync.

const INITIAL_VEHICLES = [
  {
    id: 'TP-1081',
    regNumber: 'DL-01-TP-1081',
    bay: 'Bay 01',
    model: 'Volvo 9800 Intercity HD',
    powertrain: 'Euro VI Diesel (11L 460 HP)',
    seating: '48 Executive Reclining (2+2)',
    status: 'In-Transit',
    subStatus: 'Boarding Passenger Concourse',
    healthScore: 98,
    healthLabel: 'Healthy',
    mileage: '142,500 km',
    lastService: '2026-10-25',
    nextService: '2026-12-15',
    driver: {
      id: 'DRV-882',
      name: 'Rajesh Sharma',
      role: 'Senior Intercity Route Captain',
      phone: '+91 98101 44521',
      license: 'DL-IND-8829014-HMV',
      experience: '14 Years',
      rating: 4.95,
      preTripSigned: true,
      lastSignedTime: 'Today, 07:45 AM'
    },
    route: {
      origin: 'Delhi Central Hub (DEL)',
      destination: 'Jaipur Depot (JAI)',
      corridorCode: 'DEL-JAI',
      distance: '280 km',
      estDuration: '4 hrs 30 mins',
      scheduledDeparture: '12:30 IST',
      tollFastTag: '₹420',
      fuelSavings: '28 Liters (Optimal)',
      stops: ['Delhi Central (Bay 01)', 'Gurgaon Cyber City', 'Neemrana Gateway', 'Kotputli Bypass', 'Jaipur Depot'],
      elevationProfile: 'Rolling Plains (Max 420m AMSL)',
      weatherAdvisory: 'Clear, dry tarmac. Visibility > 10 km.'
    },
    sensors: {
      rpm: 1650,
      coolantTemp: 89,
      oilPressure: 44,
      brakeWear: 78,
      batterySOH: 97,
      tirePSI: 112,
      fuelLevel: 82
    },
    dtc: []
  },
  {
    id: 'TP-2044',
    regNumber: 'RJ-14-TP-2044',
    bay: 'Bay 02',
    model: 'Scania Metrolink Multi-Axle HD',
    powertrain: 'Euro VI Bio-Diesel (13L 410 HP)',
    seating: '53 Club Class (2+2)',
    status: 'In-Transit',
    subStatus: 'Pre-Departure Check',
    healthScore: 84,
    healthLabel: 'Inspection required',
    mileage: '210,800 km',
    lastService: '2026-09-18',
    nextService: '2026-11-28',
    driver: {
      id: 'DRV-714',
      name: 'Vikram Singh',
      role: 'Intercity Express Pilot',
      phone: '+91 98290 33812',
      license: 'RJ-IND-7144021-HMV',
      experience: '9 Years',
      rating: 4.82,
      preTripSigned: true,
      lastSignedTime: 'Today, 08:15 AM'
    },
    route: {
      origin: 'Jaipur Depot (JAI)',
      destination: 'Ahmedabad Terminal (AMD)',
      corridorCode: 'JAI-AMD',
      distance: '650 km',
      estDuration: '10 hrs 45 mins',
      scheduledDeparture: '13:15 IST',
      tollFastTag: '₹890',
      fuelSavings: '54 Liters (Via Expressway)',
      stops: ['Jaipur Depot (Bay 02)', 'Ajmer Express Bypass', 'Beawar Junction', 'Udaipur Super Corridor', 'Ahmedabad Terminal'],
      elevationProfile: 'Aravalli Foot-Hills (Max 680m AMSL)',
      weatherAdvisory: 'Gusting crosswinds between Beawar & Udaipur. Speed advisory 75 km/h.'
    },
    sensors: {
      rpm: 1820,
      coolantTemp: 101,
      oilPressure: 38,
      brakeWear: 34,
      batterySOH: 92,
      tirePSI: 106,
      fuelLevel: 64
    },
    dtc: [
      { code: 'P0128', desc: 'Coolant Temp Below Thermostat Regulating Temp', severity: 'Warning', component: 'Cooling Loop' }
    ]
  },
  {
    id: 'TP-3092',
    regNumber: 'MH-04-TP-3092',
    bay: 'Bay 03',
    model: 'BharatBenz 1624 Heavy Hauler Coach',
    powertrain: 'OM 926 Turbo Diesel (240 HP)',
    seating: '45 Sleeper & Semi-Sleeper',
    status: 'Maintenance Due',
    subStatus: 'Stationed in Garage Workshop',
    healthScore: 68,
    healthLabel: 'Under repair',
    mileage: '284,120 km',
    lastService: '2026-08-10',
    nextService: 'OVERDUE (Service Required)',
    driver: {
      id: 'DRV-903',
      name: 'Anil Kumar',
      role: 'Heavy Fleet Logistics Specialist',
      phone: '+91 97654 22109',
      license: 'MH-IND-9033281-HMV',
      experience: '12 Years',
      rating: 4.70,
      preTripSigned: false,
      lastSignedTime: 'Pending Brake Inspection'
    },
    route: {
      origin: 'Ahmedabad Terminal (AMD)',
      destination: 'Mumbai Super Hub (BOM)',
      corridorCode: 'AMD-BOM',
      distance: '530 km',
      estDuration: '8 hrs 50 mins',
      scheduledDeparture: 'Delayed (In Garage)',
      tollFastTag: '₹750',
      fuelSavings: 'N/A (Grounded)',
      stops: ['Ahmedabad Terminal (Bay 03)', 'Vadodara Express Hub', 'Bharuch Narmada Bridge', 'Surat Ring Road', 'Mumbai Super Hub'],
      elevationProfile: 'Coastal Plain Corridor (Max 120m AMSL)',
      weatherAdvisory: 'Heavy monsoon downpour warning south of Vapi. High hydroplane risk.'
    },
    sensors: {
      rpm: 850,
      coolantTemp: 94,
      oilPressure: 28,
      brakeWear: 18,
      batterySOH: 82,
      tirePSI: 98,
      fuelLevel: 45
    },
    dtc: [
      { code: 'C0035', desc: 'Left Front Wheel Speed Sensor Circuit Fault', severity: 'Critical', component: 'ABS / Brakes' },
      { code: 'P0524', desc: 'Engine Oil Pressure Too Low', severity: 'High', component: 'Lubrication' }
    ]
  },
  {
    id: 'TP-4115',
    regNumber: 'MH-12-TP-4115',
    bay: 'Bay 04',
    model: 'Tata Marcopolo Paradiso Intercity',
    powertrain: 'Cummins ISB 6.7L Euro VI (285 HP)',
    seating: '49 Executive Reclining (2+2)',
    status: 'Depot Ready',
    subStatus: 'Audited & Cleared on Stand',
    healthScore: 99,
    healthLabel: 'Healthy',
    mileage: '68,400 km',
    lastService: '2026-10-20',
    nextService: '2027-01-10',
    driver: {
      id: 'DRV-629',
      name: 'Sunil Verma',
      role: 'Regional Expressway Captain',
      phone: '+91 99221 88710',
      license: 'MH-IND-6291932-HMV',
      experience: '8 Years',
      rating: 4.88,
      preTripSigned: true,
      lastSignedTime: 'Today, 09:30 AM'
    },
    route: {
      origin: 'Mumbai Super Hub (BOM)',
      destination: 'Pune Regional Depot (PUN)',
      corridorCode: 'BOM-PUN',
      distance: '150 km',
      estDuration: '3 hrs 15 mins',
      scheduledDeparture: '14:45 IST',
      tollFastTag: '₹320',
      fuelSavings: '16 Liters (Regenerative braking)',
      stops: ['Mumbai Super Hub (Bay 04)', 'Navi Mumbai Hub', 'Khandala Ghat Ascent', 'Lonavala Rest Stop', 'Pune Regional Depot'],
      elevationProfile: 'Western Ghats Ascent (600m Elevation Climb)',
      weatherAdvisory: 'Dense fog through Bhor Ghat. Automated fog lamps active.'
    },
    sensors: {
      rpm: 0,
      coolantTemp: 32,
      oilPressure: 45,
      brakeWear: 94,
      batterySOH: 99,
      tirePSI: 114,
      fuelLevel: 95
    },
    dtc: []
  },
  {
    id: 'TP-5028',
    regNumber: 'KA-01-TP-5028',
    bay: 'Bay 05',
    model: 'Scania 14.5m Multi-Axle EV Sleeper',
    powertrain: 'Dual Permanent-Magnet Motor (480 kW, 540 kWh Battery)',
    seating: '36 Luxury Individual Sleeper Pods',
    status: 'In-Transit',
    subStatus: 'DC Fast Charging 180kW • 88% SOC',
    healthScore: 95,
    healthLabel: 'Healthy',
    mileage: '94,200 km',
    lastService: '2026-10-12',
    nextService: '2026-12-20',
    driver: {
      id: 'DRV-512',
      name: 'Gurpreet Gill',
      role: 'Senior Electric Corridor Master',
      phone: '+91 98440 11984',
      license: 'KA-IND-5120392-HMV',
      experience: '11 Years',
      rating: 4.92,
      preTripSigned: true,
      lastSignedTime: 'Today, 06:50 AM'
    },
    route: {
      origin: 'Hyderabad Central (HYD)',
      destination: 'Bangalore Tech Corridor (BLR)',
      corridorCode: 'HYD-BLR',
      distance: '570 km',
      estDuration: '8 hrs 40 mins',
      scheduledDeparture: '15:30 IST',
      tollFastTag: '₹710',
      fuelSavings: 'Zero Diesel (340 kWh EV Consumption)',
      stops: ['Hyderabad Central (Bay 05)', 'Shadnagar EV Supercharger', 'Kurnool Transit Hub', 'Anantapur Bypass', 'Bangalore Tech Corridor'],
      elevationProfile: 'Deccan Plateau (Max 920m AMSL)',
      weatherAdvisory: 'Clear skies, high ambient temperature 34°C. Battery thermal management active.'
    },
    sensors: {
      rpm: 1540,
      coolantTemp: 42,
      oilPressure: 48,
      brakeWear: 86,
      batterySOH: 94,
      tirePSI: 110,
      fuelLevel: 88
    },
    dtc: []
  },
  {
    id: 'TP-6302',
    regNumber: 'TN-09-TP-6302',
    bay: 'Bay 06',
    model: 'Volvo 9600 Intercity Tri-Axle',
    powertrain: 'D13K Euro VI Step E (460 HP)',
    seating: '51 Club Class Premium (2+2)',
    status: 'Depot Ready',
    subStatus: 'Fuelled & Departure Ready',
    healthScore: 91,
    healthLabel: 'Healthy',
    mileage: '187,300 km',
    lastService: '2026-10-02',
    nextService: '2026-12-05',
    driver: {
      id: 'DRV-405',
      name: 'Mehtab Khan',
      role: 'Southern Corridor Master Pilot',
      phone: '+91 94441 55230',
      license: 'TN-IND-4058912-HMV',
      experience: '16 Years',
      rating: 4.96,
      preTripSigned: true,
      lastSignedTime: 'Today, 10:15 AM'
    },
    route: {
      origin: 'Bangalore Tech Corridor (BLR)',
      destination: 'Chennai Port Terminal (MAA)',
      corridorCode: 'BLR-MAA',
      distance: '345 km',
      estDuration: '5 hrs 30 mins',
      scheduledDeparture: '16:15 IST',
      tollFastTag: '₹460',
      fuelSavings: '32 Liters (Optimal Highway)',
      stops: ['Bangalore Tech (Bay 06)', 'Hosur Industrial Ring', 'Krishnagiri Junction', 'Ambur Express Stop', 'Chennai Port Terminal'],
      elevationProfile: 'Eastern Ghats Descent (900m to Sea Level)',
      weatherAdvisory: 'Intermittent northeast monsoon drizzle near Kanchipuram.'
    },
    sensors: {
      rpm: 0,
      coolantTemp: 30,
      oilPressure: 46,
      brakeWear: 82,
      batterySOH: 95,
      tirePSI: 112,
      fuelLevel: 90
    },
    dtc: []
  }
];

const INITIAL_WORK_ORDERS = [
  {
    id: 'WO-8821',
    vehicleId: 'TP-3092',
    type: 'Predictive Brake Overhaul & Sensor Recalibration',
    mechanic: 'Master Tech Harpreet Singh',
    priority: 'Critical-SOS',
    status: 'Under repair',
    createdDate: '2026-10-27 14:30',
    parts: 'Ceramic Brake Pad Kit (BRK-PAD-CER-42), Wheel Speed Sensor (SNS-ABS-WHL-04)',
    rdbmsTxId: 'TX-SQL-981048-AZ',
    notes: 'Brake pads worn down to 18%. Left front ABS sensor reporting intermittent signal dropout.'
  },
  {
    id: 'WO-8819',
    vehicleId: 'TP-2044',
    type: 'Thermostat Valve Calibration & Coolant Flush',
    mechanic: 'Tech Somnath Sen',
    priority: 'Normal',
    status: 'Inspection required',
    createdDate: '2026-10-27 18:15',
    parts: 'Thermostat Sensor OEM-B (SNS-TEMP-THM-09)',
    rdbmsTxId: 'TX-SQL-980921-AZ',
    notes: 'Thermostat regulating valve delayed response detected during highway climb.'
  },
  {
    id: 'WO-8790',
    vehicleId: 'TP-1081',
    type: 'Scheduled 140,000 km Preventative Inspection & Filter Swap',
    mechanic: 'Master Tech Harpreet Singh',
    priority: 'Normal',
    status: 'Closed & Audited',
    createdDate: '2026-10-25 09:00',
    parts: 'Shell Rimula 15W40 Full Synthetic (FLT-OIL-SYN-15W), Fleet Air Filter',
    rdbmsTxId: 'TX-SQL-979402-AZ',
    notes: 'Full multi-point check completed. Valve clearances within 0.02mm tolerance.'
  }
];

const INITIAL_PARTS = [
  { sku: 'BRK-PAD-CER-42', name: 'Heavy Duty Ceramic Brake Pad Set (420mm)', inStock: 32, threshold: 10, unitCost: '₹4,800', status: 'Optimal' },
  { sku: 'FLT-OIL-SYN-15W', name: 'Shell Rimula 15W40 Full Synthetic Heavy Engine Oil (20L)', inStock: 14, threshold: 15, unitCost: '₹7,200', status: 'Reorder Triggered' },
  { sku: 'SNS-TEMP-THM-09', name: 'Coolant Thermostat Temperature Sensor Module', inStock: 5, threshold: 8, unitCost: '₹1,450', status: 'Low Stock' },
  { sku: 'ACT-TURBO-VGT-4', name: 'Variable Geometry Turbocharger (VGT) Actuator', inStock: 9, threshold: 4, unitCost: '₹18,500', status: 'Optimal' },
  { sku: 'SNS-ABS-WHL-04', name: 'Inductive Wheel Speed ABS Sensor Kit', inStock: 18, threshold: 6, unitCost: '₹2,600', status: 'Optimal' },
  { sku: 'BAT-CELL-EV-MOD', name: 'High-Density NMC Lithium Battery Cell Module (48V)', inStock: 4, threshold: 3, unitCost: '₹42,000', status: 'Optimal' }
];

// Credentials kept internal to auth verification helper (not exposed in DOM)
const ROLE_PROFILES = {
  manager: {
    email: 'manager@transitpulse.io',
    name: 'Aditya Sharma',
    title: 'Fleet Operations Manager',
    roleTag: 'Fleet Manager',
    assignedVehicleId: null,
    scope: 'Fleet roster, driver assignments, corridor route management, and dispatch status.'
  },
  mechanic: {
    email: 'mechanic@transitpulse.io',
    name: 'Harpreet Singh',
    title: 'Lead Garage Technician',
    roleTag: 'Garage Mechanic',
    assignedVehicleId: null,
    scope: 'Vehicle health inspections, repair work orders, diagnostic readings, and spare parts.'
  },
  driver: {
    email: 'driver@transitpulse.io',
    name: 'Rajesh Sharma',
    title: 'Senior Intercity Driver',
    roleTag: 'Intercity Driver',
    assignedVehicleId: 'TP-1081',
    scope: 'Assigned bus (TP-1081), scheduled corridor route, trip status, and pre-trip sign-off.'
  }
};

// Hash-free verification table for static demo authentication (credentials not rendered in UI)
const ROLE_AUTH_SECRETS = {
  manager: 'Transit@2026!',
  mechanic: 'Wrench#2026',
  driver: 'RouteSafe$2026'
};

function cloneDefaults() {
  return {
    vehicles: JSON.parse(JSON.stringify(INITIAL_VEHICLES)),
    workOrders: JSON.parse(JSON.stringify(INITIAL_WORK_ORDERS)),
    partsInventory: JSON.parse(JSON.stringify(INITIAL_PARTS))
  };
}

function loadPersistedData() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('transitpulse_persisted_state_v2') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = cloneDefaults();
      return {
        vehicles: Array.isArray(parsed.vehicles) && parsed.vehicles.length ? parsed.vehicles : defaults.vehicles,
        workOrders: Array.isArray(parsed.workOrders) ? parsed.workOrders : defaults.workOrders,
        partsInventory: Array.isArray(parsed.partsInventory) && parsed.partsInventory.length ? parsed.partsInventory : defaults.partsInventory
      };
    }
  } catch (err) {
    console.warn('Could not load persisted TransitPulse state:', err);
  }
  return cloneDefaults();
}

const loaded = loadPersistedData();

window.TransitPulseData = {
  vehicles: loaded.vehicles,
  workOrders: loaded.workOrders,
  partsInventory: loaded.partsInventory,
  profiles: ROLE_PROFILES,
  authenticate: function(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    for (const [role, profile] of Object.entries(ROLE_PROFILES)) {
      if (profile.email.toLowerCase() === normalizedEmail && ROLE_AUTH_SECRETS[role] === String(password || '').trim()) {
        return { role, profile };
      }
    }
    return null;
  },
  getProfile: function(role) {
    return ROLE_PROFILES[role] || null;
  },
  deriveHealthLabel: function(vehicle, workOrders) {
    const activeOrder = (workOrders || this.workOrders).find(
      wo => wo.vehicleId === vehicle.id && !String(wo.status).toLowerCase().includes('closed')
    );
    if (vehicle.healthLabel) {
      return vehicle.healthLabel;
    }
    if (activeOrder && (String(activeOrder.status).toLowerCase().includes('repair') || String(activeOrder.status).toLowerCase().includes('progress'))) {
      return 'Under repair';
    }
    if (vehicle.status === 'Maintenance Due' || vehicle.healthScore < 70) {
      return 'Maintenance required';
    }
    if (vehicle.healthScore < 88 || (vehicle.dtc && vehicle.dtc.length > 0)) {
      return 'Inspection required';
    }
    return 'Healthy';
  },
  saveState: function() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('transitpulse_persisted_state_v2', JSON.stringify({
          vehicles: this.vehicles,
          workOrders: this.workOrders,
          partsInventory: this.partsInventory
        }));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },
  resetState: function() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('transitpulse_persisted_state_v2');
        localStorage.removeItem('transitpulse_auth_session_v2');
        sessionStorage.removeItem('transitpulse_intro_played_v3');
      }
    } catch (e) {}
    window.location.reload();
  }
};
