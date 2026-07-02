const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

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
    return res.send("❌ هذا الداشبورد للمطورين فقط");
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

/* ================= PUBLIC DASHBOARD ================= */
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");

  let html = `<h1>👋 Welcome ${req.user.username}</h1>`;
  html += `<h2>🤖 Bot Servers</h2>`;

  req.user.guilds.forEach(g => {
    html += `
      <div style="border:1px solid #ccc;margin:10px;padding:10px">
        <h3>${g.name}</h3>
        <a href="/guild/${g.id}">⚙ Open</a>
      </div>
    `;
  });

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

    <h3>📢 Broadcast (Demo)</h3>
    <form action="/broadcast/${req.params.id}">
      <input name="msg" placeholder="Message" style="width:300px"/>
      <button>Send</button>
    </form>

    <hr>

    <button onclick="alert('Soon')">Ban</button>
    <button onclick="alert('Soon')">Mute</button>
  `);
});

/* ================= BROADCAST (DEMO) ================= */
app.get("/broadcast/:id", (req, res) => {
  if (!req.user) return res.redirect("/");

  res.send(`
    <h3>📡 Broadcast Sent</h3>
    <p>${req.query.msg}</p>
    <p>⚠ يحتاج ربط مع البوت</p>
  `);
});

/* ================= DEV PANEL ================= */
app.get("/dev", checkDev, (req, res) => {
  res.send(`
    <h1>🔐 Developer Panel</h1>

    <form action="/dev/broadcast">
      <input name="msg" placeholder="Broadcast message" style="width:300px"/>
      <button>Send</button>
    </form>

    <form action="/dev/command">
      <input name="cmd" placeholder="Bot command" style="width:300px"/>
      <button>Run</button>
    </form>
  `);
});

/* ================= DEV ACTIONS ================= */
app.get("/dev/broadcast", checkDev, (req, res) => {
  console.log("DEV BROADCAST:", req.query.msg);
  res.send("📡 Sent to bot (needs API connect)");
});

app.get("/dev/command", checkDev, (req, res) => {
  console.log("DEV COMMAND:", req.query.cmd);
  res.send("
