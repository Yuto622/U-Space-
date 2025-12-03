
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  text: string;
  timestamp: number;
}

export interface Position {
  x: number;
  y: number;
}

export type MapId = 'world' | 'cafe' | 'station' | 'supermarket' | 'library' | 'hospital' | 'school' | 'tech_store' | 'hotel';

export interface Portal {
  x: number;
  y: number;
  w: number;
  h: number;
  targetMapId: MapId;
  targetX: number;
  targetY: number;
}

export interface Furniture {
  type: 'table' | 'shelf' | 'bed' | 'counter' | 'desk' | 'potted_plant' | 'bench' | 'fountain' | 'chair' | 'car' | 'lamp';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface GameMap {
  id: MapId;
  name: string;
  width: number;
  height: number;
  floorColor: string;
  floorType: 'grass' | 'wood' | 'tile' | 'carpet' | 'concrete';
  portals: Portal[];
  furniture: Furniture[];
}

export interface NPC {
  id: string;
  mapId: MapId; // Which map does this NPC belong to?
  name: string;
  roleDescription: string;
  position: Position;
  greeting: string;
  // Appearance
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
}

export interface GameState {
  playerPos: Position;
  currentMapId: MapId;
  activeNpcId: string | null;
  isTalking: boolean;
  history: Record<string, Message[]>;
}

export type Direction = { x: number; y: number };

// For Depth Sorting
export interface RenderableEntity {
  type: 'player' | 'npc' | 'tree' | 'building' | 'prop' | 'furniture';
  y: number; // Sort key
  draw: (ctx: CanvasRenderingContext2D) => void;
}
