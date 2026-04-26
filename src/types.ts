export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
