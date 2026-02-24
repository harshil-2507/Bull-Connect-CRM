// backend/src/models/visitPhoto.model.ts

export interface VisitPhoto {
  id: string;
  visitId: string;
  photoUrl: string;
  photoType?: string | null;
  uploadedAt: Date;
}

/**
 * DTO for uploading photo
 */
export interface CreateVisitPhotoDTO {
  visitId: string;
  photoUrl: string;
  photoType?: string;
}