import express from "express";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server initialized on port ${PORT}`);
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// CSV → JSON endpoint
app.get("/api/menu", (req, res) => {
  const results = [];
  const csvPath = path.join(__dirname, "public/data/all_locations_menus.csv");

  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: "Menu data not found" });
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => res.json(results))
    .on("error", (err) => res.status(500).json({ error: err.message }));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
