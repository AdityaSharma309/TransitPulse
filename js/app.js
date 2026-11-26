// TransitPulse - Master Application Coordinator & Role-Based Access Controller

class TransitPulseApp {
  constructor() {
    this.currentRole = 'manager'; // 'manager' | 'mechanic' | 'driver' | null
    this.currentView = 'terminal'; // 'terminal' | 'fleet' | 'garage' | 'routes' | 'profile'
    this.selectedBus = null;
    this.activeFleetFilter = 'all';

    this.maintenanceHub = new MaintenanceHub();
    this.terminal = null;
    this.routeEngine = null;
    this.architectureModal = null;
    this.introAnimation = null;

    this.restoreSession();
    this.init();
  }

  restoreSession() {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('transitpulse_auth_session_v2') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.loggedOut === true) {
          this.currentRole = null;
        } else if (parsed && parsed.role && window.TransitPulseData.getProfile(parsed.role)) {
          this.currentRole = parsed.role;
        }
      }
    } catch (e) {}
  }

  persistSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        if (!this.currentRole) {
          localStorage.setItem('transitpulse_auth_session_v2', JSON.stringify({ loggedOut: true }));
        } else {
          localStorage.setItem('transitpulse_auth_session_v2', JSON.stringify({
            role: this.currentRole,
            authenticatedAt: Date.now()
          }));
        }
      }
    } catch (e) {}
  }

  init() {
    this.architectureModal = new ArchitectureModal();

    this.terminal = new BusTerminal({
      onBusClick: (bus) => this.openBusDossier(bus),
      onOfficeClick: () => this.openOfficeFromTerminal(),
      onGarageClick: () => this.openGarageFromTerminal()
    });

    this.routeEngine = new RouteEngine('routeCanvas');

    this.introAnimation = new IntroAnimation({
      onComplete: () => {
        if (this.routeEngine) {
          setTimeout(() => this.routeEngine.resizeCanvas(), 80);
        }
      }
    });

    this.bindNavigation();
    this.bindAuthControls();
    this.bindBusDossier();
    this.bindFleetOffice();
    this.bindGarageWorkflow();
    this.bindDriverInspection();
    this.bindRouteOptimizerForm();
    this.bindProfileActions();
    this.bindHeaderActions();

    this.selectedBus = this.maintenanceHub.getActiveVehicle();
    this.renderCurrentRoleUI();
    this.renderFleetTable();
    this.renderGarageHealthTable();
    this.renderWorkOrders();
    this.renderPartsInventory();
    this.updateTelemetryReadouts();
  }

  // Role Permission Matrix
  canAccessView(viewName) {
    if (viewName === 'terminal') return true;
    if (!this.currentRole) return false;
    if (this.currentRole === 'manager') return ['terminal', 'fleet', 'garage', 'routes', 'profile'].includes(viewName);
    if (this.currentRole === 'mechanic') return ['terminal', 'garage', 'profile'].includes(viewName);
    if (this.currentRole === 'driver') return ['terminal', 'routes', 'profile'].includes(viewName);
    return false;
  }

  openOfficeFromTerminal() {
    if (!this.currentRole) {
      this.showToast('Sign in as Fleet Manager to access the Manager\'s Office.', 'warning');
      this.openAuthModal();
      return;
    }
    if (!this.canAccessView('fleet')) {
      this.showToast('Access restricted: Manager\'s Office is reserved for Fleet Managers.', 'warning');
      return;
    }
    this.switchView('fleet');
  }

  openGarageFromTerminal() {
    if (!this.currentRole) {
      this.showToast('Sign in as Garage Mechanic or Fleet Manager to enter the Garage.', 'warning');
      this.openAuthModal();
      return;
    }
    if (!this.canAccessView('garage')) {
      this.showToast('Access restricted: Maintenance Garage is reserved for Mechanics and Fleet Managers.', 'warning');
      return;
    }
    this.switchView('garage');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3400);
  }

  // Navigation
  bindNavigation() {
    document.querySelectorAll('.nav-view-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.switchView(view);
      });
    });

    const brandBtn = document.getElementById('brandHomeBtn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => this.switchView('terminal'));
    }

    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  switchView(viewName) {
    if (!this.canAccessView(viewName)) {
      if (!this.currentRole) {
        this.showToast('Please sign in to access this workspace.', 'warning');
        this.openAuthModal();
      } else {
        this.showToast(`Your current role cannot access the ${viewName} workspace.`, 'warning');
      }
      return;
    }

    this.currentView = viewName;

    document.querySelectorAll('.nav-view-btn[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    const views = {
      terminal: document.getElementById('viewTerminalStage'),
      fleet: document.getElementById('viewFleetOffice'),
      garage: document.getElementById('viewGarageWorkspace'),
      routes: document.getElementById('viewCorridorRoutes'),
      profile: document.getElementById('viewProfile')
    };

    Object.entries(views).forEach(([key, el]) => {
      if (el) {
        el.style.display = (key === viewName) ? '' : 'none';
      }
    });

    if (viewName === 'routes' && this.routeEngine) {
      setTimeout(() => this.routeEngine.resizeCanvas(), 40);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Auth & Role Switching
  bindAuthControls() {
    const openAuthBtn = document.getElementById('openAuthModalBtn');
    if (openAuthBtn) openAuthBtn.addEventListener('click', () => this.openAuthModal());

    const bannerSignInBtn = document.getElementById('bannerSignInBtn');
    if (bannerSignInBtn) bannerSignInBtn.addEventListener('click', () => this.openAuthModal());

    const closeAuthBtn = document.getElementById('closeAuthModalBtn');
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => this.closeAuthModal());

    const authOverlay = document.getElementById('authModalOverlay');
    if (authOverlay) {
      authOverlay.addEventListener('click', (e) => {
        if (e.target === authOverlay) this.closeAuthModal();
      });
    }

    // Demo Role Quick-Sign-In (never exposes passwords in DOM)
    document.querySelectorAll('.btn-role-signin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetRole = e.currentTarget.getAttribute('data-target-role');
        this.loginAsRole(targetRole);
        this.closeAuthModal();
      });
    });

    // Standard Email + Password Form
    const authForm = document.getElementById('authLoginForm');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmailInput').value.trim();
        const pass = document.getElementById('authPassInput').value.trim();
        const result = window.TransitPulseData.authenticate(email, pass);

        if (result) {
          this.loginAsRole(result.role);
          this.closeAuthModal();
          authForm.reset();
        } else {
          this.showToast('Invalid email or password.', 'warning');
        }
      });
    }
  }

  openAuthModal() {
    const modal = document.getElementById('authModalOverlay');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  closeAuthModal() {
    const modal = document.getElementById('authModalOverlay');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  loginAsRole(role) {
    const profile = window.TransitPulseData.getProfile(role);
    if (!profile) return;

    this.currentRole = role;
    this.persistSession();
    this.renderCurrentRoleUI();
    this.renderFleetTable(this.getCurrentSearchQuery(), this.activeFleetFilter);
    this.renderGarageHealthTable();
    this.renderWorkOrders();
    this.renderPartsInventory();

    this.showToast(`Signed in as ${profile.name} (${profile.roleTag})`, 'info');

    if (role === 'driver') {
      this.switchView('profile');
    } else if (role === 'mechanic') {
      this.switchView('garage');
    } else {
      this.switchView('terminal');
    }
  }

  logout() {
    this.currentRole = null;
    this.persistSession();
    this.switchView('terminal');
    this.renderCurrentRoleUI();
    this.showToast('Signed out of TransitPulse.', 'info');
  }

  renderCurrentRoleUI() {
    const profile = this.currentRole ? window.TransitPulseData.getProfile(this.currentRole) : null;

    // Nav visibility
    document.querySelectorAll('.nav-view-btn[data-view]').forEach(btn => {
      const view = btn.getAttribute('data-view');
      btn.hidden = !this.canAccessView(view);
    });

    const logoutBtn = document.getElementById('navLogoutBtn');
    const signInBtn = document.getElementById('openAuthModalBtn');
    const userChip = document.getElementById('activeUserChip');
    const loggedOutBanner = document.getElementById('loggedOutBanner');

    if (!profile) {
      if (logoutBtn) logoutBtn.hidden = true;
      if (signInBtn) signInBtn.hidden = false;
      if (userChip) userChip.innerHTML = 'Guest · <strong>Signed Out</strong>';
      if (loggedOutBanner) loggedOutBanner.style.display = 'flex';
      return;
    }

    if (logoutBtn) logoutBtn.hidden = false;
    if (signInBtn) signInBtn.hidden = true;
    if (loggedOutBanner) loggedOutBanner.style.display = 'none';
    if (userChip) {
      userChip.innerHTML = `<strong>${profile.name}</strong> · ${profile.roleTag}`;
    }

    // Update Profile View
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt('profileRoleBadge', profile.roleTag);
    setTxt('profileName', profile.name);
    setTxt('profileTitle', profile.title);
    setTxt('profileEmail', profile.email);
    setTxt('profileScope', profile.scope);

    // Driver vs Non-Driver Profile Panels
    const driverPanel = document.getElementById('driverCockpitPanel');
    const nonDriverPanel = document.getElementById('nonDriverProfileNote');
    const driverRouteBanner = document.getElementById('driverAssignedRouteBanner');

    if (this.currentRole === 'driver') {
      const assignedBus = this.maintenanceHub.vehicles.find(v => v.id === (profile.assignedVehicleId || 'TP-1081'));
      if (driverPanel) driverPanel.style.display = '';
      if (nonDriverPanel) nonDriverPanel.style.display = 'none';
      if (assignedBus) {
        setTxt('driverAssignedSummary', `${assignedBus.id} (${assignedBus.regNumber}) · ${assignedBus.route.origin} → ${assignedBus.route.destination}`);
        const tripPill = document.getElementById('driverTripStatusPill');
        if (tripPill) {
          const op = this.terminal.getOperationalBadge(assignedBus.status);
          tripPill.className = `op-pill ${op.className}`;
          tripPill.textContent = `${op.label} · ${assignedBus.driver.preTripSigned ? 'Pre-Trip Cleared' : 'Pre-Trip Pending'}`;
        }
        if (driverRouteBanner) {
          driverRouteBanner.style.display = 'block';
          driverRouteBanner.innerHTML = `<strong>Assigned Trip (${assignedBus.id}):</strong> ${assignedBus.route.origin} → ${assignedBus.route.destination} (${assignedBus.route.distance}, Est. ${assignedBus.route.estDuration}) · Departure: ${assignedBus.route.scheduledDeparture}`;
        }
      }
    } else {
      if (driverPanel) driverPanel.style.display = 'none';
      if (nonDriverPanel) nonDriverPanel.style.display = '';
      if (driverRouteBanner) driverRouteBanner.style.display = 'none';
      setTxt('nonDriverScopeText', profile.scope);
      const goWsBtn = document.getElementById('profileGoWorkspaceBtn');
      if (goWsBtn) {
        goWsBtn.textContent = this.currentRole === 'manager' ? 'Open Fleet Office' : 'Open Maintenance Garage';
      }
    }

    // Garage write controls visibility (Mechanics have full repair write access; Managers view & log work orders)
    const inspBox = document.getElementById('recordInspectionBox');
    if (inspBox) {
      inspBox.style.display = this.currentRole === 'mechanic' ? '' : 'none';
    }
    const garageNotice = document.getElementById('garageRoleNotice');
    if (garageNotice) {
      if (this.currentRole === 'manager') {
        garageNotice.style.display = 'flex';
        garageNotice.innerHTML = '<span>Viewing Maintenance Garage as Fleet Manager. You can log new work orders; inspection results, repair closures, and parts reorders require a Garage Mechanic session.</span>';
      } else {
        garageNotice.style.display = 'none';
      }
    }
  }

  bindHeaderActions() {
    const replayBtn = document.getElementById('replayIntroBtn');
    if (replayBtn && this.introAnimation) {
      replayBtn.addEventListener('click', () => this.introAnimation.replay());
    }

    const footerArchBtn = document.getElementById('footerArchBtn');
    if (footerArchBtn && this.architectureModal) {
      footerArchBtn.addEventListener('click', () => this.architectureModal.open());
    }
  }

  // ========================================================================
  // BUS DETAILS SIDE PANEL
  // ========================================================================
  bindBusDossier() {
    const overlay = document.getElementById('busDossierOverlay');
    const closeBtn = document.getElementById('closeDossierBtn');

    const closeDrawer = () => {
      if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
      }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDrawer();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
        closeDrawer();
      }
    });

    const reassignBtn = document.getElementById('dossierReassignDriverBtn');
    if (reassignBtn) {
      reassignBtn.addEventListener('click', () => {
        if (this.currentRole !== 'manager') {
          this.showToast('Only Fleet Managers can reassign drivers.', 'warning');
          return;
        }
        this.openDriverAssignModal(this.selectedBus);
      });
    }

    const editBusBtn = document.getElementById('dossierEditBusBtn');
    if (editBusBtn) {
      editBusBtn.addEventListener('click', () => {
        if (this.currentRole !== 'manager') {
          this.showToast('Only Fleet Managers can update bus details or routes.', 'warning');
          return;
        }
        this.openBusEditModal(this.selectedBus);
      });
    }

    const maintBtn = document.getElementById('dossierScheduleMaintBtn');
    if (maintBtn) {
      maintBtn.addEventListener('click', () => {
        if (!this.canAccessView('garage')) {
          this.showToast('Garage access is restricted to Mechanics and Fleet Managers.', 'warning');
          return;
        }
        closeDrawer();
        this.switchView('garage');
        const woVehSelect = document.getElementById('woVehicleSelect');
        if (woVehSelect && this.selectedBus) woVehSelect.value = this.selectedBus.id;
        const telSelect = document.getElementById('garageVehicleTelemetrySelect');
        if (telSelect && this.selectedBus) telSelect.value = this.selectedBus.id;
        if (this.selectedBus) {
          this.maintenanceHub.setActiveVehicle(this.selectedBus.id);
          this.updateTelemetryReadouts();
        }
      });
    }
  }

  openBusDossier(vehicle) {
    this.selectedBus = vehicle;
    this.maintenanceHub.setActiveVehicle(vehicle.id);
    const overlay = document.getElementById('busDossierOverlay');
    if (!overlay) return;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    const op = this.terminal.getOperationalBadge(vehicle.status);
    const healthLabel = window.TransitPulseData.deriveHealthLabel(vehicle, this.maintenanceHub.workOrders);

    setTxt('dossierCoachTitle', `${vehicle.id} · ${vehicle.model}`);
    setTxt('dossierSubtitle', `${vehicle.regNumber} · ${vehicle.bay} · ${op.label}`);

    setTxt('specBusId', vehicle.id);
    setTxt('specPlate', vehicle.regNumber);
    setTxt('specModel', vehicle.model);
    setTxt('specCapacity', vehicle.seating);
    setTxt('specOpStatus', `${op.label} (${vehicle.subStatus})`);
    setTxt('specHealth', `${healthLabel} (${vehicle.healthScore}%)`);
    setTxt('specLastService', vehicle.lastService);
    setTxt('specNextService', vehicle.nextService);

    // Driver info (contact hidden if guest/logged out)
    setTxt('dossierDriverName', vehicle.driver.name);
    setTxt('dossierDriverId', vehicle.driver.id);
    setTxt('dossierDriverPhone', this.currentRole ? vehicle.driver.phone : 'Sign in to view dispatch contact');
    setTxt('dossierTripStatus', `${op.label} · ${vehicle.driver.preTripSigned ? 'Pre-Trip Cleared' : 'Pre-Trip Pending'}`);
    setTxt('dossierDriverRoute', `${vehicle.route.origin} → ${vehicle.route.destination}`);

    // Compute fastest available planned route via RouteEngine
    const computed = this.routeEngine ? this.routeEngine.calculateOptimization(vehicle.route.origin, vehicle.route.destination) : null;
    setTxt('dossierRouteOrigin', vehicle.route.origin);
    setTxt('dossierRouteDest', vehicle.route.destination);
    setTxt('dossierRouteDistance', computed && !computed.error ? computed.distance : vehicle.route.distance);
    setTxt('dossierRouteDuration', computed && !computed.error ? computed.optimizedDuration : vehicle.route.estDuration);

    const stops = (vehicle.route.stops && vehicle.route.stops.length)
      ? vehicle.route.stops
      : (computed && computed.stops ? computed.stops : []);
    const timeline = document.getElementById('dossierStopsTimeline');
    if (timeline) {
      timeline.innerHTML = stops.map((stop, idx) => {
        const cls = idx === 0 ? 'stop-origin' : (idx === stops.length - 1 ? 'stop-dest' : '');
        return `<li class="${cls}">${stop}</li>`;
      }).join('');
    }

    setTxt('dossierRouteNote', `Calculated from scheduled corridor data (no live traffic feed). Departure: ${vehicle.route.scheduledDeparture}. Advisory: ${vehicle.route.weatherAdvisory}`);

    // Footer button visibility based on role
    const reassignBtn = document.getElementById('dossierReassignDriverBtn');
    const editBtn = document.getElementById('dossierEditBusBtn');
    const garageBtn = document.getElementById('dossierScheduleMaintBtn');
    if (reassignBtn) reassignBtn.style.display = this.currentRole === 'manager' ? '' : 'none';
    if (editBtn) editBtn.style.display = this.currentRole === 'manager' ? '' : 'none';
    if (garageBtn) garageBtn.style.display = (this.currentRole === 'manager' || this.currentRole === 'mechanic') ? '' : 'none';

    this.updateTelemetryReadouts();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  updateTelemetryReadouts() {
    const v = this.maintenanceHub.getActiveVehicle();
    if (!v) return;
    const s = v.sensors;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Dossier summary
    setTxt('dossierCoolant', `${s.coolantTemp} °C`);
    setTxt('dossierOil', `${s.oilPressure} PSI`);
    setTxt('dossierBrake', `${s.brakeWear} %`);
    setTxt('dossierTire', `${s.tirePSI} PSI`);

    // Garage sensors
    this.setSensorDisplay('sensorRpm', `${s.rpm} RPM`, (s.rpm / 2500) * 100);
    this.setSensorDisplay('sensorCoolant', `${s.coolantTemp} °C`, (s.coolantTemp / 120) * 100, s.coolantTemp > 98);
    this.setSensorDisplay('sensorOil', `${s.oilPressure} PSI`, (s.oilPressure / 60) * 100, s.oilPressure < 32);
    this.setSensorDisplay('sensorBrake', `${s.brakeWear} %`, s.brakeWear, s.brakeWear < 25);
    this.setSensorDisplay('sensorBattery', `${s.batterySOH} %`, s.batterySOH, s.batterySOH < 85);
    this.setSensorDisplay('sensorTire', `${s.tirePSI} PSI`, (s.tirePSI / 125) * 100, s.tirePSI < 104);

    const dtcBox = document.getElementById('dtcContainer');
    if (dtcBox) {
      if (!v.dtc || v.dtc.length === 0) {
        dtcBox.innerHTML = '<div class="dtc-clean">No active trouble codes recorded.</div>';
      } else {
        dtcBox.innerHTML = v.dtc.map(d => `
          <div class="dtc-item">
            <strong class="mono-cell">${d.code} · ${d.severity}</strong> — ${d.desc} (${d.component})
          </div>
        `).join('');
      }
    }
  }

  setSensorDisplay(elemId, text, pct, isWarn = false) {
    const textEl = document.getElementById(elemId);
    const barEl = document.getElementById(`${elemId}Bar`);
    if (textEl) textEl.textContent = text;
    if (barEl) {
      barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      barEl.classList.toggle('warning', Boolean(isWarn));
    }
  }

  // ========================================================================
  // MANAGER'S OFFICE (FLEET MANAGEMENT)
  // ========================================================================
  getCurrentSearchQuery() {
    const el = document.getElementById('fleetSearchInput');
    return el ? el.value.trim().toLowerCase() : '';
  }

  bindFleetOffice() {
    const searchInput = document.getElementById('fleetSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderFleetTable(this.getCurrentSearchQuery(), this.activeFleetFilter);
      });
    }

    document.querySelectorAll('.fleet-filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.fleet-filter-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeFleetFilter = e.currentTarget.getAttribute('data-filter') || 'all';
        this.renderFleetTable(this.getCurrentSearchQuery(), this.activeFleetFilter);
      });
    });

    // Driver Assignment Modal
    const driverModal = document.getElementById('driverAssignModal');
    const closeDriverModalBtn = document.getElementById('closeDriverAssignModalBtn');
    if (closeDriverModalBtn && driverModal) {
      closeDriverModalBtn.addEventListener('click', () => {
        driverModal.classList.remove('open');
        driverModal.setAttribute('aria-hidden', 'true');
      });
    }

    const driverForm = document.getElementById('driverAssignForm');
    if (driverForm) {
      driverForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const vId = document.getElementById('assignVehicleIdHidden').value;
        const driverName = document.getElementById('assignDriverNameInput').value.trim();
        const driverId = document.getElementById('assignDriverIdInput').value.trim();
        const driverPhone = document.getElementById('assignDriverPhoneInput').value.trim();

        const res = this.maintenanceHub.assignDriver(vId, driverName, driverId, driverPhone, this.currentRole);
        if (res.error) {
          this.showToast(res.error, 'warning');
          return;
        }
        window.TransitPulseData.saveState();
        driverModal.classList.remove('open');
        this.refreshAllViews();
        if (this.selectedBus && this.selectedBus.id === vId) {
          this.openBusDossier(res.vehicle);
        }
        this.showToast(`Assigned ${driverName} to ${vId}.`, 'info');
      });
    }

    // Bus Details & Route Edit Modal
    const busEditModal = document.getElementById('busEditModal');
    const closeBusEditBtn = document.getElementById('closeBusEditModalBtn');
    if (closeBusEditBtn && busEditModal) {
      closeBusEditBtn.addEventListener('click', () => {
        busEditModal.classList.remove('open');
        busEditModal.setAttribute('aria-hidden', 'true');
      });
    }

    const busEditForm = document.getElementById('busEditForm');
    if (busEditForm) {
      busEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const vId = document.getElementById('editBusIdHidden').value;
        const status = document.getElementById('editBusStatusSelect').value;
        const seating = document.getElementById('editBusSeatingInput').value.trim();
        const origin = document.getElementById('editBusOriginSelect').value;
        const destination = document.getElementById('editBusDestSelect').value;
        const scheduledDeparture = document.getElementById('editBusDepInput').value.trim();
        const nextService = document.getElementById('editBusNextServiceInput').value.trim();

        if (origin === destination) {
          this.showToast('Route origin and destination must be different.', 'warning');
          return;
        }

        const res = this.maintenanceHub.updateVehicleDetails(vId, {
          status,
          seating,
          origin,
          destination,
          scheduledDeparture,
          nextService
        }, this.currentRole);

        if (res.error) {
          this.showToast(res.error, 'warning');
          return;
        }
        window.TransitPulseData.saveState();
        busEditModal.classList.remove('open');
        this.refreshAllViews();
        if (this.selectedBus && this.selectedBus.id === vId) {
          this.openBusDossier(res.vehicle);
        }
        this.showToast(`Updated details and route for ${vId}.`, 'info');
      });
    }
  }

  openDriverAssignModal(vehicle) {
    const modal = document.getElementById('driverAssignModal');
    if (!modal || !vehicle) return;

    document.getElementById('assignVehicleIdHidden').value = vehicle.id;
    document.getElementById('assignVehicleLabel').textContent = `${vehicle.id} (${vehicle.model})`;
    document.getElementById('assignDriverNameInput').value = vehicle.driver.name;
    document.getElementById('assignDriverIdInput').value = vehicle.driver.id;
    document.getElementById('assignDriverPhoneInput').value = vehicle.driver.phone;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  openBusEditModal(vehicle) {
    const modal = document.getElementById('busEditModal');
    if (!modal || !vehicle) return;

    document.getElementById('editBusIdHidden').value = vehicle.id;
    document.getElementById('editBusLabel').textContent = `${vehicle.id} (${vehicle.regNumber})`;
    document.getElementById('editBusStatusSelect').value = vehicle.status;
    document.getElementById('editBusSeatingInput').value = vehicle.seating;
    document.getElementById('editBusOriginSelect').value = vehicle.route.origin;
    document.getElementById('editBusDestSelect').value = vehicle.route.destination;
    document.getElementById('editBusDepInput').value = vehicle.route.scheduledDeparture;
    document.getElementById('editBusNextServiceInput').value = vehicle.nextService;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  renderFleetTable(searchQuery = '', filterStatus = 'all') {
    const tbody = document.getElementById('fleetManagementTableBody');
    if (!tbody) return;

    let filtered = this.maintenanceHub.vehicles;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => {
        if (filterStatus === 'in-transit') return v.status === 'In-Transit';
        if (filterStatus === 'depot') return v.status === 'Depot Ready';
        if (filterStatus === 'maintenance') return v.status === 'Maintenance Due';
        return true;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.id.toLowerCase().includes(searchQuery) ||
        v.regNumber.toLowerCase().includes(searchQuery) ||
        v.model.toLowerCase().includes(searchQuery) ||
        v.driver.name.toLowerCase().includes(searchQuery) ||
        v.route.origin.toLowerCase().includes(searchQuery) ||
        v.route.destination.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No buses match your search or status filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(v => {
      const op = this.terminal.getOperationalBadge(v.status);
      const isManager = this.currentRole === 'manager';

      return `
        <tr>
          <td>
            <div class="mono-cell"><strong>${v.id}</strong></div>
            <div class="sub-cell mono-cell">${v.regNumber} · ${v.bay}</div>
          </td>
          <td>
            <div>${v.model}</div>
            <div class="sub-cell">${v.seating}</div>
          </td>
          <td>
            <div>${v.driver.name}</div>
            <div class="sub-cell mono-cell">${v.driver.id}</div>
          </td>
          <td>
            <div>${v.route.origin.split(' ')[0]} → ${v.route.destination.split(' ')[0]}</div>
            <div class="sub-cell mono-cell">${v.route.distance} · ${v.route.scheduledDeparture}</div>
          </td>
          <td><span class="op-pill ${op.className}"><span class="op-dot"></span>${op.label}</span></td>
          <td>
            <div class="mono-cell">${v.nextService}</div>
            <div class="sub-cell mono-cell">Last: ${v.lastService}</div>
          </td>
          <td>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <button type="button" class="btn-table-action btn-inspect-row" data-id="${v.id}">Details</button>
              ${isManager ? `<button type="button" class="btn-table-action btn-edit-row" data-id="${v.id}">Edit</button>` : ''}
              ${isManager ? `<button type="button" class="btn-table-action btn-assign-row" data-id="${v.id}">Driver</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-inspect-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const v = this.maintenanceHub.vehicles.find(veh => veh.id === e.currentTarget.getAttribute('data-id'));
        if (v) this.openBusDossier(v);
      });
    });

    tbody.querySelectorAll('.btn-edit-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const v = this.maintenanceHub.vehicles.find(veh => veh.id === e.currentTarget.getAttribute('data-id'));
        if (v) this.openBusEditModal(v);
      });
    });

    tbody.querySelectorAll('.btn-assign-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const v = this.maintenanceHub.vehicles.find(veh => veh.id === e.currentTarget.getAttribute('data-id'));
        if (v) this.openDriverAssignModal(v);
      });
    });
  }

  // ========================================================================
  // MAINTENANCE GARAGE WORKSPACE
  // ========================================================================
  bindGarageWorkflow() {
    const createBtn = document.getElementById('createWorkOrderBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        const vId = document.getElementById('woVehicleSelect').value;
        const type = document.getElementById('woTypeInput').value.trim();
        const priority = document.getElementById('woPrioritySelect').value;
        const mechanic = document.getElementById('woMechanicSelect').value;

        if (!type) {
          this.showToast('Enter a maintenance issue or repair scope.', 'warning');
          return;
        }

        const res = this.maintenanceHub.createWorkOrder(vId, type, priority, mechanic, null, null, this.currentRole);
        if (res.error) {
          this.showToast(res.error, 'warning');
          return;
        }
        window.TransitPulseData.saveState();
        document.getElementById('woTypeInput').value = '';
        this.refreshAllViews();
        this.showToast(`Logged work order ${res.id} for ${vId}.`, 'info');
      });
    }

    const garageVehSelect = document.getElementById('garageVehicleTelemetrySelect');
    if (garageVehSelect) {
      garageVehSelect.addEventListener('change', (e) => {
        this.maintenanceHub.setActiveVehicle(e.target.value);
        this.updateTelemetryReadouts();
        this.renderGarageHealthTable();
      });
    }

    const saveInspBtn = document.getElementById('saveInspectionBtn');
    if (saveInspBtn) {
      saveInspBtn.addEventListener('click', () => {
        const vId = document.getElementById('garageVehicleTelemetrySelect').value;
        const outcome = document.getElementById('inspectionResultSelect').value;
        const notes = document.getElementById('inspectionNotesInput').value.trim();

        const res = this.maintenanceHub.recordInspection(vId, outcome, notes, this.currentRole);
        if (res && res.error) {
          this.showToast(res.error, 'warning');
          return;
        }
        window.TransitPulseData.saveState();
        document.getElementById('inspectionNotesInput').value = '';
        this.refreshAllViews();
        this.showToast(`Recorded inspection for ${vId}: ${outcome}.`, 'info');
      });
    }
  }

  getHealthPillClass(label) {
    if (label === 'Healthy') return 'health-healthy';
    if (label === 'Inspection required') return 'health-inspection';
    if (label === 'Maintenance required') return 'health-maintenance';
    return 'health-repair';
  }

  renderGarageHealthTable() {
    const tbody = document.getElementById('garageHealthTableBody');
    if (!tbody) return;
    const activeId = this.maintenanceHub.activeVehicleId;

    tbody.innerHTML = this.maintenanceHub.vehicles.map(v => {
      const healthLabel = window.TransitPulseData.deriveHealthLabel(v, this.maintenanceHub.workOrders);
      const pillCls = this.getHealthPillClass(healthLabel);
      const activeOrder = this.maintenanceHub.workOrders.find(o => o.vehicleId === v.id && !o.status.includes('Closed'));
      const issuesText = v.dtc && v.dtc.length
        ? v.dtc.map(d => `${d.code}: ${d.desc}`).join('; ')
        : (activeOrder ? activeOrder.type : 'None reported');
      const mechName = activeOrder ? activeOrder.mechanic : 'Unassigned';
      const maintStatus = activeOrder ? activeOrder.status : 'Up to date';

      return `
        <tr class="${activeId === v.id ? 'row-selected' : ''}">
          <td class="mono-cell"><strong>${v.id}</strong><div class="sub-cell">${v.model}</div></td>
          <td><span class="op-pill ${pillCls}"><span class="op-dot"></span>${healthLabel}</span></td>
          <td>${maintStatus}</td>
          <td class="mono-cell">${v.lastService}</td>
          <td class="mono-cell">${v.nextService}</td>
          <td>${issuesText}</td>
          <td>${mechName}</td>
          <td><button type="button" class="btn-table-action btn-select-garage-bus" data-id="${v.id}">Inspect</button></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-select-garage-bus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vId = e.currentTarget.getAttribute('data-id');
        this.maintenanceHub.setActiveVehicle(vId);
        const sel = document.getElementById('garageVehicleTelemetrySelect');
        if (sel) sel.value = vId;
        this.updateTelemetryReadouts();
        this.renderGarageHealthTable();
      });
    });
  }

  renderWorkOrders() {
    const tbody = document.getElementById('workOrdersTableBody');
    if (!tbody) return;

    const isMechanic = this.currentRole === 'mechanic';

    tbody.innerHTML = this.maintenanceHub.workOrders.map(wo => {
      const isClosed = wo.status.includes('Closed');
      const statusPill = isClosed ? 'health-healthy' : (wo.status === 'Under repair' ? 'health-repair' : 'health-maintenance');

      return `
        <tr>
          <td>
            <strong class="mono-cell">${wo.id}</strong>
            <div class="sub-cell mono-cell">${wo.rdbmsTxId}</div>
          </td>
          <td class="mono-cell"><strong>${wo.vehicleId}</strong></td>
          <td>
            <div>${wo.type}</div>
            <div class="sub-cell mono-cell">${wo.parts}</div>
          </td>
          <td>${wo.notes || '—'}</td>
          <td>${wo.mechanic}</td>
          <td><span class="op-pill ${wo.priority.includes('Critical') ? 'health-maintenance' : 'health-inspection'}">${wo.priority}</span></td>
          <td>
            <div style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-start;">
              <span class="op-pill ${statusPill}">${wo.status}</span>
              ${isMechanic && !isClosed ? `
                <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                  <button type="button" class="btn-table-action btn-advance-wo" data-wo-id="${wo.id}">Advance</button>
                  <button type="button" class="btn-table-action btn-note-wo" data-wo-id="${wo.id}">Add Note</button>
                </div>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-advance-wo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const woId = e.currentTarget.getAttribute('data-wo-id');
        const updated = this.maintenanceHub.advanceOrderStatus(woId, this.currentRole);
        if (updated && updated.error) {
          this.showToast(updated.error, 'warning');
          return;
        }
        if (updated) {
          window.TransitPulseData.saveState();
          this.refreshAllViews();
          this.showToast(`Work Order ${woId} updated to: ${updated.status}`, 'info');
        }
      });
    });

    tbody.querySelectorAll('.btn-note-wo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const woId = e.currentTarget.getAttribute('data-wo-id');
        const wo = this.maintenanceHub.workOrders.find(o => o.id === woId);
        if (!wo) return;
        const note = window.prompt(`Add repair note for ${woId} (${wo.vehicleId}):`, wo.notes || '');
        if (note !== null) {
          const updated = this.maintenanceHub.updateWorkOrderDetails(woId, { notes: note }, this.currentRole);
          if (updated && updated.error) {
            this.showToast(updated.error, 'warning');
            return;
          }
          window.TransitPulseData.saveState();
          this.renderWorkOrders();
          this.showToast(`Repair notes saved for ${woId}.`, 'info');
        }
      });
    });
  }

  renderPartsInventory() {
    const list = document.getElementById('partsInventoryList');
    if (!list) return;

    const isMechanic = this.currentRole === 'mechanic';

    list.innerHTML = this.maintenanceHub.partsInventory.map(part => `
      <div class="parts-row">
        <div>
          <div style="font-weight:500;">${part.name}</div>
          <div class="sub-cell mono-cell">${part.sku} · ${part.unitCost}</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.65rem; flex-shrink:0;">
          <div style="text-align:right;">
            <div class="mono-cell" style="font-weight:600; color:${part.inStock <= part.threshold ? 'var(--orange-dark)' : 'var(--olive-dark)'};">
              ${part.inStock} in stock
            </div>
            <div class="sub-cell">${part.status}</div>
          </div>
          ${isMechanic ? `<button type="button" class="btn-table-action btn-reorder-part" data-sku="${part.sku}">+10</button>` : ''}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-reorder-part').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sku = e.currentTarget.getAttribute('data-sku');
        const reordered = this.maintenanceHub.reorderPart(sku, 10, this.currentRole);
        if (reordered && reordered.error) {
          this.showToast(reordered.error, 'warning');
          return;
        }
        if (reordered) {
          window.TransitPulseData.saveState();
          this.renderPartsInventory();
          this.showToast(`Added +10 stock for ${reordered.sku}.`, 'info');
        }
      });
    });
  }

  // ========================================================================
  // DRIVER PRE-TRIP AUDIT & PROFILE ACTIONS
  // ========================================================================
  bindDriverInspection() {
    const submitBtn = document.getElementById('submitInspectionBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const checks = [
          document.getElementById('checkBrakes').checked,
          document.getElementById('checkTires').checked,
          document.getElementById('checkFluids').checked,
          document.getElementById('checkLights').checked,
          document.getElementById('checkEmergency').checked
        ];
        const allPassed = checks.every(Boolean);
        const profile = window.TransitPulseData.getProfile(this.currentRole);
        const targetId = (profile && profile.assignedVehicleId) ? profile.assignedVehicleId : 'TP-1081';

        const res = this.maintenanceHub.submitPreTripInspection(targetId, allPassed, this.currentRole);
        if (res.error) {
          this.showToast(res.error, 'warning');
          return;
        }
        window.TransitPulseData.saveState();
        this.refreshAllViews();

        const hashEl = document.getElementById('inspectionAuditHashDisplay');
        if (res.ok) {
          const auditRef = 'audit-' + Math.random().toString(36).substring(2, 10);
          if (hashEl) hashEl.textContent = `Local Sign-Off Reference: ${auditRef} (Conceptual Azure Blob Storage target)`;
          this.showToast(`Pre-trip audit signed for ${targetId}.`, 'info');
        } else {
          if (hashEl) hashEl.textContent = 'Flagged incomplete — forwarded to Garage register.';
          this.showToast('Pre-trip audit flagged for Garage inspection.', 'warning');
        }
      });
    }

    const sosBtn = document.getElementById('driverSosBeaconBtn');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        this.showToast('Emergency dispatch alert logged for TP-1081.', 'warning');
      });
    }
  }

  bindProfileActions() {
    const switchBtn = document.getElementById('profileSwitchRoleBtn');
    if (switchBtn) switchBtn.addEventListener('click', () => this.openAuthModal());

    const logoutBtn = document.getElementById('profileLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

    const resetBtn = document.getElementById('resetDemoDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.TransitPulseData.resetState();
      });
    }

    const goTermBtn = document.getElementById('profileGoTerminalBtn');
    if (goTermBtn) goTermBtn.addEventListener('click', () => this.switchView('terminal'));

    const goWsBtn = document.getElementById('profileGoWorkspaceBtn');
    if (goWsBtn) {
      goWsBtn.addEventListener('click', () => {
        this.switchView(this.currentRole === 'manager' ? 'fleet' : 'garage');
      });
    }
  }

  // ========================================================================
  // CORRIDOR ROUTE PLANNER
  // ========================================================================
  bindRouteOptimizerForm() {
    const btn = document.getElementById('optimizeRouteBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const origin = document.getElementById('originSelect').value;
      const destination = document.getElementById('destinationSelect').value;
      const result = this.routeEngine.calculateOptimization(origin, destination);

      if (result.error) {
        this.showToast(result.error, 'warning');
        return;
      }

      const resContainer = document.getElementById('routeResultContainer');
      if (resContainer) {
        resContainer.innerHTML = `
          <div class="route-summary-sheet">
            <div style="font-weight:600; font-size:0.95rem;">
              Planned Corridor: ${result.route}
            </div>
            <div class="route-metrics-row">
              <div class="route-metric-item"><span>Total Distance</span><strong>${result.distance}</strong></div>
              <div class="route-metric-item"><span>Estimated Travel Time</span><strong>${result.optimizedDuration}</strong></div>
              <div class="route-metric-item"><span>Toll Estimate</span><strong>${result.tolls}</strong></div>
              <div class="route-metric-item"><span>Projected Fuel Savings</span><strong>${result.fuelSavings}</strong></div>
            </div>
            <div class="sub-cell"><strong>Advisories:</strong> ${result.activeHazards}</div>
            <div class="sub-cell mono-cell">${result.dataSourceNote}</div>
          </div>
        `;
      }
      this.showToast(`Calculated fastest planned path (${result.distance}, ${result.optimizedDuration}).`, 'info');
    });
  }

  refreshAllViews() {
    this.terminal.renderBays();
    this.terminal.renderDepartureBoard();
    this.renderFleetTable(this.getCurrentSearchQuery(), this.activeFleetFilter);
    this.renderGarageHealthTable();
    this.renderWorkOrders();
    this.renderPartsInventory();
    this.renderCurrentRoleUI();
    this.updateTelemetryReadouts();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new TransitPulseApp();
});
