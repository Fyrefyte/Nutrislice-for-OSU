// Example dataset
let foods = [];

// Load the menu data from Express server
fetch("/api/menu")
  .then(res => res.json())
  .then(data => {
    // Parse numeric fields (they come in as strings from CSV)
    foods = data.map(item => ({
      name: item.name,
      calories: parseFloat(item.calories) || 0,
      protein: parseFloat(item.protein) || 0,
      carbs: parseFloat(item.carbs) || 0,
      total_fat: parseFloat(item.total_fat) || 0,
      sodium: parseFloat(item.sodium) || 0,
      ingredients: item.ingredients || ""
    }));
    displayFoods(foods); // show all by default
  })
  .catch(err => {
    console.error("Error loading menu data:", err);
  });


// --- Filter functions ---
function getHighProteinFoods(minProtein = 10) {
  return foods.filter(food => food.protein >= minProtein);
}

function getHighFiberFoods(minFiber = 5) {
  return foods.filter(food => food.fiber >= minFiber);
}

function getHighVitaminFoods(minVitamins = 8) {
  return foods.filter(food => food.vitamins >= minVitamins);
}

// Placeholder for sodium/fat (not in dataset)
function getLowSodiumFoods(maxSodium = 2300) {
  // No sodium data yet, return empty
  return foods.filter(food => food.sodium <= maxSodium);
}
function getLowFatFoods(maxFat = 65) {
  // No fat data yet, return empty
  return foods.filter(food => food.fat <= maxFat);
}
function getLowCalorieFoods(maxCalories = 200) {
  return foods.filter(food => food.calories <= maxCalories);
}

function sortFoodsByCalories(order = "asc") {
  return [...foods].sort((a, b) => {
    if (order === "asc") {
      return a.calories - b.calories; // lowest first
    } else {
      return b.calories - a.calories; // highest first
    }
    
  });
}
function sortFoodsByProtein(order = "asc") {
  return [...foods].sort((a, b) => {
    if (order === "asc") {
      return a.protein - b.protein;
    }
    else {
      return b.protein - a.protein;
  }
});
}
function sortFoodsByFiber(order = "asc") {
  return [...foods].sort((a, b) => {
    if (order === "asc") {
      return a.fiber - b.fiber;
    }
    else {
      return b.fiber - a.fiber;
  }
});
}
function sortFoodsBySodium(order = "asc") {
  return [...foods].sort((a, b) => {
    if (order === "asc") {
      return a.sodium - b.sodium;
    }
    else {
      return b.sodium - a.sodium;
  }
});
}

// --- Display function ---
function displayFoods(foodList) {
  const tbody = document.querySelector("#results tbody");
  tbody.innerHTML = "";

  if (foodList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No foods found</td></tr>`;
    return;
  }

  foodList.forEach(food => {
    const row = `
      <tr>
        <td>${food.name}</td>
        <td>${food.calories}</td>
        <td>${food.protein}</td>
        <td>${food.fiber}</td>
        <td>${food.vitamins}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// --- Search handler ---
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    let results = [];

    if (query.includes("protein") || query === "high protein") {
      results = getHighProteinFoods();
    } else if (query.includes("fiber") || query === "high fiber") {
      results = getHighFiberFoods();
    } else if (query.includes("vitamin") || query === "high vitamins") {
      results = getHighVitaminFoods();
    } else if (query.includes("low sodium")) {
      results = getLowSodiumFoods();
    } else if (query.includes("low fat")) {
      results = getLowFatFoods();
    } else if (query.includes("low calories")) {
        results = getLowCalorieFoods();
    } else if (query.includes("protein sort") || query.includes("high to low")) {
  results = sortFoodsByProtein("protein sorted high to low");
  } else if (query.includes("sodium sort") || query.includes("high to low")) {
  results = sortFoodsBySodium("sodium sorted high to low");
  } else if (query.includes("fiber sort") || query.includes("high to low")) {
  results = sortFoodsByFiber("fiber sorted high to low");
    } else if (query.includes("calories sort") || query.includes("high to low")) {
  results = sortFoodsByCalories("calories sorted high to low");
} 

    displayFoods(results);
  });
});
