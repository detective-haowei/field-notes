export interface GeoPoint {
  lat: number;
  lon: number;
  accuracy?: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  location?: GeoPoint;
  createdAt: number;
  updatedAt: number;
}

export type NoteDraft = Pick<Note, "title" | "body" | "tags" | "location">;
