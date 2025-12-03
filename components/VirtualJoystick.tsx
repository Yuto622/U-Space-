import React, { useRef, useState } from 'react';
import { Direction } from '../types';

interface VirtualJoystickProps {
  onMove: (dir: Direction) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const handleStart = (clientX: number, clientY: number) => {
    setActive(true);
    setOrigin({ x: clientX, y: clientY });
    setPosition({ x: 0, y: 0 });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!active) return;
    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    
    // Cap radius
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 50;
    const scale = distance > maxRadius ? maxRadius / distance : 1;
    
    const constrainedX = dx * scale;
    const constrainedY = dy * scale;

    setPosition({ x: constrainedX, y: constrainedY });
    
    // Normalize output for game loop (-1 to 1)
    onMove({
      x: constrainedX / maxRadius,
      y: constrainedY / maxRadius
    });
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  
  // Mouse handlers for testing
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();

  return (
    <div 
      className="fixed bottom-12 left-8 w-40 h-40 rounded-full z-40 flex items-center justify-center select-none touch-none"
      style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0) 100%)',
        boxShadow: '0 0 20px rgba(0,0,0,0.1), inset 0 0 20px rgba(255,255,255,0.1)'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={handleEnd}
    >
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
      
      {/* Stick */}
      <div 
        className="w-16 h-16 rounded-full shadow-xl backdrop-blur-sm transform transition-transform duration-75 flex items-center justify-center"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          background: active ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255,255,255,0.4)'
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white/80 shadow-inner"></div>
      </div>
    </div>
  );
};
