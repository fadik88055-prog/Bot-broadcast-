const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

/* ================= FETCH ================= */
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= DEVELOPERS ================= */
const DEVELOPERS = [
  "1487469480069038171"
];

/* ================= DISCORD CONFIG ================= */
const config = {
  clientID: "1504088907283959911",
  clientSecret: "eSR8n1ADvE2mgaGGvnCFSwhWZQvlMpDg",
  callbackURL: "https://bot-broadcast-production.up.railway.app/callback"
};

/* ================= SESSION ================= */
app.use(session({
  secret: "k3_dashboard_secret",
  resave: false,
  saveUninitialized: false
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

/* ================= DISCORD LOGIN ================= */
passport.use(new DiscordStrategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ["identify", "guilds"]
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(passport.initialize());
app.use(passport.session());

/* ================= CHECK DEV ================= */
function checkDev(req, res, next) {
  if (!req.user) return res.redirect("/");

  if (!DEVELOPERS.includes(req.user.id)) {
    return res.send("❌ Dev only panel");
  }

  next();
}

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.send(`<h1>🤖 Bot Dashboard</h1><a href="/login">Login</a>`);
});

/* ================= LOGIN ================= */
app.get("/login", passport.authenticate("discord"));

app.get("/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => res.redirect("/dashboard")
);

/* ================= DASHBOARD ================= */
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");

  let html = `<h1>
