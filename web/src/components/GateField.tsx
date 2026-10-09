import { useEffect, useRef } from "react";

const TEAL = "#0096aa";
const ORANGE = "#ff8c50";

export function GateField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const maybeCanvas = ref.current;
    if (!maybeCanvas) return;
    const maybeCtx = maybeCanvas.getContext("2d");
    if (!maybeCtx) return;
    // Non-null typed bindings: narrowing does not carry into the hoisted functions below.
    const canvas: HTMLCanvasElement = maybeCanvas;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    type Node = { x: number; y: number; vx: number; vy: number; c: string; r: number };
    let nodes: Node[] = [];

    function size() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 17000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        c: Math.random() < 0.8 ? TEAL : ORANGE,
        r: Math.random() * 1.5 + 0.8,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 135 * 135) {
            const o = (1 - Math.sqrt(d2) / 135) * 0.1;
            ctx.strokeStyle = `rgba(0,150,170,${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 0.42;
      for (const n of nodes) {
        ctx.fillStyle = n.c;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    function start() {
      size();
      if (reduced) draw();
      else raf = requestAnimationFrame(step);
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      start();
    };

    start();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="gate-field" aria-hidden="true" />;
}
