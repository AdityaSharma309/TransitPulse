// TransitPulse - Architectural Bus Terminal Stand Controller
// Renders the flat architectural bus stand: Parking Bays (01-06), Manager's Office,
// Maintenance Garage, and the compact Terminal Schedule Board.

class BusTerminal {
  constructor(options = {}) {
    this.vehicles = window.TransitPulseData ? window.TransitPulseData.vehicles : [];
    this.onBusClick = options.onBusClick || (() => {});
    this.onOfficeClick = options.onOfficeClick || (() => {});
    this.onGarageClick = options.onGarageClick || (() => {});
    this.activeBusId = null;
    this.clockInterval = null;
    this.boardFilter = 'all';

    this.init();
  }

  init() {
    this.renderBays();
    this.bindInteractiveStructures();
    this.bindBoardFilters();
    this.startTerminalClock();
    this.renderDepartureBoard();
    this.updateStructureSummaries();
  }

  // Flat architectural side-profile SVG bus illustration (strictly warm ivory/charcoal/olive/burnt-orange)
  generateCoachSVG(vehicle) {
    const isMaintenance = vehicle.status === 'Maintenance Due';
    const isAvailable = vehicle.status === 'Depot Ready';
    const isEV = vehicle.powertrain.includes('EV') || vehicle.powertrain.includes('Electric');
    const isTriAxle = vehicle.model.includes('Tri-Axle') || vehicle.model.includes('Multi-Axle');

    const stripeColor = isMaintenance ? '#C66B3D' : (isAvailable ? '#747A52' : '#282923');
    const bodyFill = '#FFFEFA';
    const roofFill = '#ECE8DD';
    const windowFill = '#D8D5CC';
    const lineInk = '#282923';

    return `
      <svg class="coach-svg" viewBox="0 0 320 104" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- Ground baseline -->
        <line x1="6" y1="92" x2="314" y2="92" stroke="#B8B4A8" stroke-width="1.2" />

        <!-- Coach body silhouette -->
        <path d="M 22 80 L 16 80 C 12 80 10 77 10 73 L 10 28 C 10 20 16 16 26 16 L 272 16 C 288 16 300 22 304 34 L 308 54 C 309 62 307 72 301 78 C 298 80 294 80 290 80 L 22 80 Z"
              fill="${bodyFill}" stroke="${lineInk}" stroke-width="1.6" stroke-linejoin="round" />

        <!-- Roofline / HVAC or EV battery pod -->
        <path d="M 48 16 L 54 11 L 230 11 L 238 16 Z" fill="${roofFill}" stroke="${lineInk}" stroke-width="1.2" />
        ${isEV ? `<rect x="86" y="7" width="84" height="4" fill="#747A52" stroke="${lineInk}" stroke-width="1" />` : ''}

        <!-- Livery band -->
        <rect x="11" y="54" width="295" height="6" fill="${stripeColor}" />

        <!-- Passenger windows -->
        <g fill="${windowFill}" stroke="${lineInk}" stroke-width="1">
          <rect x="24" y="24" width="28" height="22" rx="1.5" />
          <rect x="57" y="24" width="32" height="22" rx="1.5" />
          <rect x="94" y="24" width="32" height="22" rx="1.5" />
          <rect x="131" y="24" width="32" height="22" rx="1.5" />
          <rect x="168" y="24" width="32" height="22" rx="1.5" />
          <rect x="205" y="24" width="32" height="22" rx="1.5" />
          <rect x="242" y="24" width="20" height="22" rx="1.5" />
        </g>

        <!-- Swept front windshield & destination sign -->
        <path d="M 267 24 L 296 26 C 300 32 303 40 304 49 L 267 49 Z" fill="${windowFill}" stroke="${lineInk}" stroke-width="1.1" />
        <rect x="272" y="27" width="24" height="7" fill="${lineInk}" />
        <text x="284" y="32.5" font-family="'IBM Plex Mono', monospace" font-size="4.4" font-weight="600" fill="#FFFEFA" text-anchor="middle">${vehicle.route.corridorCode}</text>

        <!-- Front door & luggage bay hairlines -->
        <rect x="24" y="50" width="22" height="30" fill="none" stroke="${lineInk}" stroke-width="1" />
        <rect x="94" y="63" width="44" height="14" fill="none" stroke="#B8B4A8" stroke-width="1" />
        <rect x="144" y="63" width="44" height="14" fill="none" stroke="#B8B4A8" stroke-width="1" />
        <rect x="194" y="63" width="44" height="14" fill="none" stroke="#B8B4A8" stroke-width="1" />

        <!-- Headlight & rear marker -->
        <rect x="301" y="63" width="6" height="5" fill="#FFFEFA" stroke="${lineInk}" stroke-width="1" />
        <rect x="10" y="62" width="3" height="10" fill="#C66B3D" />

        <!-- Wheel wells & tires -->
        <g>
          <circle cx="66" cy="80" r="12" fill="#282923" />
          <circle cx="66" cy="80" r="5.5" fill="#F5F2E9" stroke="#D8D5CC" stroke-width="1" />
          <circle cx="66" cy="80" r="2" fill="#282923" />

          ${isTriAxle ? `
            <circle cx="222" cy="80" r="12" fill="#282923" />
            <circle cx="222" cy="80" r="5.5" fill="#F5F2E9" stroke="#D8D5CC" stroke-width="1" />
            <circle cx="222" cy="80" r="2" fill="#282923" />
          ` : ''}

          <circle cx="252" cy="80" r="12" fill="#282923" />
          <circle cx="252" cy="80" r="5.5" fill="#F5F2E9" stroke="#D8D5CC" stroke-width="1" />
          <circle cx="252" cy="80" r="2" fill="#282923" />
        </g>

        <!-- Bus fleet ID stencil on side panel -->
        <text x="58" y="52" font-family="'IBM Plex Mono', monospace" font-size="5.5" font-weight="600" fill="${lineInk}">${vehicle.id}</text>
      </svg>
    `;
  }

  getOperationalBadge(status) {
    if (status === 'Maintenance Due') {
      return { label: 'Under Maintenance', className: 'status-maintenance' };
    }
    if (status === 'Depot Ready') {
      return { label: 'Available', className: 'status-available' };
    }
    return { label: 'On Trip', className: 'status-trip' };
  }

  renderBays() {
    const baysContainer = document.getElementById('terminalBaysContainer');
    if (!baysContainer) return;

    baysContainer.innerHTML = '';

    this.vehicles.forEach(vehicle => {
      const bayCard = document.createElement('button');
      bayCard.type = 'button';
      bayCard.className = `terminal-bay-slot${this.activeBusId === vehicle.id ? ' selected-bay' : ''}`;
      bayCard.setAttribute('data-vehicle-id', vehicle.id);
      bayCard.setAttribute('aria-label', `${vehicle.bay}: Bus ${vehicle.id}, ${vehicle.regNumber}, Destination ${vehicle.route.destination}, Status ${vehicle.status}`);

      const op = this.getOperationalBadge(vehicle.status);
      const originCity = vehicle.route.origin.split(' ')[0];
      const destCity = vehicle.route.destination.split(' ')[0];

      bayCard.innerHTML = `
        <div class="bay-top-row">
          <span class="bay-code">${vehicle.bay.toUpperCase()}</span>
          <span class="op-pill ${op.className}">
            <span class="op-dot"></span>
            ${op.label}
          </span>
        </div>

        <div class="bay-bus-drawing">
          ${this.generateCoachSVG(vehicle)}
        </div>

        <div class="bay-meta-row">
          <div class="bay-bus-id-group">
            <span class="mono-bus-num">${vehicle.id}</span>
            <span class="mono-reg-num">${vehicle.regNumber}</span>
          </div>
          <div class="bay-dest-group">
            <span class="bay-dest-label">${originCity} → ${destCity}</span>
            <span class="bay-dep-time">${vehicle.route.scheduledDeparture}</span>
          </div>
        </div>
      `;

      bayCard.addEventListener('click', () => {
        this.selectBus(vehicle.id);
      });

      baysContainer.appendChild(bayCard);
    });
  }

  selectBus(busId) {
    this.activeBusId = busId;

    document.querySelectorAll('.terminal-bay-slot').forEach(slot => {
      slot.classList.toggle('selected-bay', slot.getAttribute('data-vehicle-id') === busId);
    });

    const vehicle = this.vehicles.find(v => v.id === busId);
    if (vehicle && this.onBusClick) {
      this.onBusClick(vehicle);
    }
  }

  bindInteractiveStructures() {
    const officeBuilding = document.getElementById('managersOfficeBuilding');
    if (officeBuilding) {
      officeBuilding.addEventListener('click', () => this.onOfficeClick());
    }

    const garageBuilding = document.getElementById('maintenanceGarageBuilding');
    if (garageBuilding) {
      garageBuilding.addEventListener('click', () => this.onGarageClick());
    }
  }

  bindBoardFilters() {
    document.querySelectorAll('.board-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.board-filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.boardFilter = e.currentTarget.getAttribute('data-board-filter') || 'all';
        this.renderDepartureBoard();
      });
    });
  }

  updateStructureSummaries() {
    const availableCount = this.vehicles.filter(v => v.status === 'Depot Ready').length;
    const onTripCount = this.vehicles.filter(v => v.status === 'In-Transit').length;
    const maintCount = this.vehicles.filter(v => v.status === 'Maintenance Due').length;

    const officeSummary = document.getElementById('officeStructureStatus');
    if (officeSummary) {
      officeSummary.textContent = `${this.vehicles.length} Coaches · ${onTripCount} On Trip · ${availableCount} Available`;
    }

    const garageSummary = document.getElementById('garageStructureStatus');
    if (garageSummary) {
      garageSummary.textContent = maintCount > 0
        ? `${maintCount} Under Maintenance`
        : 'All Bays Clear';
    }

    const boardCounts = document.getElementById('boardSummaryCounts');
    if (boardCounts) {
      boardCounts.textContent = `${availableCount} Available · ${onTripCount} On Trip · ${maintCount} Maintenance`;
    }
  }

  startTerminalClock() {
    const clockEl = document.getElementById('terminalClockDisplay');
    const update = () => {
      if (!clockEl) return;
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}:${seconds} IST`;
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }

  renderDepartureBoard() {
    const tbody = document.getElementById('terminalBoardTableBody');
    if (!tbody) return;

    this.updateStructureSummaries();

    let rows = this.vehicles;
    if (this.boardFilter === 'available') {
      rows = rows.filter(v => v.status === 'Depot Ready');
    } else if (this.boardFilter === 'trip') {
      rows = rows.filter(v => v.status === 'In-Transit');
    } else if (this.boardFilter === 'maintenance') {
      rows = rows.filter(v => v.status === 'Maintenance Due');
    }

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-cell">No buses in this category.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows.map(v => {
      const op = this.getOperationalBadge(v.status);
      const originCity = v.route.origin.split(' ')[0];
      const destCity = v.route.destination.split(' ')[0];

      return `
        <tr class="board-row" data-vehicle-id="${v.id}" tabindex="0" role="button" aria-label="View details for ${v.id}">
          <td class="mono-cell">${v.bay.replace('Bay ', '')}</td>
          <td class="mono-cell"><strong>${v.id}</strong></td>
          <td>${originCity} → ${destCity}</td>
          <td class="mono-cell">${v.route.scheduledDeparture}</td>
          <td><span class="op-pill ${op.className}"><span class="op-dot"></span>${op.label}</span></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.board-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const busId = e.currentTarget.getAttribute('data-vehicle-id');
        this.selectBus(busId);
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const busId = e.currentTarget.getAttribute('data-vehicle-id');
          this.selectBus(busId);
        }
      });
    });
  }
}

window.BusTerminal = BusTerminal;
