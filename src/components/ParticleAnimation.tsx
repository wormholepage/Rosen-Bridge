import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type: 'source' | 'target' | 'pool';
}

export const ParticleAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Particle[] = [];
    const particleCount = 150;

    const poolX = canvas.width / 2;
    const poolY = canvas.height / 2;
    const poolRadius = 60;

    for (let i = 0; i < particleCount; i++) {
      const type = i < particleCount / 3 ? 'source' : i < (2 * particleCount) / 3 ? 'target' : 'pool';

      let x, y;
      if (type === 'source') {
        x = Math.random() * (canvas.width * 0.3);
        y = Math.random() * canvas.height;
      } else if (type === 'target') {
        x = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3);
        y = Math.random() * canvas.height;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * poolRadius;
        x = poolX + Math.cos(angle) * radius;
        y = poolY + Math.sin(angle) * radius;
      }

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: type === 'source' ? '#8b5cf6' : type === 'target' ? '#eab308' : '#06b6d4',
        type,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(poolX, poolY, poolRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.type === 'source') {
          if (particle.x > canvas.width * 0.3 || particle.x < 0 || particle.y < 0 || particle.y > canvas.height) {
            particle.x = Math.random() * (canvas.width * 0.3);
            particle.y = Math.random() * canvas.height;
          }
        } else if (particle.type === 'target') {
          if (particle.x < canvas.width * 0.7 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
            particle.x = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3);
            particle.y = Math.random() * canvas.height;
          }
        } else {
          const dx = poolX - particle.x;
          const dy = poolY - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > poolRadius) {
            particle.x = poolX;
            particle.y = poolY;
          }
        }

        if (Math.random() < 0.01 && particle.type === 'source') {
          const targetX = poolX;
          const targetY = poolY;
          const dx = targetX - particle.x;
          const dy = targetY - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(poolX, poolY);
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        if (Math.random() < 0.01 && particle.type === 'pool') {
          const targetParticles = particles.filter((p) => p.type === 'target');
          if (targetParticles.length > 0) {
            const target = targetParticles[Math.floor(Math.random() * targetParticles.length)];
            ctx.beginPath();
            ctx.moveTo(poolX, poolY);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-lg border border-cyan-500/30 p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        Anonymous Mixing Pool
      </h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm text-gray-400">Source Addresses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-sm text-gray-400">Mixing Pool</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm text-gray-400">Target Addresses</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-[400px] rounded-lg bg-black/50"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};