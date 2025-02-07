import express from 'express';
import { body } from 'express-validator';
import db from '../config/database.js';
import { authenticateUser } from '../middleware/auth.js';
import { sendBookingConfirmation } from '../utils/email.js';
import { createCalendarEvent } from '../utils/calendar.js';

const router = express.Router();

// Get available time slots for a speaker
router.get('/available-slots/:speakerId/:date', async (req, res) => {
  try {
    const { speakerId, date } = req.params;
    
    // Get all booked slots for the speaker on the given date
    const stmt = db.prepare(`
      SELECT time_slot
      FROM session_bookings
      WHERE speaker_id = ? AND booking_date = ?
    `);
    
    const bookedSlots = stmt.all(speakerId, date);
    
    // Generate all possible time slots (9 AM to 4 PM)
    const allSlots = Array.from({ length: 8 }, (_, i) => `${i + 9}:00`);
    
    // Filter out booked slots
    const availableSlots = allSlots.filter(
      slot => !bookedSlots.some(booking => booking.time_slot === slot)
    );
    
    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book a session
router.post('/book',
  authenticateUser,
  [
    body('speakerId').isInt(),
    body('date').isDate(),
    body('timeSlot').matches(/^([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  async (req, res) => {
    try {
      const { speakerId, date, timeSlot } = req.body;
      
      // Check if slot is available
      const checkStmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM session_bookings
        WHERE speaker_id = ? AND booking_date = ? AND time_slot = ?
      `);
      
      const { count } = checkStmt.get(speakerId, date, timeSlot);
      
      if (count > 0) {
        return res.status(400).json({ error: 'Time slot already booked' });
      }
      
      // Create booking
      const bookingStmt = db.prepare(`
        INSERT INTO session_bookings (speaker_id, user_id, booking_date, time_slot, status)
        VALUES (?, ?, ?, ?, 'confirmed')
      `);
      
      bookingStmt.run(speakerId, req.user.userId, date, timeSlot);
      
      // Get user and speaker emails for notification
      const emailStmt = db.prepare(`
        SELECT email, user_type FROM users WHERE id IN (?, ?)
      `);
      
      const emails = emailStmt.all(req.user.userId, speakerId);
      const userEmail = emails.find(e => e.user_type === 'user').email;
      const speakerEmail = emails.find(e => e.user_type === 'speaker').email;
      
      // Send confirmation emails and create calendar event
      await Promise.all([
        sendBookingConfirmation(userEmail, speakerEmail, { date, time: timeSlot }),
        createCalendarEvent(userEmail, speakerEmail, { date, time: timeSlot })
      ]);
      
      res.json({ message: 'Session booked successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;