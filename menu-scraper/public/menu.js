// menu.js

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("menu");
  const searchInput = document.getElementById("search");

  // Load menu data once at startup
  let menuData = [];
  try {
    const res = await fetch("/api/menu");
    menuData = await res.json();
  } catch (err) {
    container.textContent = "Failed to load menu data.";
    console.error(err);
    return;
  }

  // --- Basic rendering function ---
  function displayMenu(data) {
    container.innerHTML = "";

    if (data.length === 0) {
      container.textContent = "No results found.";
      return;
    }

    // Build HTML table once for performance
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Location</th>
          <th>Name</th>
          <th>Calories</th>
          <th>Protein (g)</th>
          <th>Carbs (g)</th>
          <th>Sugars (g)</th>
          <th>Total Fat (g)</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (item) => `
          <tr>
            <td>${item.location || "N/A"}</td>
            <td>${item.name || "Unknown"}</td>
            <td>${item.calories || "?"}</td>
            <td>${item.protein || "?"}</td>
            <td>${item.carbs || "?"}</td>
            <td>${item.sugars || "?"}</td>
            <td>${item.total_fat || "?"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    `;
    container.appendChild(table);
  }

  // Initial display (shows everything)
  displayMenu(menuData);

  // --- Search / filter logic ---
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();

    if (!query.trim()) {
      displayMenu(menuData);
      return;
    }

    let filtered = menuData;
    let filterFound = false;

    // Keyword-based filters
    if (query.includes("high protein")) {
      filtered = filtered.filter(
        (item) => parseFloat(item.protein) >= 20
      );
      filterFound = true;
    }
    if (query.includes("low calorie")) {
      filtered = filtered.filter(
        (item) => parseFloat(item.calories) < 300
      );
      filterFound = true;
    }
    if (query.includes("low sugar")) {
      filtered = filtered.filter(
        (item) => parseFloat(item.sugars) < 10
      );
      filterFound = true;
    }
    if (!filterFound) {
      // Generic name search
      filtered = filtered.filter(
        (item) =>
          item.name && item.name.toLowerCase().includes(query)
      );
    }

    displayMenu(filtered);
  });
});
