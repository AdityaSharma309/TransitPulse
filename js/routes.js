// TransitPulse - Planned Corridor Route Engine & Architectural Network Schematic
// Computes shortest available corridor paths from stored terminal & expressway network data.

class RouteEngine {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Intercity Terminal Nodes
    this.nodes = [
      { id: 'DEL', name: 'Delhi Central Hub', x: 195, y: 65, hub: true },
      { id: 'JAI', name: 'Jaipur Depot', x: 145, y: 135, hub: false },
      { id: 'AMD', name: 'Ahmedabad Terminal', x: 110, y: 225, hub: true },
      { id: 'BOM', name: 'Mumbai Super Hub', x: 135, y: 310, hub: true },
      { id: 'PUN', name: 'Pune Regional Depot', x: 185, y: 340, hub: false },
      { id: 'HYD', name: 'Hyderabad Central', x: 295, y: 270, hub: true },
      { id: 'BLR', name: 'Bangalore Tech Corridor', x: 265, y: 365, hub: true },
      { id: 'MAA', name: 'Chennai Port Terminal', x: 360, y: 350, hub: true },
      { id: 'KOL', name: 'Kolkata East Depot', x: 430, y: 175, hub: true },
      { from: null, id: 'NAG', name: 'Nagpur Central Transit', x: 270, y: 190, hub: false }
    ].map(({ from, ...rest }) => rest);

    // Bidirectional Scheduled Highway Corridors (stored network dataset)
    this.edges = [
      { from: 'DEL', to: 'JAI', distance: 280, hours: 4.5, toll: 420, hazard: 'Clear corridor conditions', quality: 'Highway A+' },
      { from: 'JAI', to: 'AMD', distance: 650, hours: 10.75, toll: 890, hazard: 'Crosswinds advisory near Beawar–Udaipur', quality: 'Expressway' },
      { from: 'AMD', to: 'BOM', distance: 530, hours: 8.83, toll: 750, hazard: 'Seasonal rain advisory south of Vapi', quality: 'National Hwy' },
      { from: 'BOM', to: 'PUN', distance: 150, hours: 3.25, toll: 320, hazard: 'Western Ghats elevation climb', quality: 'Expressway' },
      { from: 'PUN', to: 'HYD', distance: 560, hours: 9.0, toll: 680, hazard: 'Standard grade corridor', quality: 'Highway' },
      { from: 'HYD', to: 'BLR', distance: 570, hours: 8.67, toll: 710, hazard: 'High ambient temp advisory (34°C)', quality: 'National Corridor' },
      { from: 'BLR', to: 'MAA', distance: 345, hours: 5.5, toll: 460, hazard: 'Eastern Ghats descent', quality: 'Highway A+' },
      { from: 'DEL', to: 'NAG', distance: 1080, hours: 16.5, toll: 1400, hazard: 'Standard corridor conditions', quality: 'Golden Quadrilateral' },
      { from: 'NAG', to: 'HYD', distance: 500, hours: 7.75, toll: 550, hazard: 'Standard corridor conditions', quality: 'Expressway' },
      { from: 'NAG', to: 'KOL', distance: 980, hours: 15.25, toll: 1150, hazard: 'Scheduled road maintenance near Raipur', quality: 'Highway' }
    ];

    // Simulated coach positions along scheduled corridors
    this.vehicles = [
      { id: 'TP-1081', from: 'DEL', to: 'JAI', progress: 0.65, speed: 78, status: 'Active' },
      { id: 'TP-2044', from: 'JAI', to: 'AMD', progress: 0.32, speed: 80, status: 'Inspection' },
      { id: 'TP-3092', from: 'AMD', to: 'BOM', progress: 0.88, speed: 0, status: 'Garage' },
      { id: 'TP-4115', from: 'BOM', to: 'PUN', progress: 0.45, speed: 0, status: 'Ready' },
      { id: 'TP-5028', from: 'HYD', to: 'BLR', progress: 0.72, speed: 84, status: 'Active' },
      { id: 'TP-6302', from: 'BLR', to: 'MAA', progress: 0.18, speed: 0, status: 'Ready' }
    ];

    this.highlightedPath = [];
    this.animFrameId = null;

    if (this.canvas && this.ctx) {
      this.initCanvas();
      this.startAnimationLoop();
    }
  }

  initCanvas() {
    this.resizeCanvas();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.render();
  }

  startAnimationLoop() {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.render();
      return;
    }

    let lastTime = 0;
    const loop = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const delta = Math.min(timestamp - lastTime, 100);
      lastTime = timestamp;

      this.updateSimulation(delta);
      this.render();
      if (typeof requestAnimationFrame !== 'undefined') {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  updateSimulation(delta = 16) {
    const step = (delta / 16) * 0.00055;
    this.vehicles.forEach(v => {
      if (v.status === 'Active' || v.status === 'Inspection') {
        v.progress += step;
        if (v.progress > 1) {
          v.progress = 0;
          const temp = v.from;
          v.from = v.to;
          v.to = temp;
        }
      }
    });
  }

  setHighlightedPath(nodeIds) {
    this.highlightedPath = Array.isArray(nodeIds) ? nodeIds : [];
    this.render();
  }

  isEdgeHighlighted(fromId, toId) {
    if (this.highlightedPath.length < 2) return false;
    for (let i = 0; i < this.highlightedPath.length - 1; i++) {
      const a = this.highlightedPath[i];
      const b = this.highlightedPath[i + 1];
      if ((a === fromId && b === toId) || (a === toId && b === fromId)) {
        return true;
      }
    }
    return false;
  }

  render() {
    if (!this.ctx || !this.displayWidth) return;
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    // Warm paper background
    ctx.fillStyle = '#FFFEFA';
    ctx.fillRect(0, 0, w, h);

    const scaleX = (x) => (x / 500) * (w - 130) + 45;
    const scaleY = (y) => (y / 410) * (h - 70) + 35;

    // Architectural drafting grid in concrete gray
    ctx.strokeStyle = '#ECE8DD';
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

    // Draw corridor edges
    this.edges.forEach(edge => {
      const nodeA = this.nodes.find(n => n.id === edge.from);
      const nodeB = this.nodes.find(n => n.id === edge.to);
      if (!nodeA || !nodeB) return;

      const ax = scaleX(nodeA.x);
      const ay = scaleY(nodeA.y);
      const bx = scaleX(nodeB.x);
      const by = scaleY(nodeB.y);
      const highlighted = this.isEdgeHighlighted(edge.from, edge.to);

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);

      if (highlighted) {
        ctx.strokeStyle = '#747A52';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([]);
      } else if (edge.hazard.includes('maintenance') || edge.hazard.includes('rain')) {
        ctx.strokeStyle = '#C66B3D';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
      } else {
        ctx.strokeStyle = '#B8B4A8';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance midpoint label
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      ctx.fillStyle = highlighted ? '#4F5437' : '#76756B';
      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.fillText(`${edge.distance}km`, mx + 4, my - 3);
    });

    // Draw active coaches on corridors
    this.vehicles.forEach(v => {
      if (v.status === 'Garage') return;
      const nodeA = this.nodes.find(n => n.id === v.from);
      const nodeB = this.nodes.find(n => n.id === v.to);
      if (!nodeA || !nodeB) return;

      const ax = scaleX(nodeA.x);
      const ay = scaleY(nodeA.y);
      const bx = scaleX(nodeB.x);
      const by = scaleY(nodeB.y);

      const vx = ax + (bx - ax) * v.progress;
      const vy = ay + (by - ay) * v.progress;

      // Crisp rectangular transit marker
      ctx.fillStyle = v.status === 'Inspection' ? '#C66B3D' : '#747A52';
      ctx.strokeStyle = '#282923';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(vx - 5, vy - 5, 10, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#282923';
      ctx.font = '600 9px "IBM Plex Mono", monospace';
      ctx.fillText(v.id, vx + 8, vy - 6);
    });

    // Draw Terminal Nodes
    const leftAlignedNodes = new Set(['JAI', 'AMD', 'BOM', 'BLR']);
    this.nodes.forEach(node => {
      const nx = scaleX(node.x);
      const ny = scaleY(node.y);
      const inPath = this.highlightedPath.includes(node.id);

      ctx.beginPath();
      ctx.arc(nx, ny, node.hub ? 6.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = inPath ? '#747A52' : (node.hub ? '#282923' : '#FFFEFA');
      ctx.fill();
      ctx.strokeStyle = '#282923';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = inPath ? '#4F5437' : '#282923';
      ctx.font = node.hub ? '600 10px Inter, sans-serif' : '500 9.5px Inter, sans-serif';
      const label = `${node.id} · ${node.name.split(' ')[0]}`;
      if (leftAlignedNodes.has(node.id)) {
        ctx.textAlign = 'right';
        ctx.fillText(label, nx - 10, ny + 3.5);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText(label, nx + 10, ny + 3.5);
      }
    });
  }

  resolveNodeCode(nameOrCode) {
    if (!nameOrCode) return null;
    const upper = String(nameOrCode).toUpperCase();
    for (const node of this.nodes) {
      if (upper.includes(node.id) || upper.includes(node.name.toUpperCase()) || upper.includes(node.name.split(' ')[0].toUpperCase())) {
        return node.id;
      }
    }
    if (upper.includes('DELHI')) return 'DEL';
    if (upper.includes('JAIPUR')) return 'JAI';
    if (upper.includes('AHMEDABAD')) return 'AMD';
    if (upper.includes('MUMBAI')) return 'BOM';
    if (upper.includes('PUNE')) return 'PUN';
    if (upper.includes('HYDERABAD')) return 'HYD';
    if (upper.includes('BANGALORE')) return 'BLR';
    if (upper.includes('CHENNAI')) return 'MAA';
    if (upper.includes('KOLKATA')) return 'KOL';
    if (upper.includes('NAGPUR')) return 'NAG';
    return null;
  }

  // Dijkstra shortest-path route optimizer over stored corridor network
  calculateOptimization(origin, destination) {
    const startCode = this.resolveNodeCode(origin);
    const endCode = this.resolveNodeCode(destination);

    if (!startCode || !endCode) {
      return { error: 'Could not resolve origin or destination terminal.' };
    }
    if (startCode === endCode) {
      return { error: 'Origin and destination terminals must be different.' };
    }

    // Build adjacency list
    const adj = {};
    this.nodes.forEach(n => { adj[n.id] = []; });
    this.edges.forEach(e => {
      adj[e.from].push({ to: e.to, edge: e });
      adj[e.to].push({ to: e.from, edge: e });
    });

    // Dijkstra minimizing travel hours (fastest planned route)
    const distHours = {};
    const prev = {};
    const prevEdge = {};
    const unvisited = new Set(this.nodes.map(n => n.id));

    this.nodes.forEach(n => { distHours[n.id] = Infinity; });
    distHours[startCode] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let best = Infinity;
      for (const id of unvisited) {
        if (distHours[id] < best) {
          best = distHours[id];
          current = id;
        }
      }
      if (current === null || current === endCode || best === Infinity) break;
      unvisited.delete(current);

      for (const neighbor of adj[current]) {
        if (!unvisited.has(neighbor.to)) continue;
        const alt = distHours[current] + neighbor.edge.hours;
        if (alt < distHours[neighbor.to]) {
          distHours[neighbor.to] = alt;
          prev[neighbor.to] = current;
          prevEdge[neighbor.to] = neighbor.edge;
        }
      }
    }

    // Reconstruct path
    const pathIds = [];
    const usedEdges = [];
    let curr = endCode;
    while (curr) {
      pathIds.unshift(curr);
      if (prevEdge[curr]) usedEdges.unshift(prevEdge[curr]);
      curr = prev[curr];
    }

    const totalDistance = usedEdges.reduce((sum, e) => sum + e.distance, 0);
    const totalHours = usedEdges.reduce((sum, e) => sum + e.hours, 0);
    const totalToll = usedEdges.reduce((sum, e) => sum + e.toll, 0);
    const hrs = Math.floor(totalHours);
    const mins = Math.round((totalHours - hrs) * 60);

    const stops = pathIds.map(id => {
      const node = this.nodes.find(n => n.id === id);
      return node ? `${node.name} (${node.id})` : id;
    });

    const hazards = [...new Set(usedEdges.map(e => e.hazard).filter(h => h && h !== 'Standard corridor conditions' && h !== 'Clear corridor conditions'))];
    const fuelSavingsLiters = Math.max(8, Math.round(totalDistance * 0.088));

    this.setHighlightedPath(pathIds);

    return {
      corridorCode: `${startCode}-${endCode}`,
      pathIds,
      stops,
      route: stops.join(' → '),
      distance: `${totalDistance} km`,
      optimizedDuration: `${hrs} hrs ${mins} mins`,
      fuelSavings: `~${fuelSavingsLiters} L (Scheduled grade profile)`,
      tolls: `₹${totalToll.toLocaleString('en-IN')} (FastTag)`,
      activeHazards: hazards.length ? hazards.join(' • ') : 'No static corridor advisories recorded.',
      dataSourceNote: 'Planned route calculated from stored corridor network data (no live traffic feed).'
    };
  }
}

window.RouteEngine = RouteEngine;
