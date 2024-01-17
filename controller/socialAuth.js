const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const AppleStrategy = require('passport-apple');

// Reusable function for Facebook authentication
exports.configureFacebookStrategy = () => {
  passport.use(new FacebookTokenStrategy({
    clientID: '356394783569118',
    clientSecret: 'bdcf55d35d3d66c8061e5eaccaaed6e1'
  }, (accessToken, refreshToken, profile, done) => {
    // You can perform user registration or login based on the Facebook profile here
    // For simplicity, let's assume you save the user profile in your database
    return done(null, profile);
  }));

  return (req, res, next) => {
    passport.authenticate('facebook-token', (err, user, info) => {
      if (err) { return next(err); }
      if (!user) { return res.sendStatus(401); }
      req.logIn(user, (err) => {
        if (err) { return next(err); }
        return res.sendStatus(200);
      });
    })(req, res, next);
  };
};

// Reusable function for Apple authentication
exports.configureAppleStrategy = () => {
  passport.use(new AppleStrategy({
    clientID: 'YOUR_APPLE_CLIENT_ID',
    teamID: 'YOUR_APPLE_TEAM_ID',
    callbackURL: 'http://your-callback-url.com/auth/apple/callback',
    keyID: 'YOUR_APPLE_KEY_ID',  // You need to provide the Key ID
    privateKeyPath: 'path/to/your/apple/private/key.pem',  // Path to your private key file
  }, (accessToken, refreshToken, decodedIdToken, profile, done) => {
    // You can perform user registration or login based on the Apple profile here
    // For simplicity, let's assume you save the user profile in your database
    return done(null, profile);
  }));

  return passport.authenticate('apple', { session: false });
};
