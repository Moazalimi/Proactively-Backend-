import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { sendVerificationEmail } from '../utils/email.js';

const router = express.Router();

// Signup validation middleware
const signupValidation = [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('userType').isIn(['user', 'speaker']),
];

// Signup route
router.post('/signup', signupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, userType } = req.body;
    const hashedPassword = await hashPassword(password);
    
    const stmt = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, user_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(firstName, lastName, email, hashedPassword, userType);
    
    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpStmt = db.prepare(`
      INSERT INTO otp_verifications (user_id, otp, expires_at)
      VALUES (?, ?, datetime('now', '+1 hour'))
    `);
    otpStmt.run(result.lastInsertRowid, otp);

    // Send verification email
    await sendVerificationEmail(email, otp);

    res.status(201).json({ message: 'User created successfully. Please verify your email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    const token = generateToken(user.id, user.user_type);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP route
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const stmt = db.prepare(`
      SELECT ov.* FROM otp_verifications ov
      JOIN users u ON u.id = ov.user_id
      WHERE u.email = ? AND ov.otp = ? AND ov.expires_at > datetime('now')
    `);
    
    const verification = stmt.get(email, otp);
    
    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update user verification status
    const updateStmt = db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?');
    updateStmt.run(email);

    // Delete used OTP
    const deleteStmt = db.prepare('DELETE FROM otp_verifications WHERE id = ?');
    deleteStmt.run(verification.id);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;