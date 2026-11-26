// TransitPulse - Intercity Route Optimization & Canvas Map Engine
class RouteEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!canvasId || !this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Core Waypoints & Corridors (Intercity Logistics Network)
    this.nodes = [
      { id: 'DEL', name: 'Delhi Central Hub', x: 200, y: 80, hub: true },
      { id: 'JAI', name: 'Jaipur Depot', x: 150, y: 160, hub: false },
      { id: 'AMD', name: 'Ahmedabad Terminal', x: 130, y: 260, hub: true },
      { id: 'BOM', name: 'Mumbai Super Hub', x: 150, y: 350, hub: true },
      { id: 'PUN', name: 'Pune Regional Depot', x: 190, y: 370, hub: false },
      { id: 'HYD', name: 'Hyderabad Central', x: 310, y: 290, hub: true },
      { id: 'BLR', name: 'Bangalore Tech Corridor', x: 280, y: 380, hub: true },
      { id: 'MAA', name: 'Chennai Port Terminal', x: 360, y: 370, hub: true },
      { id: 'KOL', name: 'Kolkata East Depot', x: 440, y: 190, hub: true },
      { id: 'NAG', name: 'Nagpur Central Transit', x: 280, y: 210, hub: false }
    ];

    this.edges = [
      { from: 'DEL', to: 'JAI', distance: 280, toll: '₹420', hazard: 'None', quality: 'Highway A+' },
      { from: 'JAI', to: 'AMD', distance: 650, toll: '₹890', hazard: 'Crosswinds', quality: 'Expressway' },
      { from: 'AMD', to: 'BOM', distance: 530, toll: '₹750', hazard: 'High Traffic', quality: 'National Hwy' },
      { from: 'BOM', to: 'PUN', distance: 150, toll: '₹320', hazard: 'Ghat Elevation', quality: 'Expressway' },
      { from: 'PUN', to: 'HYD', distance: 560, toll: '₹680', hazard: 'None', quality: 'Highway' },
      { from: 'HYD', to: 'BLR', distance: 570, toll: '₹710', hazard: 'None', quality: 'National Hwy' },
      { from: 'BLR', to: 'MAA', distance: 345, toll: '₹460', hazard: 'Monsoon Detour', quality: 'Highway A+' },
      { from: 'DEL', to: 'NAG', distance: 1080, toll: '₹1400', hazard: 'None', quality: 'National Corridor' },
      { from: 'NAG', to: 'HYD', distance: 500, toll: '₹550', hazard: 'None', quality: 'Expressway' },
      { from: 'NAG', to: 'KOL', distance: 980, toll: '₹1150', hazard: 'Road Work', quality: 'Highway' }
    ];

    // Simulated Active Vehicles on Corridors
    this.vehicles = [
      { id: 'TP-1081', from: 'DEL', to: 'JAI', progress: 0.65, speed: 78, type: 'Heavy EV Hauler', status: 'Optimal' },
      { id: 'TP-2044', from: 'JAI', to: 'AMD', progress: 0.32, speed: 82, type: 'Intercity Bus (Euro VI)', status: 'Optimal' },
      { id: 'TP-3092', from: 'AMD', to: 'BOM', progress: 0.88, speed: 64, type: 'Refrigerated Express', status: 'Heavy Traffic' },
      { id: 'TP-4115', from: 'BOM', to: 'PUN', progress: 0.45, speed: 52, type: 'Multi-Axle Cargo', status: 'Ghat Climb' },
      { id: 'TP-5028', from: 'HYD', to: 'BLR', progress: 0.72, speed: 86, type: 'Intercity Sleeper Bus', status: 'Optimal' },
      { id: 'TP-6302', from: 'BLR', to: 'MAA', progress: 0.15, speed: 74, type: 'Container Carrier', status: 'Detour Re-routed' }
    ];

    this.selectedRoute = 'DEL-BOM';
    this.initCanvas();
    this.startAnimationLoop();
  }

  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  startAnimationLoop() {
    const loop = () => {
      this.updateSimulation();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateSimulation() {
    this.vehicles.forEach(v => {
      v.progress += 0.0012;
      if (v.progress > 1) {
        v.progress = 0;
        // Swap direction
        const temp = v.from;
        v.from = v.to;
        v.to = temp;
      }
    });
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // Coordinate Normalizer
    const scaleX = (x) => (x / 520) * (w - 80) + 40;
    const scaleY = (y) => (y / 420) * (h - 60) + 30;

    // Draw Map Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Corridors (Edges)
    this.edges.forEach(edge => {
      const nodeA = this.nodes.find(n => n.id === edge.from);
      const nodeB = this.nodes.find(n => n.id === edge.to);
      if (!nodeA || !nodeB) return;

      const ax = scaleX(nodeA.x);
      const ay = scaleY(nodeA.y);
      const bx = scaleX(nodeB.x);
      const by = scaleY(nodeB.y);

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);

      if (edge.hazard !== 'None') {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Transit Vehicles with Animated Glow
    this.vehicles.forEach(v => {
      const nodeA = this.nodes.find(n => n.id === v.from);
      const nodeB = this.nodes.find(n => n.id === v.to);
      if (!nodeA || !nodeB) return;

      const ax = scaleX(nodeA.x);
      const ay = scaleY(nodeA.y);
      const bx = scaleX(nodeB.x);
      const by = scaleY(nodeB.y);

      const vx = ax + (bx - ax) * v.progress;
      const vy = ay + (by - ay) * v.progress;

      // Glow Aura
      const gradient = ctx.createRadialGradient(vx, vy, 2, vx, vy, 12);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(vx, vy, 12, 0, Math.PI * 2);
      ctx.fill();

      // Vehicle Core Dot
      ctx.fillStyle = v.status === 'Optimal' ? '#06b6d4' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Vehicle Tag
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${v.id} (${v.speed} km/h)`, vx + 8, vy + 3);
    });

    // Draw Hub Nodes
    this.nodes.forEach(node => {
      const nx = scaleX(node.x);
      const ny = scaleY(node.y);

      // Outer Ring
      ctx.beginPath();
      ctx.arc(nx, ny, node.hub ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = node.hub ? '#1e293b' : '#0f172a';
      ctx.fill();
      ctx.strokeStyle = node.hub ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center Node Dot
      ctx.beginPath();
      ctx.arc(nx, ny, node.hub ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = node.hub ? '#38bdf8' : '#94a3b8';
      ctx.fill();

      // Node Name Label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(node.name, nx + 10, ny + 3);
    });
  }

  calculateOptimization(origin, destination) {
    // Dijkstra / Multi-criteria routing mock
    const distance = 1460;
    const standardDuration = '26 hrs 15 mins';
    const optimizedDuration = '22 hrs 40 mins (-3h 35m)';
    const fuelSavings = '148 Liters (12.4% reduction)';
    const tolls = '₹2,060 (FastTag automated billing)';
    const carbonOffset = '385 kg CO2 avoided';

    return {
      route: `${origin} ➔ Jaipur Express Bypass ➔ Ahmedabad ➔ ${destination}`,
      distance: `${distance} km`,
      standardDuration,
      optimizedDuration,
      fuelSavings,
      tolls,
      carbonOffset,
      activeHazards: 'Weather advisory active: Wet surface between Surat-Vapi. Speed governed at 70 km/h.'
    };
  }
}

window.RouteEngine = RouteEngine;
