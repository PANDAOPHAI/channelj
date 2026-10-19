const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, "channels.txt");

app.use(cors());

function parseChannels() {
  if (!fs.existsSync(FILE)) {
    throw new Error("channels.txt not found in project root");
  }

  const content = fs.readFileSync(FILE, "utf8")
    .replace(/^\uFEFF/, "");

  const lines = content.split(/\r?\n/);
  const channels = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const comma = line.lastIndexOf(",");
      const info = comma >= 0 ? line.slice(0, comma) : line;
      const name = comma >= 0 ? line.slice(comma + 1).trim() : "";

      const getAttr = (key) => {
        const match = info.match(
          new RegExp(`(?:^|\\s)${key}="([^"]*)"`)
        );
        return match ? match[1] : null;
      };

      current = {
        name,
        logo: getAttr("tvg-logo"),
        channelId: getAttr("tvg-id"),
        group: getAttr("group-title"),
        attributes: {}
      };

      const attrRegex = /([\w-]+)="([^"]*)"/g;
      let match;

      while ((match = attrRegex.exec(info)) !== null) {
        current.attributes[match[1]] = match[2];
      }

      continue;
    }

    if (line.startsWith("#")) continue;

    if (/^https?:\/\//i.test(line) && current) {
      current.url = line;
      channels.push(current);
      current = null;
    }
  }

  return channels;
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Channel JSON API is running"
  });
});

app.get("/api/channels", (req, res) => {
  try {
    const channels = parseChannels();

    res.set("Cache-Control", "public, max-age=60");
    res.json({
      success: true,
      total: channels.length,
      channels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/channels/count", (req, res) => {
  try {
    const channels = parseChannels();

    res.json({
      success: true,
      total: channels.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
