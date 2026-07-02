const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
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
  res.send(`
    <h1>🤖 Bot Dashboard</h1>
    <a href="/login">Login with Discord</a>
  `);
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

  let html = `<h1>👋 Welcome ${req.user.username}</h1>`;
  html += `<h2>📦 Servers</h2>`;

  req.user.guilds.forEach(g => {
    html += `
      <div style="border:1px solid #ccc;margin:10px;padding:10px">
        <h3>${g.name}</h3>
        <a href="/guild/${g.id}">Open Panel</a>
      </div>
    `;
  });

  if (DEVELOPERS.includes(req.user.id)) {
    html += `<hr><a href="/dev">🔐 Developer Panel</a>`;
  }

  res.send(html);
});

/* ================= GUILD PANEL ================= */
app.get("/guild/:id", (req, res) => {
  if (!req.user) return res.redirect("/");

  res.send(`
    <h1>⚙ Server Panel</h1>

    <p><b>Guild ID:</b> ${req.params.id}</p>

    <hr>

    <h2>📢 Broadcast</h2>
    <form action="/broadcast/${req.params.id}">
      <input name="msg" placeholder="Message"/>
      <button>Send</button>
    </form>

    <hr>

    <h2>👢 Kick User</h2>
    <form action="/kick/${req.params.id}">
      <input name="user" placeholder="User ID"/>
      <button>Kick</button>
    </form>

    <h2>🔨 Ban User</h2>
    <form action="/ban/${req.params.id}">
      <input name="user" placeholder="User ID"/>
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

  res.send("📡 Broadcast sent successfully");
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

  res.send("👢 User kicked");
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

  res.send("🔨 User banned");
});

/* ================= DEV PANEL ================= */
app.get("/dev", checkDev, (req, res) => {
  res.send(`
    <h1>🔐 Developer Panel</h1>

    <form action="/dev/broadcast">
      <input name="msg" placeholder="Message"/>
      <button>Send</button>
    </form>
  `);
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("🌐 Dashboard running on port", PORT);
});
