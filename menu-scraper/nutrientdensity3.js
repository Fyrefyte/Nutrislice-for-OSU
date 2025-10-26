let allFoods = [];
let filteredFoods = [];
let typingTimer;
const TYPING_DELAY = 300; // milliseconds

// Fetch once when page loads
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("menu");
  container.innerHTML = "<p>Loading menu data...</p>";

  try {
    const res = await fetch("/api/menu");
    allFoods = await res.json();
    filteredFoods = allFoods;
    displayFoods(filteredFoods);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load menu data.</p>";
  }

  // Attach search input
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => handleSearch(searchInput.value), TYPING_DELAY);
  });
});

// --- Main display function ---
function displayFoods(foodList) {
  const container = document.getElementById("menu");
  if (!foodList || foodList.length === 0) {
    container.innerHTML = "<p>No items found.</p>";
    return;
  }

  // Build large HTML string once
  let html = "<table><thead><tr><th>Name</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead><tbody>";

  for (const item of foodList.slice(0, 500)) { // show first 500 for performance
    html += `
      <tr>
        <td>${item.name || "Unknown"}</td>
        <td>${item.calories || "?"}</td>
        <td>${item.protein || "?"}</td>
        <td>${item.carbs || "?"}</td>
        <td>${item.total_fat || "?"}</td>
      </tr>`;
  }

  if (foodList.length > 500) {
    html += `<tr><td colspan="5">Showing first 500 of ${foodList.length} items.</td></tr>`;
  }

  html += "</tbody></table>";
  container.innerHTML = html;
}

// --- Search + Filter handler ---
function handleSearch(query) {
  query = query.toLowerCase().trim();
  if (!query) {
    filteredFoods = allFoods;
    displayFoods(filteredFoods);
    return;
  }

  let results = [];

  if (query.includes("high protein")) {
    results = allFoods.filter(f => parseFloat(f.protein) >= 10);
  } else if (query.includes("low sodium")) {
    results = allFoods.filter(f => parseFloat(f.sodium) <= 2300);
  } else if (query.includes("low calorie")) {
    results = allFoods.filter(f => parseFloat(f.calories) <= 200);
  } else if (query.includes("high fiber")) {
    results = allFoods.filter(f => parseFloat(f.fiber) >= 5);
  } else if (query.includes("sort protein")) {
    results = [...allFoods].sort((a, b) => b.protein - a.protein);
  } else if (query.includes("sort calories")) {
    results = [...allFoods].sort((a, b) => a.calories - b.calories);
  } else {
    // Text search fallback
    results = allFoods.filter(f => f.name?.toLowerCase().includes(query));
  }

  filteredFoods = results;
  displayFoods(results);
}