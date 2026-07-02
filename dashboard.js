const express = require("express");
const passport = require("passport");
const session = require("express-session");
const DiscordStrategy = require("passport-discord").Strategy;

const app = express();

const PORT = process.env.PORT || 3000;

/* 🔐 إعدادات Discord */
const config = {
  clientID: "PUT_CLIENT_ID",
  clientSecret: "PUT_CLIENT_SECRET",
  callbackURL: "https://YOUR-RAILWAY-URL/callback"
};

/* ================= SESSION ================= */
app.use(session({
  secret: "dashboard_secret",
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

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 Bot Dashboard</h1>
    <a href="/login">Login with Discord</a>
  `);
});

/* ================= LOGIN ================= */
app.get("/login", passport.authenticate("discord"));

app.get("/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

/* ================= DASHBOARD ================= */
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");

  let html = `<h1>Welcome ${req.user.username}</h1>`;
  html += `<h2>Your Servers:</h2>`;

  req.user.guilds.forEach(g => {
    html += `
      <div style="border:1px solid #ccc;padding:10px;margin:10px">
        <h3>${g.name}</h3>
        <a href="/guild/${g.id}">Manage</a>
      </div>
    `;
  });

  res.send(html);
});

/* ================= GUILD PAGE ================= */
app.get("/guild/:id", (req, res) => {
  res.send(`
    <h1>Server Panel</h1>
    <p>Guild ID: ${req.params.id}</p>
  `);
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("Dashboard running on port", PORT);
});
