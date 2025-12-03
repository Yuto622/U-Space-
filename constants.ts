
import { GameMap, MapId, NPC, Portal } from './types';

// Global Constants
export const PLAYER_HITBOX_RADIUS = 15;
export const INTERACTION_RADIUS = 50;
export const MOVEMENT_SPEED = 5.0; // Slightly faster for larger world

// Colors
export const COLOR_GRASS = '#ecfccb'; // lime-100
export const COLOR_ROAD = '#94a3b8'; // slate-400
export const COLOR_ROAD_MARKING = '#e2e8f0'; // slate-200
export const COLOR_WATER = '#60a5fa'; // blue-400
export const COLOR_SIDEWALK = '#cbd5e1'; // slate-300

// --- MAP DEFINITIONS ---

const createExitPortal = (targetX: number, targetY: number): Portal => ({
  x: 350, y: 550, w: 100, h: 50, // Standard exit zone at bottom of room
  targetMapId: 'world',
  targetX, targetY
});

export const MAPS: Record<MapId, GameMap> = {
  world: {
    id: 'world',
    name: 'English Town',
    width: 2400,
    height: 1800,
    floorColor: COLOR_GRASS,
    floorType: 'grass',
    portals: [
      { x: 330, y: 190, w: 40, h: 10, targetMapId: 'cafe', targetX: 400, targetY: 500 },
      { x: 1210, y: 150, w: 40, h: 10, targetMapId: 'station', targetX: 400, targetY: 500 },
      { x: 1790, y: 600, w: 40, h: 10, targetMapId: 'supermarket', targetX: 400, targetY: 500 },
      { x: 800, y: 1200, w: 40, h: 10, targetMapId: 'library', targetX: 400, targetY: 500 },
      { x: 250, y: 800, w: 40, h: 10, targetMapId: 'hospital', targetX: 400, targetY: 500 },
      { x: 1600, y: 1100, w: 40, h: 10, targetMapId: 'school', targetX: 400, targetY: 500 },
      { x: 600, y: 500, w: 40, h: 10, targetMapId: 'tech_store', targetX: 400, targetY: 500 },
      { x: 2000, y: 300, w: 40, h: 10, targetMapId: 'hotel', targetX: 400, targetY: 500 },
    ],
    furniture: [
      // Central Plaza
      { type: 'fountain', x: 1100, y: 800, w: 200, h: 200, color: COLOR_WATER },
      { type: 'bench', x: 1000, y: 850, w: 80, h: 40, color: '#78350f' },
      { type: 'bench', x: 1320, y: 850, w: 80, h: 40, color: '#78350f' },
      { type: 'bench', x: 1160, y: 1020, w: 80, h: 40, color: '#78350f' },
      { type: 'bench', x: 1160, y: 740, w: 80, h: 40, color: '#78350f' },
      // Park Benches
      { type: 'bench', x: 1500, y: 1300, w: 80, h: 40, color: '#78350f' },
      { type: 'bench', x: 1600, y: 1350, w: 80, h: 40, color: '#78350f' },
      
      // Street Lamps (Along main roads)
      { type: 'lamp', x: 450, y: 300, w: 20, h: 60, color: '#334155' }, // Near Cafe
      { type: 'lamp', x: 1050, y: 300, w: 20, h: 60, color: '#334155' }, // Near Station
      { type: 'lamp', x: 1350, y: 300, w: 20, h: 60, color: '#334155' },
      { type: 'lamp', x: 1050, y: 1350, w: 20, h: 60, color: '#334155' }, // Near Library/Plaza
      { type: 'lamp', x: 1350, y: 1350, w: 20, h: 60, color: '#334155' },
      { type: 'lamp', x: 450, y: 750, w: 20, h: 60, color: '#334155' }, // Near Tech/Hosp
      { type: 'lamp', x: 1750, y: 750, w: 20, h: 60, color: '#334155' }, // Near Market

      // Cars (Parked)
      { type: 'car', x: 1400, y: 180, w: 80, h: 40, color: '#dc2626' }, // Station Parking
      { type: 'car', x: 1500, y: 180, w: 80, h: 40, color: '#2563eb' },
      { type: 'car', x: 1600, y: 550, w: 80, h: 40, color: '#fbbf24' }, // Market Parking
      { type: 'car', x: 1600, y: 500, w: 80, h: 40, color: '#cbd5e1' },
      { type: 'car', x: 100, y: 750, w: 80, h: 40, color: '#000000' }, // Hospital Ambulance-ish
    ]
  },
  cafe: {
    id: 'cafe',
    name: 'The Daily Grind Cafe',
    width: 800,
    height: 600,
    floorColor: '#78350f', // Dark wood
    floorType: 'wood',
    portals: [createExitPortal(350, 230)],
    furniture: [
      { type: 'counter', x: 200, y: 100, w: 400, h: 60, color: '#3f2c22' },
      { type: 'table', x: 150, y: 300, w: 80, h: 80, color: '#5d4037' },
      { type: 'chair', x: 170, y: 270, w: 40, h: 40, color: '#92400e' },
      { type: 'chair', x: 170, y: 370, w: 40, h: 40, color: '#92400e' },
      { type: 'table', x: 550, y: 300, w: 80, h: 80, color: '#5d4037' },
      { type: 'chair', x: 570, y: 270, w: 40, h: 40, color: '#92400e' },
      { type: 'chair', x: 570, y: 370, w: 40, h: 40, color: '#92400e' },
      { type: 'potted_plant', x: 50, y: 50, w: 40, h: 40, color: '#166534' }
    ]
  },
  station: {
    id: 'station',
    name: 'Central Station',
    width: 800,
    height: 600,
    floorColor: '#e2e8f0', // Slate tile
    floorType: 'tile',
    portals: [createExitPortal(1225, 200)],
    furniture: [
      { type: 'counter', x: 500, y: 150, w: 250, h: 50, color: '#1e293b' },
      { type: 'shelf', x: 50, y: 100, w: 100, h: 400, color: '#334155' }, // Ticket machines
      { type: 'bench', x: 300, y: 300, w: 150, h: 40, color: '#475569' },
      { type: 'bench', x: 300, y: 400, w: 150, h: 40, color: '#475569' }
    ]
  },
  supermarket: {
    id: 'supermarket',
    name: 'Fresh Market',
    width: 800,
    height: 600,
    floorColor: '#f1f5f9', // White tile
    floorType: 'tile',
    portals: [createExitPortal(1810, 640)],
    furniture: [
      { type: 'shelf', x: 100, y: 100, w: 600, h: 50, color: '#16a34a' },
      { type: 'shelf', x: 100, y: 250, w: 600, h: 50, color: '#16a34a' },
      { type: 'shelf', x: 100, y: 400, w: 600, h: 50, color: '#16a34a' },
      { type: 'counter', x: 50, y: 450, w: 50, h: 100, color: '#94a3b8' }
    ]
  },
  library: {
    id: 'library',
    name: 'City Library',
    width: 800,
    height: 600,
    floorColor: '#7c2d12', // Mahogany wood
    floorType: 'wood',
    portals: [createExitPortal(820, 1240)],
    furniture: [
      { type: 'shelf', x: 50, y: 50, w: 100, h: 500, color: '#451a03' },
      { type: 'shelf', x: 650, y: 50, w: 100, h: 500, color: '#451a03' },
      { type: 'table', x: 300, y: 300, w: 200, h: 100, color: '#5d4037' },
      { type: 'chair', x: 320, y: 280, w: 40, h: 40, color: '#451a03' },
      { type: 'chair', x: 440, y: 280, w: 40, h: 40, color: '#451a03' },
      { type: 'chair', x: 320, y: 390, w: 40, h: 40, color: '#451a03' },
      { type: 'chair', x: 440, y: 390, w: 40, h: 40, color: '#451a03' },
      { type: 'desk', x: 350, y: 50, w: 100, h: 50, color: '#451a03' }
    ]
  },
  hospital: {
    id: 'hospital',
    name: 'General Hospital',
    width: 800,
    height: 600,
    floorColor: '#ffffff', // Clean white
    floorType: 'tile',
    portals: [createExitPortal(270, 840)],
    furniture: [
      { type: 'bed', x: 50, y: 100, w: 100, h: 150, color: '#bfdbfe' },
      { type: 'bed', x: 50, y: 300, w: 100, h: 150, color: '#bfdbfe' },
      { type: 'chair', x: 170, y: 150, w: 40, h: 40, color: '#94a3b8' },
      { type: 'desk', x: 400, y: 100, w: 200, h: 80, color: '#cbd5e1' },
      { type: 'shelf', x: 650, y: 100, w: 100, h: 300, color: '#94a3b8' },
      { type: 'bench', x: 350, y: 400, w: 150, h: 40, color: '#94a3b8' } // Waiting area
    ]
  },
  school: {
    id: 'school',
    name: 'Town School',
    width: 800,
    height: 600,
    floorColor: '#d97706', // Classroom wood
    floorType: 'wood',
    portals: [createExitPortal(1620, 1140)],
    furniture: [
      { type: 'desk', x: 300, y: 50, w: 200, h: 80, color: '#78350f' }, // Teacher
      { type: 'table', x: 100, y: 200, w: 100, h: 60, color: '#92400e' },
      { type: 'chair', x: 130, y: 250, w: 40, h: 40, color: '#78350f' },
      { type: 'table', x: 300, y: 200, w: 100, h: 60, color: '#92400e' },
      { type: 'chair', x: 330, y: 250, w: 40, h: 40, color: '#78350f' },
      { type: 'table', x: 500, y: 200, w: 100, h: 60, color: '#92400e' },
      { type: 'chair', x: 530, y: 250, w: 40, h: 40, color: '#78350f' },
      { type: 'table', x: 100, y: 350, w: 100, h: 60, color: '#92400e' },
      { type: 'chair', x: 130, y: 400, w: 40, h: 40, color: '#78350f' },
      { type: 'table', x: 300, y: 350, w: 100, h: 60, color: '#92400e' },
      { type: 'chair', x: 330, y: 400, w: 40, h: 40, color: '#78350f' },
      { type: 'table', x: 500, y: 350, w: 100, h: 60, color: '#92400e' },
      { type: 'chair', x: 530, y: 400, w: 40, h: 40, color: '#78350f' },
    ]
  },
  tech_store: {
    id: 'tech_store',
    name: 'Cyber Gadgets',
    width: 800,
    height: 600,
    floorColor: '#1e293b', // Dark slate
    floorType: 'carpet',
    portals: [createExitPortal(620, 540)],
    furniture: [
      { type: 'counter', x: 300, y: 250, w: 200, h: 100, color: '#3b82f6' }, // Center display
      { type: 'shelf', x: 50, y: 50, w: 700, h: 50, color: '#0f172a' },
      { type: 'shelf', x: 50, y: 150, w: 50, h: 300, color: '#0f172a' },
      { type: 'shelf', x: 700, y: 150, w: 50, h: 300, color: '#0f172a' }
    ]
  },
  hotel: {
    id: 'hotel',
    name: 'Grand Hotel',
    width: 800,
    height: 600,
    floorColor: '#7f1d1d', // Red carpet
    floorType: 'carpet',
    portals: [createExitPortal(2020, 340)],
    furniture: [
      { type: 'counter', x: 200, y: 100, w: 400, h: 80, color: '#fbbf24' }, // Gold counter
      { type: 'potted_plant', x: 50, y: 400, w: 60, h: 60, color: '#166534' },
      { type: 'potted_plant', x: 690, y: 400, w: 60, h: 60, color: '#166534' },
      { type: 'chair', x: 100, y: 450, w: 60, h: 60, color: '#b45309' },
      { type: 'chair', x: 640, y: 450, w: 60, h: 60, color: '#b45309' },
    ]
  }
};

// --- NPCs ---

export const NPCS: NPC[] = [
  // --- STAFF / KEY NPCs ---
  {
    id: 'cafe_staff',
    mapId: 'cafe',
    name: 'Emma (Barista)',
    roleDescription: 'You are Emma, a friendly barista. You love talking about coffee blends.',
    position: { x: 400, y: 150 },
    greeting: "Hi there! Welcome to The Daily Grind. Need a caffeine fix?",
    skinColor: '#fca5a5', hairColor: '#78350f', shirtColor: '#ea580c', pantsColor: '#1e293b',
  },
  {
    id: 'station_staff',
    mapId: 'station',
    name: 'Mr. Tanaka',
    roleDescription: 'You are Mr. Tanaka, a helpful but strict train station attendant.',
    position: { x: 400, y: 100 },
    greeting: "Good day. Please have your ticket ready.",
    skinColor: '#fed7aa', hairColor: '#171717', shirtColor: '#2563eb', pantsColor: '#1e293b',
  },
  {
    id: 'supermarket_clerk',
    mapId: 'supermarket',
    name: 'Alex',
    roleDescription: 'You are Alex, a young energetic clerk at the supermarket.',
    position: { x: 400, y: 300 },
    greeting: "Yo! Fresh veggies just dropped. Looking for anything tasty?",
    skinColor: '#fdba74', hairColor: '#facc15', shirtColor: '#16a34a', pantsColor: '#e2e8f0',
  },
  {
    id: 'librarian',
    mapId: 'library',
    name: 'Sarah',
    roleDescription: 'You are Sarah, a quiet and knowledgeable librarian.',
    position: { x: 400, y: 100 },
    greeting: "Shh... welcome. Are you looking for a classic novel?",
    skinColor: '#fca5a5', hairColor: '#b91c1c', shirtColor: '#9333ea', pantsColor: '#475569',
  },
  {
    id: 'police_officer',
    mapId: 'world',
    name: 'Officer John',
    roleDescription: 'You are Officer John, patrolling the park.',
    position: { x: 1500, y: 1400 },
    greeting: "Good afternoon citizen. Stay safe and enjoy the park.",
    skinColor: '#e2e8f0', hairColor: '#4b5563', shirtColor: '#1d4ed8', pantsColor: '#0f172a',
  },
  {
    id: 'doctor',
    mapId: 'hospital',
    name: 'Dr. Hart',
    roleDescription: 'You are Dr. Hart, a caring and professional physician.',
    position: { x: 500, y: 150 },
    greeting: "Hello. I'm Dr. Hart. How are you feeling today?",
    skinColor: '#ffedd5', hairColor: '#a1a1aa', shirtColor: '#ffffff', pantsColor: '#0ea5e9',
  },
  {
    id: 'teacher',
    mapId: 'school',
    name: 'Ms. Stone',
    roleDescription: 'You are Ms. Stone, a passionate English teacher.',
    position: { x: 400, y: 100 },
    greeting: "Good morning class! Are you ready to learn some grammar?",
    skinColor: '#fcd34d', hairColor: '#000000', shirtColor: '#be185d', pantsColor: '#374151',
  },
  {
    id: 'tech_guy',
    mapId: 'tech_store',
    name: 'Ken',
    roleDescription: 'You are Ken, a tech enthusiast who loves gadgets.',
    position: { x: 400, y: 300 },
    greeting: "Hey! Have you seen the specs on this new laptop? It's insane.",
    skinColor: '#e0f2fe', hairColor: '#3b82f6', shirtColor: '#1e293b', pantsColor: '#64748b',
  },
  {
    id: 'hotel_receptionist',
    mapId: 'hotel',
    name: 'Alice',
    roleDescription: 'You are Alice, a polite hotel receptionist.',
    position: { x: 400, y: 120 },
    greeting: "Welcome to the Grand Hotel. Checking in?",
    skinColor: '#fecaca', hairColor: '#fef08a', shirtColor: '#000000', pantsColor: '#000000',
  },

  // --- MOB NPCs (Customers, Students, etc.) ---
  {
    id: 'cafe_customer1',
    mapId: 'cafe',
    name: 'Coffee Lover',
    roleDescription: 'You are a customer enjoying a latte. You are relaxed.',
    position: { x: 170, y: 360 }, // Sitting
    greeting: "This latte is amazing. Do you like coffee?",
    skinColor: '#fecaca', hairColor: '#57534e', shirtColor: '#f43f5e', pantsColor: '#475569',
  },
  {
    id: 'cafe_customer2',
    mapId: 'cafe',
    name: 'Remote Worker',
    roleDescription: 'You are working on your laptop. You are busy but polite.',
    position: { x: 570, y: 260 }, // Sitting
    greeting: "Just finishing up some code. The wifi here is great.",
    skinColor: '#e0f2fe', hairColor: '#0f172a', shirtColor: '#3b82f6', pantsColor: '#1e293b',
  },
  {
    id: 'student_boy',
    mapId: 'school',
    name: 'Timmy',
    roleDescription: 'You are a student trying to understand math.',
    position: { x: 130, y: 240 },
    greeting: "I forgot my homework... don't tell Ms. Stone!",
    skinColor: '#ffedd5', hairColor: '#b45309', shirtColor: '#22c55e', pantsColor: '#1e293b',
  },
  {
    id: 'student_girl',
    mapId: 'school',
    name: 'Lucy',
    roleDescription: 'You are a smart student who loves reading.',
    position: { x: 530, y: 390 },
    greeting: "Have you read 'Harry Potter'? It's my favorite book.",
    skinColor: '#fce7f3', hairColor: '#facc15', shirtColor: '#ec4899', pantsColor: '#831843',
  },
  {
    id: 'hospital_patient',
    mapId: 'hospital',
    name: 'Bob',
    roleDescription: 'You are a patient with a broken leg. You are bored.',
    position: { x: 350, y: 390 }, // On waiting bench
    greeting: "I slipped on a banana peel. Can you believe it?",
    skinColor: '#fdba74', hairColor: '#9ca3af', shirtColor: '#94a3b8', pantsColor: '#cbd5e1',
  },
  {
    id: 'hotel_guest',
    mapId: 'hotel',
    name: 'Tourist',
    roleDescription: 'You are a tourist visiting the town for the first time.',
    position: { x: 640, y: 440 }, // Sitting in lobby
    greeting: "This town is so charming! I love the fountain outside.",
    skinColor: '#ffedd5', hairColor: '#f97316', shirtColor: '#14b8a6', pantsColor: '#fef3c7',
  },
  {
    id: 'plaza_walker',
    mapId: 'world',
    name: 'Jogger',
    roleDescription: 'You are a fitness enthusiast jogging in the plaza.',
    position: { x: 1000, y: 1000 },
    greeting: "Phew! Did 5 miles today. Gotta stay fit!",
    skinColor: '#713f12', hairColor: '#000000', shirtColor: '#fbbf24', pantsColor: '#dc2626',
  }
];
