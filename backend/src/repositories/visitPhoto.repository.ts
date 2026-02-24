// backend/src/repositories/visitPhoto.repository.ts

import { PoolClient } from "pg";
import { VisitPhoto, CreateVisitPhotoDTO } from "../models/visitPhoto.model";

export class VisitPhotoRepository {
  async create(
    tx: PoolClient,
    data: CreateVisitPhotoDTO
  ): Promise<VisitPhoto> {
    const res = await tx.query(
      `
      INSERT INTO visit_photos (
        visit_id,
        photo_url,
        photo_type
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [data.visitId, data.photoUrl, data.photoType ?? null]
    );

    return {
      id: res.rows[0].id,
      visitId: res.rows[0].visit_id,
      photoUrl: res.rows[0].photo_url,
      photoType: res.rows[0].photo_type,
      uploadedAt: res.rows[0].uploaded_at,
    };
  }
}