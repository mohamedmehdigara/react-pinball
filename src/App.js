import React, { useState, useEffect, useRef, useCallback } from 'react';

// Configuration
const WIDTH = 500;
const HEIGHT = 850;
const API_KEY = ""; // Environment provides this

const App = () => {
  // --- STATE ---
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [directive, setDirective] = useState("");
  const [logs, setLogs] = useState(["SYSTEM_READY", "AWAITING_NEURAL_INPUT"]);
  const [realityShift, setRealityShift] = useState({ 
    gravity: 0.4, 
    glitch: 0, 
    color: '#00f2ff',
    speed: 1.0 
  });

  const canvasRef = useRef(null);
  const engine = useRef({
    ball: { x: 478, y: 800, vx: 0, vy: 0, active: false, radius: 10, history: [] },
    bumpers: [
      { x: 250, y: 250, r: 50, energy: 0, id: 'core' },
      { x: 120, y: 400, r: 30, energy: 0, id: 'node_a' },
      { x: 380, y: 400, r: 30, energy: 0, id: 'node_b' }
    ],
    flippers: {
      left: { x: 160, y: 810, angle: 0.5, target: 0.5 },
      right: { x: 340, y: 810, angle: 2.64, target: 2.64 }
    }
  });

  const keys = useRef({});

  // --- NEURAL INTERFACE (The AI Reality Bender) ---
  const manifestReality = async () => {
    if (!directive || isProcessing) return;
    setIsProcessing(true);
    const currentDirective = directive;
    setDirective("");
    
    setLogs(prev => [`TRANSFIGURE: "${currentDirective}"`, ...prev].slice(0, 5));

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `The user wants to change a pinball game's physics/visuals with this prompt: "${currentDirective}". 
          Respond ONLY with a JSON object containing: 
          { "gravity": float (0.1 to 2.0), "glitch": float (0 to 1), "color": hex_string, "speed": float (0.5 to 3.0), "log": short_string_system_message }` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      const config = JSON.parse(data.candidates[0].content.parts[0].text);
      
      setRealityShift(config);
      setLogs(prev => [config.log.toUpperCase(), ...prev].slice(0, 5));
    } catch (err) {
      setLogs(prev => ["NEURAL_LINK_ERROR", ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PHYSICS ENGINE ---
  const update = useCallback(() => {
    const e = engine.current;
    const { gravity, glitch, speed } = realityShift;

    // Flipper movement
    e.flippers.left.target = keys.current['z'] ? -0.6 : 0.5;
    e.flippers.right.target = keys.current['/'] ? 3.7 : 2.64;
    e.flippers.left.angle += (e.flippers.left.target - e.flippers.left.angle) * 0.4 * speed;
    e.flippers.right.angle += (e.flippers.right.target - e.flippers.right.angle) * 0.4 * speed;

    if (e.ball.active) {
      e.ball.vy += gravity * speed;
      e.ball.x += e.ball.vx * speed;
      e.ball.y += e.ball.vy * speed;

      // Walls
      if (e.ball.x < 15 || e.ball.x > WIDTH - 15) e.ball.vx *= -0.8;
      if (e.ball.y < 15) e.ball.vy *= -0.8;

      // Bumpers
      e.bumpers.forEach(b => {
        const dx = e.ball.x - b.x, dy = e.ball.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < b.r + e.ball.radius) {
          const nx = dx/dist, ny = dy/dist;
          e.ball.vx = nx * 12 * speed;
          e.ball.vy = ny * 12 * speed;
          b.energy = 1.0;
          setScore(s => s + 100);
        }
        b.energy *= 0.9;
      });

      // Flippers Collision (Simplified)
      [e.flippers.left, e.flippers.right].forEach((f, i) => {
        const dx = e.ball.x - f.x, dy = e.ball.y - f.y;
        if (Math.sqrt(dx*dx + dy*dy) < 60 && e.ball.y > 780) {
            const power = (keys.current[i === 0 ? 'z' : '/']) ? 15 : 5;
            e.ball.vy = -power * speed;
            e.ball.vx = (i === 0 ? 5 : -5) * speed;
        }
      });

      // Glitch Effect: Random jitter
      if (glitch > 0.5) {
        e.ball.x += (Math.random() - 0.5) * glitch * 10;
        e.ball.y += (Math.random() - 0.5) * glitch * 10;
      }

      // Trail
      e.ball.history.push({x: e.ball.x, y: e.ball.y});
      if (e.ball.history.length > 15) e.ball.history.shift();

      // Out
      if (e.ball.y > HEIGHT) {
        e.ball.active = false;
        e.ball.x = 478; e.ball.y = 800;
        e.ball.vx = 0; e.ball.vy = 0;
      }
    } else if (keys.current[' ']) {
      e.ball.active = true;
      e.ball.vy = -20 * speed;
    }
  }, [realityShift]);

  // --- RENDERER ---
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let frame;
    const render = () => {
      update();
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Grid
      ctx.strokeStyle = '#111122';
      ctx.lineWidth = 1;
      for(let i=0; i<WIDTH; i+=50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke(); }

      // Draw Bumpers
      engine.current.bumpers.forEach(b => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r + (b.energy * 20));
        grad.addColorStop(0, realityShift.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.3 + b.energy;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + (b.energy * 10), 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = realityShift.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke();
      });

      // Draw Ball Trail
      ctx.globalAlpha = 0.5;
      engine.current.ball.history.forEach((h, i) => {
        ctx.fillStyle = realityShift.color;
        ctx.beginPath(); ctx.arc(h.x, h.y, (i/15) * engine.current.ball.radius, 0, Math.PI*2); ctx.fill();
      });

      // Draw Ball
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 15;
      ctx.shadowColor = realityShift.color;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(engine.current.ball.x, engine.current.ball.y, engine.current.ball.radius, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Flippers
      ctx.fillStyle = '#fff';
      [engine.current.flippers.left, engine.current.flippers.right].forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        ctx.beginPath(); ctx.roundRect(0, -5, 80, 10, 5); ctx.fill();
        ctx.restore();
      });

      frame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frame);
  }, [update, realityShift]);

  // Input listeners
  useEffect(() => {
    const down = (e) => keys.current[e.key.toLowerCase()] = true;
    const up = (e) => keys.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="flex h-screen bg-[#020205] text-white font-mono overflow-hidden">
      {/* Neural Command Terminal */}
      <div className="w-96 border-r border-white/10 p-8 flex flex-col justify-between bg-black/40">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">SINGULARITY_OS</h1>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Reality Interface v4.0</p>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Neural Directive</div>
            <textarea 
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
              placeholder="e.g., 'Make it underwater and slow', 'Intense solar flare', 'Vaporwave aesthetics'"
              className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-all resize-none"
            />
            <button 
              onClick={manifestReality}
              disabled={isProcessing}
              className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                isProcessing ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-cyan-400'
              }`}
            >
              {isProcessing ? 'MANIFESTING...' : 'EXECUTE DIRECTIVE'}
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Reality Stream</div>
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="text-[10px] text-zinc-500 border-l border-white/10 pl-2 py-1">
                  <span className="text-cyan-500 mr-2">»</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
           <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
             <span>GRAVITY</span>
             <span>{(realityShift.gravity * 100).toFixed(0)}%</span>
           </div>
           <div className="h-1 bg-white/10 w-full overflow-hidden">
             <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${(realityShift.gravity/2)*100}%` }} />
           </div>
        </div>
      </div>

      {/* The Simulation */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-12">
        <div className="absolute top-12 right-12 text-right">
           <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Accumulated Data</div>
           <div className="text-6xl font-black italic tracking-tighter text-white">{score.toLocaleString()}</div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 rounded-full blur-3xl opacity-20" style={{ backgroundColor: realityShift.color }} />
          <div className="relative border-[1px] border-white/20 rounded-[40px] overflow-hidden shadow-2xl">
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="max-h-[85vh] w-auto" />
          </div>
        </div>

        <div className="mt-8 flex gap-12 text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">
          <span>Z / / : PULSE</span>
          <span>SPACE : INITIALIZE</span>
          <span>{realityShift.log?.toUpperCase() || 'STABLE_ORBIT'}</span>
        </div>
      </div>
    </div>
  );
};

export default App;