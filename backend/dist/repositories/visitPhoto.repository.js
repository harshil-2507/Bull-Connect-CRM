"use strict";
// backend/src/repositories/visitPhoto.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitPhotoRepository = void 0;
class VisitPhotoRepository {
    async create(tx, data) {
        const res = await tx.query(`
      INSERT INTO visit_photos (
        visit_id,
        photo_url,
        photo_type
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `, [data.visitId, data.photoUrl, data.photoType ?? null]);
        return {
            id: res.rows[0].id,
            visitId: res.rows[0].visit_id,
            photoUrl: res.rows[0].photo_url,
            photoType: res.rows[0].photo_type,
            uploadedAt: res.rows[0].uploaded_at,
        };
    }
}
exports.VisitPhotoRepository = VisitPhotoRepository;
