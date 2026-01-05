import React, { useEffect, useRef } from 'react';

const NeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particlesArray;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.directionX = (Math.random() * 0.2) - 0.1; // Velocidade MUITO reduzida
        this.directionY = (Math.random() * 0.2) - 0.1;
        this.size = Math.random() * 2;
        this.color = '#00E5FF';
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      // AQUI ESTÁ O SEGREDO: Aumentei o divisor de 15000 para 45000
      // Isso cria 3x menos partículas, mantendo o visual mas salvando a CPU.
      const numberOfParticles = (canvas.width * canvas.height) / 45000; 
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }

    function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          // Otimização: Só checa conexão se estiver razoavelmente perto (pré-filtro simples)
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          
          if (Math.abs(dx) > 150 || Math.abs(dy) > 150) continue; // Pula cálculos distantes

          let distance = (dx * dx) + (dy * dy);
          if (distance < (canvas.width/7) * (canvas.height/7)) {
            opacityValue = 1 - (distance / 20000);
            if (opacityValue > 0) {
                ctx.strokeStyle = 'rgba(0, 229, 255,' + opacityValue * 0.15 + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
          }
        }
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
    }

    window.addEventListener('resize', handleResize);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full -z-10"
      style={{ background: 'radial-gradient(circle at center, #0a0a12 0%, #000000 100%)' }} 
    />
  );
};

export default NeuralBackground;