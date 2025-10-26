import { execSync } from "child_process";
import { existsSync } from "fs";

// Path to your Python scraper
const PYTHON_SCRIPT = "nutrislice_scraper.py";

// Detect correct Python command for the current OS
const PYTHON_CMD = process.platform === "win32" ? "python" : "python3";

// Helper function to run shell commands and stream output
function runCommand(cmd, options = {}) {
  try {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: "inherit", ...options });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

// Step 1: Check Python availability
try {
  const version = execSync(`${PYTHON_CMD} --version`).toString().trim();
  console.log(`Detected ${version}`);
} catch {
  console.error("Python not found. Please install Python and add it to PATH.");
  process.exit(1);
}

// Step 2: Ensure Playwright is installed in this Python environment
console.log("Checking for Playwright installation...");
try {
  execSync(`${PYTHON_CMD} -m playwright --version`, { stdio: "pipe" });
  console.log("Playwright already installed.");
} catch {
  console.log("Installing Playwright...");
  runCommand(`${PYTHON_CMD} -m pip install --upgrade pip`);
  runCommand(`${PYTHON_CMD} -m pip install playwright`);
  runCommand(`${PYTHON_CMD} -m playwright install chromium`);
}

// Step 3: Run the scraper
console.log("Running Nutrislice scraper...");
try {
  runCommand(`${PYTHON_CMD} "${PYTHON_SCRIPT}"`);
  console.log("Scraper completed successfully.");
} catch (err) {
  console.error("Scraper run failed:");
  console.error(err);
  process.exit(1);
}
