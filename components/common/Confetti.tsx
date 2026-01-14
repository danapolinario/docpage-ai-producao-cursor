
import React, { useEffect, useRef } from 'react';

interface Props {
  className?: string;
}

export const Confetti: React.FC<Props> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || !parent) return;

    // Function to resize canvas to match parent
    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    // Initial resize
    resizeCanvas();
    
    // Resize on window resize
    window.addEventListener('resize', resizeCanvas);

    const pieces: any[] = [];
    const numberOfPieces = 100; // Adjusted count for section based
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < numberOfPieces; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: canvas.height + (Math.random() * 100), // Start slightly below bottom
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        speed: Math.random() * 4 + 2, // Slightly slower rise for better effect
        opacity: 1,
        oscillationSpeed: Math.random() * 0.05 + 0.02,
        oscillationDistance: Math.random() * 40 + 20,
        oscillationOffset: Math.random() * Math.PI * 2
      });
    }

    let animationId: number;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentTime = Date.now();

      // Check if we still have visible pieces
      let isAnimating = false;

      pieces.forEach((p) => {
        if (p.opacity <= 0) return;
        isAnimating = true;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.save();
        
        // Horizontal oscillation
        const xOffset = Math.sin(currentTime * 0.002 + p.oscillationOffset) * 1;
        
        ctx.translate(p.x + xOffset, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.y -= p.speed; // Move Upwards
        p.rotation += 2;
        
        // Accelerated Fade out
        // Starts fading sooner and faster
        if (p.y < canvas.height * 0.75) {
            p.opacity -= 0.03; // Increased decay rate
        }
        
        // Hard clamp
        if (p.opacity < 0) p.opacity = 0;
      });

      if (isAnimating) {
        animationId = requestAnimationFrame(update);
      }
    };

    update();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={className || "absolute inset-0 pointer-events-none z-[0]"}
    />
  );
};
