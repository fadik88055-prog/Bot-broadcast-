const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= DEVELOPERS ================= */
const DEVELOPERS = [
  "PUT_YOUR_DISCORD_ID_HERE"
];

/* ================= DISCORD APP ================= */
const config = {
  clientID: "PUT_CLIENT_ID",
  clientSecret: "PUT_CLIENT_SECRET",
  callbackURL: "https://YOUR-RAILWAY-URL/callback"
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

/* ================= DASHBOARD (PUBLIC) ================= */
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");

  let html = `<h1>👋 Welcome ${req.user.username}</h1>`;
  html += `<h2>🤖 Bot Servers</h2>`;

  req.user.guilds.forEach(g => {
    html += `
      <div style="border:1px solid #ccc;padding:10px;margin:10px">
        <h3>${g.name}</h3>
        <a href="/guild/${g.id}">⚙ Open</a>
      </div>
    `;
  });

  // زر لوحة المطورين (فقط للمطور)
  if (DEVELOPERS.includes(req.user.id)) {
    html += `<hr><a href="/dev">🔐 Developer Panel</a>`;
  }

  res.send(html);
});

/* ================= GUILD PAGE ================= */
app.get("/guild/:id", (req, res) => {
  if (!req.user) return res.redirect("/");

  res.send(`
    <h1>⚙ Server Panel</h1>
    <p><b>Guild ID:</b> ${req.params.id}</p>

    <hr>

    <h2>📢 Broadcast (Demo)</h2>
    <form action="/broadcast/${req.params.id}">
      <input name="msg" placeholder="Message" style="width:300px"/>
      <select name="type">
        <option value="all">All</option>
        <option value="online">Online</option>
      </select>
      <button>Send</button>
    </form>

    <hr>

    <h2>🛠 Actions</h2>
    <button onclick="alert('Soon')">Ban User</button>
    <button onclick="alert('Soon')">Mute User</button>
  `);
});

/* ================= BROADCAST (DEMO) ================= */
app.get("/broadcast/:id", (req, res) => {
  if (!req.user) return res.redirect("/");

  const msg = req.query.msg;
  const type = req.query.type;

  res.send(`
    <h3>📡 Broadcast Sent (Demo)</h3>
    <p>Message: ${msg}</p>
    <p>Type: ${type}</p>
    <p>⚠ يحتاج ربط فعلي مع البوت API</p>
  `);
});

/* ================= DEV PANEL ================= */
app.get("/dev", (req, res) => {
  if (!req.user) return res
