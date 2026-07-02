import React, { useEffect, useRef } from 'react';

/**
 * Renders an animated canvas with:
 * 1. A wireframe 3D globe with orbital rings (positioned dynamically)
 * 2. Drifting 3D geometric wireframe shapes (cubes, octahedrons, tetrahedrons)
 * 3. A twinkling starfield particle system
 */
export function Space3DBackground({ globePosition = 'center' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Dimensions
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    // Floating 3D Shapes
    // vertices relative to center
    const cubeVertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
    ];
    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // back face
      [4, 5], [5, 6], [6, 7], [7, 4], // front face
      [0, 4], [1, 5], [2, 6], [3, 7]  // connections
    ];

    const tetraVertices = [
      [0, -1.2, 0],
      [-1, 0.6, -1],
      [1, 0.6, -1],
      [0, 0.6, 1.2]
    ];
    const tetraEdges = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [2, 3], [3, 1]
    ];

    const shapeTemplates = [
      { vertices: cubeVertices, edges: cubeEdges, size: 25, color: '#00E5FF' }, // Cyan Cube
      { vertices: tetraVertices, edges: tetraEdges, size: 28, color: '#7B2FFF' }, // Violet Tetrahedron
    ];

    const floatingShapes = Array.from({ length: 12 }, (_, i) => {
      const template = shapeTemplates[i % shapeTemplates.length];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 200 + 100, // Depth
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        vrx: (Math.random() - 0.5) * 0.015,
        vry: (Math.random() - 0.5) * 0.015,
        vrz: (Math.random() - 0.5) * 0.01,
        ...template
      };
    });

    // Globe parameters
    let globeAngle = 0;
    const globeRadius = 160;

    // Helper functions for 3D rotation
    const rotateX = (x, y, z, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x, y * cos - z * sin, y * sin + z * cos];
    };

    const rotateY = (x, y, z, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos + z * sin, y, -x * sin + z * cos];
    };

    const rotateZ = (x, y, z, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [x * cos - y * sin, x * sin + y * cos, z];
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space base gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 10,
        width / 2, height / 2, Math.max(width, height)
      );
      bgGrad.addColorStop(0, '#040714');
      bgGrad.addColorStop(1, '#020308');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Starfield
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) {
          star.speed = -star.speed;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, star.alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Determine Globe Center Position
      let globeCenterX = width / 2;
      let globeCenterY = height / 2;

      if (globePosition === 'top-right') {
        globeCenterX = width - 260;
        globeCenterY = 220;
      } else if (globePosition === 'right-side') {
        globeCenterX = width * 0.75;
        globeCenterY = height / 2;
      }

      // Draw Globe Aura Glow
      const glowGrad = ctx.createRadialGradient(
        globeCenterX, globeCenterY, 0,
        globeCenterX, globeCenterY, globeRadius * 1.5
      );
      glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
      glowGrad.addColorStop(0.5, 'rgba(123, 47, 255, 0.05)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(globeCenterX, globeCenterY, globeRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw Wireframe Globe (Latitude & Longitude lines)
      globeAngle += 0.003;
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 1;

      // Draw Latitudes
      const lats = 9;
      for (let i = 1; i < lats; i++) {
        const theta = (i * Math.PI) / lats;
        const r = globeRadius * Math.sin(theta);
        const y = globeRadius * Math.cos(theta);

        ctx.beginPath();
        // Project circle onto horizontal plane, with vertical tilt
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          let px = r * Math.cos(a);
          let pz = r * Math.sin(a);
          let py = y;

          // Rotate globe around Y axis
          const rot = rotateY(px, py, pz, globeAngle);
          // Rotate globe slightly on X axis for an orbital slant
          const final = rotateX(rot[0], rot[1], rot[2], 0.4);

          // Simple orthographic projection
          const sx = final[0] + globeCenterX;
          const sy = final[1] + globeCenterY;

          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw Longitudes
      const longs = 12;
      for (let i = 0; i < longs; i++) {
        const phi = (i * Math.PI * 2) / longs + globeAngle;

        ctx.beginPath();
        for (let theta = 0; theta <= Math.PI; theta += 0.1) {
          const px = globeRadius * Math.sin(theta) * Math.cos(phi);
          const py = globeRadius * Math.cos(theta);
          const pz = globeRadius * Math.sin(theta) * Math.sin(phi);

          const final = rotateX(px, py, pz, 0.4);

          const sx = final[0] + globeCenterX;
          const sy = final[1] + globeCenterY;

          if (theta === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Draw Orbital Rings (Decorative)
      ctx.strokeStyle = 'rgba(123, 47, 255, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#7B2FFF';
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.05) {
        // Orbit ring is wider than globe
        const rx = globeRadius * 1.45 * Math.cos(a);
        const rz = globeRadius * 1.45 * Math.sin(a);
        const ry = 0;

        // Slanted orbit
        const rotY1 = rotateY(rx, ry, rz, -globeAngle * 1.5);
        const rot = rotateX(rotY1[0], rotY1[1], rotY1[2], 0.7);

        const sx = rot[0] + globeCenterX;
        const sy = rot[1] + globeCenterY;

        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

      // Reset shadow effects
      ctx.shadowBlur = 0;

      // 3. Draw Floating 3D Geometric Shapes
      floatingShapes.forEach(shape => {
        // Move shape
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rx += shape.vrx;
        shape.ry += shape.vry;
        shape.rz += shape.vrz;

        // Wrap around borders
        if (shape.x < -100) shape.x = width + 100;
        if (shape.x > width + 100) shape.x = -100;
        if (shape.y < -100) shape.y = height + 100;
        if (shape.y > height + 100) shape.y = -100;

        // Render shape
        ctx.strokeStyle = shape.color + '44'; // Fade border
        ctx.lineWidth = 1.2;

        // Rotate and project vertices
        const projected = shape.vertices.map(vertex => {
          let [x, y, z] = vertex;
          // Scale relative vertex by size
          x *= shape.size;
          y *= shape.size;
          z *= shape.size;

          // Apply rotations
          let rot = rotateX(x, y, z, shape.rx);
          rot = rotateY(rot[0], rot[1], rot[2], shape.ry);
          rot = rotateZ(rot[0], rot[1], rot[2], shape.rz);

          // Add absolute position
          const absX = rot[0] + shape.x;
          const absY = rot[1] + shape.y;
          const absZ = rot[2] + shape.z;

          // Perspective projection
          const fov = 400; // perspective depth
          const scale = fov / (fov + absZ);
          const projX = (absX - width / 2) * scale + width / 2;
          const projY = (absY - height / 2) * scale + height / 2;

          return [projX, projY];
        });

        // Draw edges
        shape.edges.forEach(edge => {
          const [startIdx, endIdx] = edge;
          const startPt = projected[startIdx];
          const endPt = projected[endIdx];
          
          if (startPt && endPt) {
            ctx.beginPath();
            ctx.moveTo(startPt[0], startPt[1]);
            ctx.lineTo(endPt[0], endPt[1]);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [globePosition]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default Space3DBackground;
