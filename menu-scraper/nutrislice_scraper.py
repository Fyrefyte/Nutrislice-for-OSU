# A program for scraping the Nutrislice menu for OSU dining.
# Leo Canales and Mia Alexis Dela Cruz
# Hack OHI/O Hackathon, 25/10/2025-26/10/2025

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import csv
import time
import re
import datetime
import json
import os

# A function to wait for an error and catch the timeout if it doesn't find what it needs
def wait_for_selector_errorless(page, waiton, timeout=3000):
    try:
        page.wait_for_selector(waiton, timeout=timeout)
        return True
    except PlaywrightTimeoutError:
        return False

# Time the duration of the script
start_time = time.time()

# Configuration
menu_url = "https://osu.nutrislice.com/menu/"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_file = os.path.join(BASE_DIR, "public", "data", "all_locations_menus.csv")

menu_items = []

with sync_playwright() as p:

    # Launch browser
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Load page and wait for network to finish
    page.goto(menu_url, wait_until="networkidle")
    # page.wait_for_timeout(200)  # extra wait to allow JS rendering

    # Get a list of locations

    # Agree to EULA
    try:
        eula_button = page.wait_for_selector("button.primary", timeout=5000)
        eula_button.click()
        # page.wait_for_timeout(500)  # allow page to update
    except:
        print("No EULA modal found; continuing...")

    
    # Get a list of locations
    page.wait_for_selector("ul.grid", timeout=5000)
    location_grid = page.query_selector("ul.grid")
    location_buttons = location_grid.query_selector_all("button.content")
    print("{0} locations found, beginning scraping".format(len(location_buttons)))

    for i in range(0, len(location_buttons) - 1):

        # Return to the main menu and go again
        page.goto(menu_url, wait_until="networkidle")

        # Get the list of locations again (the page has since been refreshed)
        page.wait_for_selector("ul.grid", timeout=5000)
        location_grid = page.query_selector("ul.grid")
        location_buttons = location_grid.query_selector_all("button.content")

        # Keep track of the location in question
        location_button = location_buttons[i]
        location_name = location_button.query_selector("strong.name").inner_text().strip()

        # Go to the new website by clicking the panel
        location_button.click()

        # Wait for menu sections
        if not wait_for_selector_errorless(page, "li.menu-station", 15000):
            print("No menu found for {0}; continuing...".format(location_name))
            continue
        sections = page.query_selector_all("li.menu-station")

        for section in sections:
            try:
                # Try to find an id in a nested div (most Nutrislice sections use this pattern,
                # so in case the button isn't titled where I think it is, this will still exist)
                id_div = section.query_selector("div[id]")
                section_id = id_div.get_attribute("id") if id_div else "Unknown Section"

                # Get the button to expand the section
                toggle_button = section.query_selector("button.expansion-toggle")
                if toggle_button and "button-active" not in toggle_button.get_attribute("class"):
                    section_id = toggle_button.query_selector("span").inner_text().strip()
                    toggle_button.click()
                    # page.wait_for_timeout(500)  # wait for section to expand

                # Get expanded content
                page.wait_for_selector("div.expanded-content", timeout=500)
                expanded_content = section.query_selector("div.expanded-content")
                if not expanded_content:
                    print("No items found in section; continuing...")
                    continue

                # Retrieve all items from the expanded section
                items = expanded_content.query_selector_all("li.menu-item")
                for item in items:
                    try:
                        item.scroll_into_view_if_needed()
                        item.click()
                        # page.wait_for_timeout(500)  # wait for dialog to open

                        # Extract basic info from menu-item
                        name_el = item.query_selector(".food-name")
                        name = name_el.inner_text().strip() if name_el else "Unknown"

                        # Get allergen string from menu-item
                        allergens_el = item.query_selector(".price-and-cal .allergens")
                        allergens = allergens_el.inner_text().strip() if allergens_el else None

                        # Convert allergen string to more usable information
                        # TODO

                        # Extract detailed nutrition info from dialog
                        serving_size = calories = total_fat = saturated_fat = cholesterol = sodium = carbs = sugars = protein = ingredients = None
                        if not wait_for_selector_errorless(page, ".nutrition-ingredients"):
                            print("No nutrition facts found; continuing...")
                            close_button = page.query_selector("ns-button[matdialogclose].close-button")
                            if close_button:
                                close_button.click()
                                page.wait_for_selector(".nutrition-ingredients", state="detached", timeout=5000)
                            continue
                        nutrition_el = page.query_selector(".nutrition-ingredients") # if dialog else None
                        nutrition_text = nutrition_el.inner_text().strip() if nutrition_el else None
                        nutrition_text_full = nutrition_text
                        if nutrition_text:
                            # Extract serving size
                            match = re.search(r"Serving Size\s*([\w\d\. oz]+)", nutrition_text)
                            if match:
                                serving_size = match.group(1)
                                match = None

                            # Extract calories
                            match = re.search(r"Calories\s+(\d+)", nutrition_text)
                            if match:
                                calories = match.group(1)
                                match = None

                            # Extract total fat, protein, sugar, etc.
                            match = re.search(r"Total Fat\s*([\d\.]+g)", nutrition_text)
                            if match:
                                total_fat = match.group(1)
                                match = None

                            match = re.search(r"Protein\s*([\d\.]+g)", nutrition_text)
                            if match:
                                protein = match.group(1)
                                match = None

                            match = re.search(r"Total Carbohydrate\s*([\d\.]+g)", nutrition_text)
                            if match:
                                carbs = match.group(1)
                                match = None

                            match = re.search(r"Total Sugars\s*([\d\.]+g)", nutrition_text)
                            if match:
                                sugars = match.group(1)
                                match = None

                            # Extract ingredients
                            match = re.search(r"Ingredients:\s*(.+)", nutrition_text, flags=re.DOTALL)
                            if match:
                                ingredients = match.group(1).strip()

                        # Debug
                        print("Item {0} added to location {1} in section {2}".format(name, location_name, section_id))

                        # Add the new item to the csv
                        menu_items.append({
                            "location": location_name,
                            "section": section_id,
                            "name": name,
                            "serving_size": serving_size,
                            "calories": calories,
                            "total_fat": total_fat,
                            "protein": protein,
                            "carbs": carbs,
                            "sugars": sugars,
                            "ingredients": ingredients,
                            "raw_nutrition_text": nutrition_text_full
                        })

                        # Close dialog
                        close_button = page.query_selector("ns-button[matdialogclose].close-button")
                        if close_button:
                            close_button.click()
                            page.wait_for_selector(".nutrition-ingredients", state="detached", timeout=5000)

                    except Exception as e:
                        print(f"Failed to scrape item: {e}")
                        continue

            except Exception as e:
                print(f"Failed to process section: {e}")
                continue

    browser.close()

# Save to CSV
with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames = ["location", "section", "name", "serving_size", "calories", "total_fat", "protein", "carbs", "sugars", "ingredients", "raw_nutrition_text"])
    writer.writeheader()
    for item in menu_items:
        writer.writerow(item)

# Save as json
json_file = os.path.join(BASE_DIR, "public", "data", "all_locations_menus.json")
with open(json_file, "w", encoding="utf-8") as jf:
    json.dump(menu_items, jf, ensure_ascii=False, indent=2)


duration = time.time() - start_time

print(f"Scraping complete! {len(menu_items)} items saved to {csv_file}. Duration: {duration:.2f} seconds")
