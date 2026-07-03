/* =====================================================================
   ANIMATED CIRCUIT BACKGROUND
   Draws PCB-style traces (orthogonal lines + node dots) and animates
   small glowing "current" pulses travelling along each trace.
   Pure canvas, no dependencies, resizes with the window.
   ===================================================================== */

(function () {
  const canvas = document.getElementById('bgCircuit');
  const ctx = canvas.getContext('2d');

  let width, height;
  let traces = [];   // array of { points: [{x,y}, ...], length }
  let pulses = [];   // array of { traceIndex, progress, speed }

  const TRACE_COLOR = 'rgba(59, 130, 246, 0.35)';
  const NODE_COLOR = 'rgba(34, 211, 238, 0.55)';
  const PULSE_COLOR = '#22d3ee';

  /* ------------------------------------------------------------
     Resize canvas to fill the viewport and rebuild the circuit
     ------------------------------------------------------------ */
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateCircuit();
  }

  /* ------------------------------------------------------------
     Generate a set of random orthogonal PCB-style traces
     ------------------------------------------------------------ */
  function generateCircuit() {
    traces = [];
    const cell = Math.max(90, Math.min(width, height) / 8);
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const traceCount = Math.min(26, Math.floor((cols * rows) / 3));

    for (let i = 0; i < traceCount; i++) {
      const startCol = Math.floor(Math.random() * cols);
      const startRow = Math.floor(Math.random() * rows);
      let x = startCol * cell;
      let y = startRow * cell;

      const points = [{ x, y }];
      const segments = 2 + Math.floor(Math.random() * 3); // 2-4 bends

      for (let s = 0; s < segments; s++) {
        const horizontal = Math.random() > 0.5;
        const dist = cell * (1 + Math.floor(Math.random() * 2));
        if (horizontal) {
          x += Math.random() > 0.5 ? dist : -dist;
        } else {
          y += Math.random() > 0.5 ? dist : -dist;
        }
        x = Math.max(0, Math.min(width, x));
        y = Math.max(0, Math.min(height, y));
        points.push({ x, y });
      }

      // total length of the polyline, used to place pulses smoothly
      let length = 0;
      for (let p = 1; p < points.length; p++) {
        length += dist2(points[p - 1], points[p]);
      }

      traces.push({ points, length });
    }

    // Give every trace one pulse travelling at its own random speed
    pulses = traces.map((t, idx) => ({
      traceIndex: idx,
      progress: Math.random(),
      speed: 0.0015 + Math.random() * 0.0025
    }));
  }

  function dist2(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  /* ------------------------------------------------------------
     Find the (x, y) position at a given progress [0..1] along a
     multi-segment polyline trace
     ------------------------------------------------------------ */
  function pointAtProgress(trace, progress) {
    const targetDist = trace.length * progress;
    let covered = 0;

    for (let i = 1; i < trace.points.length; i++) {
      const a = trace.points[i - 1];
      const b = trace.points[i];
      const segLen = dist2(a, b);

      if (covered + segLen >= targetDist) {
        const segProgress = segLen === 0 ? 0 : (targetDist - covered) / segLen;
        return {
          x: a.x + (b.x - a.x) * segProgress,
          y: a.y + (b.y - a.y) * segProgress
        };
      }
      covered += segLen;
    }
    return trace.points[trace.points.length - 1];
  }

  /* ------------------------------------------------------------
     Draw one frame: static traces + nodes, then animated pulses
     ------------------------------------------------------------ */
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw traces
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = TRACE_COLOR;
    traces.forEach(trace => {
      ctx.beginPath();
      trace.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Draw small node circles at each bend/endpoint
      trace.points.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = NODE_COLOR;
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw glowing pulses travelling along the traces
    pulses.forEach(pulse => {
      const trace = traces[pulse.traceIndex];
      if (!trace) return;

      const pos = pointAtProgress(trace, pulse.progress);

      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 8);
      gradient.addColorStop(0, PULSE_COLOR);
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = PULSE_COLOR;
      ctx.arc(pos.x, pos.y, 2.4, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReducedMotion) {
        pulse.progress += pulse.speed;
        if (pulse.progress > 1) pulse.progress = 0;
      }
    });

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    }
  }

  /* ------------------------------------------------------------
     Respect users who prefer reduced motion — draw a static frame
     ------------------------------------------------------------ */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();