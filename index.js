import express from "express";
import { Client, LogLevel } from "bloxy";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const cookie = process.env.ROBLOX_COOKIE;
const groupId = parseInt(process.env.GROUP_ID);

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASS = process.env.AUTH_PASS;

const client = new Client({
  credentials: {
    cookie: cookie
  },
  settings: {
    logLevel: LogLevel.Info,
    prompt: false
  }
});

async function startApp() {
  try {
    await client.login();
    const user = await client.getCurrentUser();
    console.log(`Logged in as ${user.name}`);
  } catch (err) {
    console.error("Failed to start app:", err);
  }
}
startApp();

function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).send("Authentication required.");
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username === AUTH_USER && password === AUTH_PASS) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).send("Access denied.");
  }
}

app.get("/ranker", basicAuth, async (req, res) => {
  const userId = parseInt(req.query.userid);
  const newRank = 100;

  if (!userId || !newRank) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  try {
    const group = await client.groups.get(groupId);
    const user = await client.users.fetch(userId);
    const member = await group.getMember(user.id);
    await member.setRank(newRank);

    res.json({ message: `User ${user.name} promoted to rank ${newRank}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rank user" });
  }
});

const listener = app.listen(process.env.PORT || 10000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
