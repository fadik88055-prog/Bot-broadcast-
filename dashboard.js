const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

/* ================= FIX FETCH (NO CRASH) ================= */
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
    return res.send("❌ Developer only");
  }

  next();
}

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.send(`<h1>🤖 Dashboard</h1><a href="/login">Login</a>`);
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

  let html = `<h1>Welcome ${req.user.username}</h1>`;
  html += `<h2>Servers</h2>`;

  req.user.guilds.forEach(g => {
    html += `
      <div style="border:1px solid #ccc;margin:10px;padding:10px">
        <h3>${g.name}</h3>
        <a href="/guild/${g.id}">Open</a>
      </div>
    `;
  });

  if (DEVELOPERS.includes(req.user.id)) {
    html += `<hr><a href="/dev">🔐 Dev Panel</a>`;
  }

  res.send(html);
});

/* ================= GUILD ================= */
app.get("/guild/:id", (req, res) => {
  if (!req.user) return res.redirect("/");

  res.send(`
    <h1>Server Panel</h1>

    <form action="/broadcast/${req.params.id}">
      <input name="msg" placeholder="message"/>
      <button>Send</button>
    </form>

    <form action="/kick/${req.params.id}">
      <input name="user"/>
      <button>Kick</button>
    </form>

    <form action="/ban/${req.params.id}">
      <input name="user"/>
      <button>Ban</button>
    </form>
  `);
});

/* ================= BROADCAST ================= */
app.get("/broadcast/:id", async (req, res) => {
  if (!req.user) return res.redirect("/");

  await fetch("https://bot-broadcast-production.up.railway.app/api/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": process.env.TOKEN
    },
    body: JSON.stringify({
      guildId: req.params.id,
      message: req.query.msg
    })
  });

  res.send("📡 Broadcast sent");
});

/* ================= KICK ================= */
app.get("/kick/:id", async (req, res) => {
  if (!req.user) return res.redirect("/");

  await fetch("https://bot-broadcast-production.up.railway.app/api/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": process.env.TOKEN
    },
    body: JSON.stringify({
      guildId: req.params.id,
      action: "kick",
      userId: req.query.user
    })
  });

  res.send("👢 Kicked");
});

/* ================= BAN ================= */
app.get("/ban/:id", async (req, res) => {
  if (!req.user) return res.redirect("/");

  await fetch("https://bot-broadcast-production.up.railway.app/api/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": process.env.TOKEN
    },
    body: JSON.stringify({
      guildId: req.params.id,
      action: "ban",
      userId: req.query.user
    })
  });

  res.send("🔨 Banned");
});

/* ================= DEV PANEL ================= */
app.get("/dev", checkDev, (req, res) => {
  res.send(`
    <h1>Dev Panel</h1>

    <form action="/dev/broadcast">
      <input name="msg"/>
      <button>Send</button>
    </form>
  `);
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("Dashboard running on", PORT);
});
