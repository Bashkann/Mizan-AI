const express = require('express');
const passport = require('passport');
const { authenticate, generateToken, getCookieOptions } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/auth/google
 * Initiate Google OAuth 2.0 authentication flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth 2.0 callback
 * On success: generate JWT, set httpOnly cookie, redirect to frontend
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }

      // Generate JWT token
      const token = generateToken(req.user);

      // Set httpOnly cookie
      res.cookie('mizan_token', token, getCookieOptions());

      // Redirect to frontend dashboard
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (err) {
      console.error('Auth callback error:', err.message);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

/**
 * POST /api/auth/logout
 * Clear the authentication cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('mizan_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.json({
    success: true,
    message: 'Oturum başarıyla kapatıldı.',
  });
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile
 * Requires valid JWT token in httpOnly cookie
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { query: dbQuery } = require('../config/database');

    const result = await dbQuery(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.',
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınırken bir hata oluştu.',
    });
  }
});

module.exports = router;
