const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('./database');

/**
 * Configure Google OAuth 2.0 strategy for Passport.js
 * Finds or creates a user in the database upon successful Google authentication.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('Google hesabından e-posta alınamadı.'), null);
        }

        // Try to find existing user by google_id
        const existingUser = await query(
          'SELECT id, google_id, email, name, avatar_url, created_at FROM users WHERE google_id = $1',
          [googleId]
        );

        if (existingUser.rows.length > 0) {
          // Update user info in case it changed on Google's side
          const updated = await query(
            `UPDATE users SET name = $1, avatar_url = $2, email = $3 WHERE google_id = $4
             RETURNING id, google_id, email, name, avatar_url, created_at`,
            [name, avatarUrl, email, googleId]
          );
          return done(null, updated.rows[0]);
        }

        // Create new user
        const newUser = await query(
          `INSERT INTO users (google_id, email, name, avatar_url)
           VALUES ($1, $2, $3, $4)
           RETURNING id, google_id, email, name, avatar_url, created_at`,
          [googleId, email, name, avatarUrl]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        console.error('Passport Google strategy error:', err.message);
        return done(err, null);
      }
    }
  )
);

// Serialize user ID into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session by ID
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query(
      'SELECT id, google_id, email, name, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
