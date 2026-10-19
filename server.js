
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, "data.txt");

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "TXT JSON API is running",
    endpoint: "/api/data"
  });
});

app.get("/api/data", (req, res) => {
  try {
    if (!fs.existsSync(FILE)) {
      return res.status(404).json({
        error: "data.txt not found"
      });
    }

    const content = fs.readFileSync(FILE, "utf8");

    // Keep the original text structure while
    // redacting DRM key material and secrets.
    const safeContent = content
      .replace(
        /^(\s*(?:License\s*Key|Decryption\s*Key|Content\s*Key|Secret\s*Key)\s*:).*$/gim,
        "$1 [REDACTED]"
      );

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      format: "text",
      data: safeContent
    });
  } catch (error) {
    res.status(500).json({
      error: "Unable to read data file"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
