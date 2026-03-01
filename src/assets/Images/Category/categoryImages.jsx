/*
  This is your image manifest file.
  It imports all images from this folder and exports them
  in a single 'categoryImages' object.
*/

// --- 1. Import all your category images ---
// import Beauty from "./Beauty.jpg";
import Beverages from "./Beverages.jpg";
import Books from "./Books.jpg";
// import Freezer from "./Freezer.jpg";
import Health from "./Health.jpg";
import Merch from "./Merch.jpg";
import Pantry from "./Pantry.jpg";
import Refrigerated from "./Refrigerated.jpg";
import Seasonings from "./Seasonings.jpg";
import Snacks from "./Snacks.jpg";
import Toys from "./Toys.jpg";

// --- 2. Export them in the 'categoryImages' object ---
/**
 * Map the exact categoryId (string) to its imported image.
 * The keys here MUST EXACTLY match the 'categoryId' prop
 * passed to the SubcategoryDropdown component.
 */
export const categoryImages = {
  // 'Beauty': Beauty,
  'Beverages': Beverages,
  'Books': Books,
  // 'Freezer': Freezer,
  'Health': Health,
  'Merch': Merch,
  'Pantry': Pantry,
  'Refrigerated': Refrigerated,
  'Seasonings': Seasonings,
  'Snacks': Snacks,
  'Toys': Toys,
};