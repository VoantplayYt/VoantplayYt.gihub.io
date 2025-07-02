import express from "express";
import dotenv from "dotenv";
import noblox from "noblox.js";

dotenv.config();

console.log(`Config Loaded!`);

const app = express();
app.use(express.json());

const cookie = process.env.ROBLOX_COOKIE;

console.log(`${cookie}`);

const groupId = parseInt(process.env.GROUP_ID);

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASS = process.env.AUTH_PASS;

async function startApp() {
  try {
    await noblox.setCookie(cookie);
    const currentUser = await noblox.getCurrentUser();
    console.log(`Logged in as ${currentUser.UserName}`);
  } catch (err) {
    console.error("Failed to start app:", err);
  }
}
startApp();

function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader("WWW-Authenticate", "Basic");
    return res.status(401).send("Authentication required.");
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [username, password] = credentials.split(":");

  if (username === AUTH_USER && password === AUTH_PASS) {
    next();
  } else {
    res.setHeader("WWW-Authenticate", "Basic");
    return res.status(401).send("Access denied.");
  }
}

app.get("/ranker", basicAuth, async (req, res) => {
  const userId = parseInt(req.query.userid);
  const newRank = 100;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: "Missing or invalid user ID" });
  }

  try {
    await noblox.setRank(groupId, userId, newRank);
    res.json({ message: `User ${userId} promoted to rank ${newRank}` });
  } catch (err) {
    console.error("Failed to rank user:", err);
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 10000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
