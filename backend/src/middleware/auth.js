const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware
 * Extracts JWT from httpOnly cookie 'mizan_token', verifies it,
 * and attaches the decoded user payload to req.user.
 */
const authenticate = (req, res, next) => {
  try {
    let token = req.cookies?.mizan_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Oturum açmanız gerekmektedir.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Oturumunuz sona ermiştir. Lütfen tekrar giriş yapınız.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz oturum bilgisi. Lütfen tekrar giriş yapınız.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama hatası.',
    });
  }
};

/**
 * Generate a signed JWT for a user
 * @param {Object} user - User object with id, email, name
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Cookie options for httpOnly JWT token
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

module.exports = { authenticate, generateToken, getCookieOptions };
