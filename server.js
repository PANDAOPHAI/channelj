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
    throw new Error("channels.txt not found");
  }

  const text = fs.readFileSync(FILE, "utf8")
    .replace(/^\uFEFF/, "");

  const blocks = text
    .split(/^-{10,}\s*$/m)
    .map(block => block.trim())
    .filter(Boolean);

  return blocks.map(block => {
    const get = (regex) => {
      const match = block.match(regex);
      return match ? match[1].trim() : null;
    };

    const nameMatch = block.match(
      /^Channel:\s*(.*?)\s*\(ID:\s*(\d+)\)\s*$/m
    );

    if (!nameMatch) return null;

    return {
      name: nameMatch[1].trim(),
      id: Number(nameMatch[2]),
      time: get(/^Time:\s*(.+)$/m),
      mpdUrl: get(/^MPD URL:\s*\r?\n([^\r\n]+)/m),
      hasCookie: /^Cookie:\s*$/m.test(block),
      hasLicenseUrl: /^License URL:\s*$/m.test(block),
      hasKeys: /^Keys:\s*$/m.test(block),
      hasClearKeyJson: /^ClearKey JSON:\s*$/m.test(block)
    };
  }).filter(Boolean);
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Channel API is running"
  });
});

app.get("/api/channels", (req, res) => {
  try {
    const channels = parseChannels();

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      total: channels.length,
      channels
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: "Unable to parse channels.txt"
    });
  }
});

app.get("/api/channels/count", (req, res) => {
  try {
    res.json({
      success: true,
      total: parseChannels().length
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Unable to read channel data"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
