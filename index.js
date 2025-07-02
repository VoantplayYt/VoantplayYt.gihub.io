import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;
const GROUP_ID = Number(process.env.GROUP_ID);
const TARGET_ROLE_NAME = process.env.TARGET_ROLE_NAME;
const SECRET_KEY = process.env.SECRET_KEY;

async function getRoles() {
  const res = await fetch(`https://apis.roblox.com/groups/v1/groups/${GROUP_ID}/roles`, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch roles");
  const data = await res.json();
  return data.roles;
}

async function getMembershipId(userId) {
  const res = await fetch(`https://apis.roblox.com/groups/v1/groups/${GROUP_ID}/users/${userId}`, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch membership");
  const data = await res.json();
  return data.groupMembership ? data.groupMembership.id : null;
}

async function promoteUser(membershipId, roleId) {
  const url = `https://apis.roblox.com/groups/v1/groups/${GROUP_ID}/memberships/${membershipId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to promote: ${text}`);
  }
  return await res.json();
}

app.post("/promote", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (auth !== SECRET_KEY) return res.status(403).send("Forbidden");

    const { userId } = req.body;
    if (!userId) return res.status(400).send("Missing userId");

    const membershipId = await getMembershipId(userId);
    if (!membershipId) return res.status(404).send("User not in group");

    const roles = await getRoles();
    const targetRole = roles.find(r => r.name === TARGET_ROLE_NAME);
    if (!targetRole) return res.status(404).send("Target role not found");

    await promoteUser(membershipId, targetRole.id);
    res.send(`User ${userId} promoted to role '${TARGET_ROLE_NAME}'`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error promoting user");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
