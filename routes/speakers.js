import express from 'express';
import { body } from 'express-validator';
import db from '../config/database.js';
import { authenticateUser, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all speakers
router.get('/', async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT u.first_name, u.last_name, sp.expertise, sp.price_per_session
      FROM users u
      JOIN speaker_profiles sp ON u.id = sp.user_id
      WHERE u.user_type = 'speaker'
    `);
    
    const speakers = stmt.all();
    res.json(speakers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/update speaker profile (protected route)
router.post('/profile', 
  authenticateUser,
  authorizeRole(['speaker']),
  [
    body('expertise').notEmpty(),
    body('pricePerSession').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const { expertise, pricePerSession } = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO speaker_profiles (user_id, expertise, price_per_session)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
        expertise = excluded.expertise,
        price_per_session = excluded.price_per_session
      `);
      
      stmt.run(req.user.userId, expertise, pricePerSession);
      res.json({ message: 'Speaker profile updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;