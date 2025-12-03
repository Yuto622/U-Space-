
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  INTERACTION_RADIUS, 
  MOVEMENT_SPEED, 
  NPCS, 
  PLAYER_HITBOX_RADIUS,
  COLOR_ROAD_MARKING,
  COLOR_WATER,
  COLOR_SIDEWALK,
  MAPS
} from './constants';
import { Direction, Message, Position, Role, RenderableEntity, MapId, Portal, Furniture } from './types';
import { DialogBox } from './components/DialogBox';
import { VirtualJoystick } from './components/VirtualJoystick';
import { generateReply } from './services/geminiService';

const STORAGE_KEY = 'english_town_history_v3';

// Helper for randomness
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Static assets
const STATIC_TREES = Array.from({ length: 80 }).map(() => ({
  x: getRandomInt(50, MAPS.world.width - 50),
  y: getRandomInt(50, MAPS.world.height - 50),
  variant: getRandomInt(0, 2),
  scale: 0.8 + Math.random() * 0.4
}));

const STATIC_FLOWERS = Array.from({ length: 150 }).map(() => ({
  x: getRandomInt(20, MAPS.world.width - 20),
  y: getRandomInt(20, MAPS.world.height - 20),
  color: ['#f472b6', '#fbbf24', '#a78bfa'][getRandomInt(0, 2)]
}));

export default function App() {
  // Game State
  const [currentMapId, setCurrentMapId] = useState<MapId>('world');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1200, y: 900 }); 
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [isTalking, setIsTalking] = useState(false);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(0);

  // Input State
  const keysPressed = useRef<Set<string>>(new Set());
  const joystickDir = useRef<Direction>({ x: 0, y: 0 });
  
  // Animation State
  const frameRef = useRef<number>(0);
  const isMovingRef = useRef<boolean>(false);
  const lastFacingRef = useRef<number>(1);
  const requestRef = useRef<number>();
  const playerPosRef = useRef<Position>({ x: 1200, y: 900 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resize Handler
  useEffect(() => {
    const handleResize = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) { console.error("Failed to parse history", e); }
    }
  }, []);

  // Save History
  useEffect(() => {
    if (Object.keys(chatHistory).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Map Transition Logic
  const handlePortal = (portal: Portal) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Fade Out
    let op = 0;
    const fadeOut = setInterval(() => {
      op += 0.1;
      setTransitionOpacity(op);
      if (op >= 1) {
        clearInterval(fadeOut);
        // Switch Map
        setCurrentMapId(portal.targetMapId);
        playerPosRef.current = { x: portal.targetX, y: portal.targetY };
        setPlayerPos({ x: portal.targetX, y: portal.targetY });
        
        // Fade In
        setTimeout(() => {
          const fadeIn = setInterval(() => {
            op -= 0.1;
            setTransitionOpacity(op);
            if (op <= 0) {
              clearInterval(fadeIn);
              setIsTransitioning(false);
              setTransitionOpacity(0);
            }
          }, 30);
        }, 300);
      }
    }, 30);
  };

  // Conversation
  const startConversation = useCallback((npcId: string) => {
    setIsTalking(true);
    setActiveNpcId(npcId);
    setChatHistory(prev => {
      if (!prev[npcId] || prev[npcId].length === 0) {
        const npc = NPCS.find(n => n.id === npcId);
        if (npc) {
          const greetingMsg: Message = {
            role: Role.MODEL,
            text: npc.greeting,
            timestamp: Date.now()
          };
          return { ...prev, [npcId]: [greetingMsg] };
        }
      }
      return prev;
    });
  }, []);

  const endConversation = () => {
    setIsTalking(false);
    setActiveNpcId(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeNpcId) return;
    const userMsg: Message = { role: Role.USER, text, timestamp: Date.now() };
    setChatHistory(prev => ({ ...prev, [activeNpcId]: [...(prev[activeNpcId] || []), userMsg] }));
    setIsLoadingReply(true);

    const npc = NPCS.find(n => n.id === activeNpcId);
    if (npc) {
      const fullHistory = [...(chatHistory[activeNpcId] || []), userMsg];
      const replyText = await generateReply(npc, fullHistory, text);
      const replyMsg: Message = { role: Role.MODEL, text: replyText, timestamp: Date.now() };
      setChatHistory(prev => ({ ...prev, [activeNpcId]: [...(prev[activeNpcId] || []), replyMsg] }));
    }
    setIsLoadingReply(false);
  };

  // --- Drawing Helpers ---
  const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCharacter = (
    ctx: CanvasRenderingContext2D, x: number, y: number, 
    skin: string, hair: string, shirt: string, pants: string, 
    moving: boolean, isPlayer: boolean
  ) => {
    const time = Date.now();
    const bob = moving ? Math.sin(time / 100) * 2 : 0;
    const legOffset = moving ? Math.sin(time / 100) * 4 : 0;

    drawShadow(ctx, x, y, 10);

    // Legs
    ctx.fillStyle = pants;
    ctx.beginPath(); ctx.roundRect(x + 1, y - 10, 4, 10 + legOffset, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x - 5, y - 10, 4, 10 - legOffset, 2); ctx.fill();

    // Body
    ctx.fillStyle = shirt;
    ctx.beginPath(); ctx.roundRect(x - 8, y - 24 + bob, 16, 16, 4); ctx.fill();

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(x, y - 28 + bob, 7, 0, Math.PI * 2); ctx.fill();

    // Hair
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(x, y - 29 + bob, 7.5, Math.PI, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 28 + bob, 7.5, 0, Math.PI); ctx.fill();

    if (isPlayer) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 45 + bob);
      ctx.lineTo(x + 4, y - 45 + bob);
      ctx.lineTo(x, y - 40 + bob);
      ctx.fill();
    }
  };

  const drawBuildingExterior = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, label: string) => {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
    ctx.fillRect(x + 10, y + 10, w, h);
    
    // Main Wall
    ctx.fillStyle = '#f8fafc'; 
    ctx.fillRect(x, y, w, h);
    
    // Windows
    ctx.fillStyle = '#bae6fd'; // Light blue glass
    const cols = Math.floor(w / 40);
    const rows = Math.floor(h / 50);
    for(let r = 0; r < rows - 1; r++) {
      for(let c = 0; c < cols; c++) {
         if (Math.random() > 0.7) continue; // Randomly skip some for variety
         const wx = x + 15 + c * 35;
         const wy = y + 30 + r * 45;
         if (wx + 20 < x + w && wy + 30 < y + h) {
            ctx.fillRect(wx, wy, 20, 30);
            // Window sill
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(wx - 2, wy + 30, 24, 4);
            ctx.fillStyle = '#bae6fd'; // Reset
         }
      }
    }

    // Roof
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + w + 5, y);
    ctx.lineTo(x + w, y + 20);
    ctx.lineTo(x, y + 20);
    ctx.fill();

    // Sign
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + w/2 - 40, y + 30, 80, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w/2, y + 44);

    // Door (Visual)
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + w/2 - 15, y + h - 40, 30, 40);
  };

  const drawFurniture = (ctx: CanvasRenderingContext2D, f: Furniture) => {
    // Shadows
    if (f.type !== 'fountain') {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(f.x + 2, f.y + f.h - 2, f.w, 4);
    }

    ctx.fillStyle = f.color;
    
    if (f.type === 'fountain') {
       // Water pool
       ctx.fillStyle = '#93c5fd';
       ctx.beginPath(); ctx.ellipse(f.x + f.w/2, f.y + f.h/2, f.w/2, f.h/2 - 10, 0, 0, Math.PI*2); ctx.fill();
       ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 8; ctx.stroke();
       // Center spout
       ctx.fillStyle = '#f1f5f9';
       ctx.beginPath(); ctx.arc(f.x + f.w/2, f.y + f.h/2 - 10, 20, 0, Math.PI*2); ctx.fill();
       // Spray particles (simple static for now, could animate)
       ctx.fillStyle = 'rgba(255,255,255,0.6)';
       for(let i=0; i<5; i++) {
           ctx.beginPath(); ctx.arc(f.x + f.w/2 + (Math.random()-0.5)*40, f.y + f.h/2 - 20 + (Math.random()-0.5)*20, 3, 0, Math.PI*2); ctx.fill();
       }
       return;
    }

    // Simple 3D extrusion effect for blocky items
    if (['counter', 'table', 'desk', 'shelf', 'bed', 'bench'].includes(f.type)) {
        ctx.fillRect(f.x, f.y - 10, f.w, f.h); 
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(f.x, f.y + f.h - 10, f.w, 10); // Side shadow
    } else if (f.type === 'chair') {
        // Simple backrest and seat
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x, f.y, f.w, f.h); // Seat
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; // Darker back
        ctx.fillRect(f.x, f.y - 10, f.w, 10); // Backrest top
    } else {
        ctx.fillRect(f.x, f.y - 10, f.w, f.h);
    }
    
    // Details
    if (f.type === 'table' || f.type === 'desk') {
       ctx.fillStyle = 'rgba(255,255,255,0.1)';
       ctx.fillRect(f.x + 5, f.y - 5, f.w - 10, f.h - 10);
    }
    if (f.type === 'bed') {
       ctx.fillStyle = '#fff'; // Pillow
       ctx.fillRect(f.x + 10, f.y - 5, f.w - 20, 20);
    }
    if (f.type === 'potted_plant') {
       ctx.fillStyle = '#22c55e';
       ctx.beginPath(); ctx.arc(f.x + f.w/2, f.y, f.w/2, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawFloorPattern = (ctx: CanvasRenderingContext2D, map: typeof MAPS['world'], camX: number, camY: number, width: number, height: number) => {
      // Background base
      ctx.fillStyle = map.floorColor;
      ctx.fillRect(0, 0, map.width, map.height);

      if (map.floorType === 'tile') {
          ctx.strokeStyle = 'rgba(0,0,0,0.05)';
          ctx.lineWidth = 1;
          for(let x=0; x<map.width; x+=40) {
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, map.height); ctx.stroke();
          }
          for(let y=0; y<map.height; y+=40) {
              ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(map.width, y); ctx.stroke();
          }
      } else if (map.floorType === 'wood') {
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
           for(let x=0; x<map.width; x+=30) {
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, map.height); ctx.stroke();
          }
      }
  };

  // Draw Roads with Sidewalks
  const drawRoadRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      // Sidewalk
      ctx.fillStyle = COLOR_SIDEWALK;
      ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
      // Road
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x, y, w, h);
      
      // Dashed Line
      ctx.strokeStyle = COLOR_ROAD_MARKING;
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      if (w > h) { // Horizontal
          ctx.moveTo(x, y + h/2); ctx.lineTo(x + w, y + h/2);
      } else { // Vertical
          ctx.moveTo(x + w/2, y); ctx.lineTo(x + w/2, y + h);
      }
      ctx.stroke();
      ctx.setLineDash([]);
  };

  const drawCrosswalk = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean) => {
      ctx.fillStyle = '#fff';
      if (vertical) {
          for(let i=0; i<h; i+=15) ctx.fillRect(x, y+i, w, 10);
      } else {
          for(let i=0; i<w; i+=15) ctx.fillRect(x+i, y, 10, h);
      }
  };

  // Game Loop
  const update = useCallback(() => {
    if (isTalking || isTransitioning) {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    let dx = 0, dy = 0;
    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('KeyW')) dy -= 1;
    if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('KeyS')) dy += 1;
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA')) dx -= 1;
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD')) dx += 1;
    if (joystickDir.current.x !== 0 || joystickDir.current.y !== 0) {
      dx = joystickDir.current.x;
      dy = joystickDir.current.y;
    }

    const isMoving = dx !== 0 || dy !== 0;
    isMovingRef.current = isMoving;
    if (dx !== 0) lastFacingRef.current = Math.sign(dx);

    if (isMoving) {
      const currentMap = MAPS[currentMapId];
      const len = Math.sqrt(dx*dx + dy*dy);
      const scale = len > 1 ? 1/len : 1; 
      const nextX = playerPosRef.current.x + dx * scale * MOVEMENT_SPEED;
      const nextY = playerPosRef.current.y + dy * scale * MOVEMENT_SPEED;
      
      const boundX = Math.max(PLAYER_HITBOX_RADIUS, Math.min(currentMap.width - PLAYER_HITBOX_RADIUS, nextX));
      const boundY = Math.max(PLAYER_HITBOX_RADIUS, Math.min(currentMap.height - PLAYER_HITBOX_RADIUS, nextY));

      playerPosRef.current = { x: boundX, y: boundY };
      setPlayerPos({ x: boundX, y: boundY });

      // Check Portals
      const hitPortal = currentMap.portals.find(p => 
        nextX > p.x && nextX < p.x + p.w &&
        nextY > p.y && nextY < p.y + p.h
      );

      if (hitPortal) {
        handlePortal(hitPortal);
      }
    }

    // Check Interactions
    const currentMapNPCs = NPCS.filter(n => n.mapId === currentMapId);
    currentMapNPCs.forEach(npc => {
      const dist = Math.sqrt(
        Math.pow(playerPosRef.current.x - npc.position.x, 2) + 
        Math.pow(playerPosRef.current.y - npc.position.y, 2)
      );
      if (dist < INTERACTION_RADIUS) {
         startConversation(npc.id);
         // Push back
         const pushAngle = Math.atan2(playerPosRef.current.y - npc.position.y, playerPosRef.current.x - npc.position.x);
         const safeDist = INTERACTION_RADIUS + 5;
         playerPosRef.current = {
             x: npc.position.x + Math.cos(pushAngle) * safeDist,
             y: npc.position.y + Math.sin(pushAngle) * safeDist
         };
         setPlayerPos(playerPosRef.current);
      }
    });

    requestRef.current = requestAnimationFrame(update);
  }, [isTalking, isTransitioning, currentMapId, startConversation]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentMap = MAPS[currentMapId];
    const isIndoors = currentMapId !== 'world';

    // 1. Camera & Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Camera clamp
    let camX = playerPos.x - canvas.width / 2;
    let camY = playerPos.y - canvas.height / 2;
    camX = Math.max(0, Math.min(camX, currentMap.width - canvas.width));
    camY = Math.max(0, Math.min(camY, currentMap.height - canvas.height));
    
    // For small maps (indoors), if map < screen, center it
    if (currentMap.width < canvas.width) camX = -(canvas.width - currentMap.width) / 2;
    if (currentMap.height < canvas.height) camY = -(canvas.height - currentMap.height) / 2;

    ctx.translate(-camX, -camY);

    // 2. Draw Floor / Ground
    drawFloorPattern(ctx, currentMap, camX, camY, canvas.width, canvas.height);

    if (currentMapId === 'world') {
       // Roads
       drawRoadRect(ctx, 200, 200, 2000, 150); // Top
       drawRoadRect(ctx, 200, 1450, 2000, 150); // Bottom
       drawRoadRect(ctx, 200, 200, 150, 1400); // Left
       drawRoadRect(ctx, 2050, 200, 150, 1400); // Right
       drawRoadRect(ctx, 1125, 200, 150, 1400); // Center Vertical

       // Crosswalks
       drawCrosswalk(ctx, 350, 200, 60, 150, false); // Near Cafe
       drawCrosswalk(ctx, 1125, 350, 150, 60, true); // Center Top
       drawCrosswalk(ctx, 1125, 1400, 150, 60, true); // Center Bottom

       // Water (Lake)
       ctx.fillStyle = COLOR_WATER;
       ctx.beginPath(); ctx.ellipse(1900, 1400, 200, 150, 0, 0, Math.PI * 2); ctx.fill();
    } else {
       // Indoor Walls (Border)
       ctx.strokeStyle = '#334155';
       ctx.lineWidth = 20;
       ctx.strokeRect(0, 0, currentMap.width, currentMap.height);
    }

    // 3. Render Entities (Depth Sorted)
    const entities: RenderableEntity[] = [];

    // Player
    entities.push({
      type: 'player',
      y: playerPos.y,
      draw: (c) => drawCharacter(c, playerPos.x, playerPos.y, '#fca5a5', '#3b0764', '#db2777', '#fbcfe8', isMovingRef.current, true)
    });

    // NPCs
    NPCS.filter(n => n.mapId === currentMapId).forEach(npc => {
      entities.push({
        type: 'npc',
        y: npc.position.y,
        draw: (c) => {
           drawCharacter(c, npc.position.x, npc.position.y, npc.skinColor, npc.hairColor, npc.shirtColor, npc.pantsColor, false, false);
           // Quest Marker / Interaction Bubble
           const dist = Math.sqrt(Math.pow(playerPos.x - npc.position.x, 2) + Math.pow(playerPos.y - npc.position.y, 2));
           if (dist < INTERACTION_RADIUS * 2.5) {
             c.fillStyle = '#fff';
             c.beginPath(); c.arc(npc.position.x, npc.position.y - 55, 12, 0, Math.PI*2); c.fill();
             c.beginPath(); c.moveTo(npc.position.x, npc.position.y - 45); c.lineTo(npc.position.x-5, npc.position.y-55); c.lineTo(npc.position.x+5, npc.position.y-55); c.fill();
             c.fillStyle = '#000'; c.font = 'bold 16px sans-serif'; c.textAlign = 'center'; c.fillText("?", npc.position.x, npc.position.y - 50);
           }
        }
      });
    });

    // Scenery (Trees/Flowers) - Only in World
    if (currentMapId === 'world') {
        STATIC_TREES.forEach(tree => {
            if (tree.x < camX - 50 || tree.x > camX + canvas.width + 50) return;
            entities.push({
                type: 'tree',
                y: tree.y,
                draw: (c) => {
                    drawShadow(c, tree.x, tree.y, 14 * tree.scale);
                    c.fillStyle = '#5d4037'; c.fillRect(tree.x - 3 * tree.scale, tree.y - 5 * tree.scale, 6 * tree.scale, 10 * tree.scale);
                    c.fillStyle = '#15803d'; c.beginPath(); c.arc(tree.x, tree.y - 30 * tree.scale, 20 * tree.scale, 0, Math.PI * 2); c.fill();
                }
            });
        });
        STATIC_FLOWERS.forEach(f => {
             ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI * 2); ctx.fill();
        });
    }

    // Buildings - Only in World
    if (currentMapId === 'world') {
        const buildings = [
            { id: 'cafe', x: 250, y: 50, w: 200, h: 150, color: '#ea580c', label: 'CAFE' },
            { id: 'station', x: 1100, y: 20, w: 250, h: 140, color: '#2563eb', label: 'STATION' },
            { id: 'supermarket', x: 1700, y: 450, w: 220, h: 160, color: '#16a34a', label: 'MARKET' },
            { id: 'library', x: 700, y: 1050, w: 240, h: 160, color: '#9333ea', label: 'LIBRARY' },
            { id: 'hospital', x: 150, y: 650, w: 250, h: 160, color: '#06b6d4', label: 'HOSPITAL' },
            { id: 'school', x: 1500, y: 950, w: 260, h: 160, color: '#f59e0b', label: 'SCHOOL' },
            { id: 'tech_store', x: 500, y: 350, w: 200, h: 150, color: '#3b82f6', label: 'TECH' },
            { id: 'hotel', x: 1900, y: 150, w: 240, h: 180, color: '#e11d48', label: 'HOTEL' },
        ];
        buildings.forEach(b => {
             entities.push({
                 type: 'building',
                 y: b.y + b.h - 10,
                 draw: (c) => drawBuildingExterior(c, b.x, b.y, b.w, b.h, b.color, b.label)
             });
        });
    }

    // Furniture (Both Indoor and Outdoor)
    currentMap.furniture.forEach(f => {
        entities.push({
            type: 'furniture',
            y: f.y + f.h, // Sort by bottom
            draw: (c) => drawFurniture(c, f)
        });
    });

    entities.sort((a, b) => a.y - b.y);
    entities.forEach(e => e.draw(ctx));

    // Portals (Visual hints)
    if (currentMapId !== 'world') {
        const exit = currentMap.portals[0];
        if (exit) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
            ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign='center';
            ctx.fillText("EXIT", exit.x + exit.w/2, exit.y + exit.h/2 + 4);
        }
    }

    ctx.restore();

  }, [playerPos, canvasSize, currentMapId]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="block" />

      {/* HUD: Location Toast */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-900 px-4 py-2 rounded-xl shadow-lg border border-slate-200 z-10 flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${currentMapId === 'world' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
         <span className="font-bold tracking-wide">{MAPS[currentMapId].name}</span>
      </div>

      {!process.env.API_KEY && (
           <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white p-8 text-center z-50 backdrop-blur-sm">
             <div className="max-w-md">
               <h1 className="text-2xl font-bold text-red-400 mb-2">API Key Required</h1>
               <p className="text-slate-300">Set <code>API_KEY</code> to play.</p>
             </div>
           </div>
      )}

      {/* Fade Transition Overlay */}
      <div 
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 z-50"
        style={{ opacity: transitionOpacity }}
      />

      <div className="md:hidden">
        <VirtualJoystick onMove={(dir) => joystickDir.current = dir} />
      </div>

      {isTalking && activeNpcId && (
        <DialogBox 
          npc={NPCS.find(n => n.id === activeNpcId)!}
          messages={chatHistory[activeNpcId] || []}
          onSendMessage={handleSendMessage}
          onClose={endConversation}
          isLoading={isLoadingReply}
        />
      )}
    </div>
  );
}
