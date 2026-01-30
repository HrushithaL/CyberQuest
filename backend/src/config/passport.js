const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value });

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: Math.random().toString(36), // Generate random password for OAuth users
              role: "user",
              skillLevel: "beginner",
              oauthProvider: "google",
              oauthId: profile.id,
            });
          } else if (!user.oauthProvider) {
            // Link OAuth to existing user
            user.oauthProvider = "google";
            user.oauthId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails?.[0]?.value || profile.username });

          if (!user) {
            user = await User.create({
              name: profile.displayName || profile.username,
              email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
              password: Math.random().toString(36),
              role: "user",
              skillLevel: "beginner",
              oauthProvider: "github",
              oauthId: profile.id,
            });
          } else if (!user.oauthProvider) {
            user.oauthProvider = "github";
            user.oauthId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}


module.exports = passport;
