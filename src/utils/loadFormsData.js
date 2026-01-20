/**
 * Load all Pokemon forms data from split JSON files
 * Combines all category files into a single array
 */

// Import all form category files
import genderForms from '../data/forms/gender.json';
import alolanForms from '../data/forms/alolan.json';
import galarianForms from '../data/forms/galarian.json';
import hisuianForms from '../data/forms/hisuian.json';
import paldeanForms from '../data/forms/paldean.json';
import gmaxForms from '../data/forms/gmax.json';
import unownForms from '../data/forms/unown.json';
import otherForms from '../data/forms/other.json';
import alcremieForms from '../data/forms/alcremie.json';
import vivillonForms from '../data/forms/vivillon.json';
import alphaForms from '../data/forms/alpha.json';
import alphaotherForms from '../data/forms/alphaother.json';

/**
 * Combine all forms into a single array
 * @returns {Array} Combined forms data array
 */
function combineFormsData() {
  return [
    ...(Array.isArray(genderForms) ? genderForms : []),
    ...(Array.isArray(alolanForms) ? alolanForms : []),
    ...(Array.isArray(galarianForms) ? galarianForms : []),
    ...(Array.isArray(hisuianForms) ? hisuianForms : []),
    ...(Array.isArray(paldeanForms) ? paldeanForms : []),
    ...(Array.isArray(gmaxForms) ? gmaxForms : []),
    ...(Array.isArray(unownForms) ? unownForms : []),
    ...(Array.isArray(otherForms) ? otherForms : []),
    ...(Array.isArray(alcremieForms) ? alcremieForms : []),
    ...(Array.isArray(vivillonForms) ? vivillonForms : []),
    ...(Array.isArray(alphaForms) ? alphaForms : []),
    ...(Array.isArray(alphaotherForms) ? alphaotherForms : []),
  ];
}

// Export the combined forms data as default (for backward compatibility)
const formsData = combineFormsData();
export default formsData;

// Also export as named export for flexibility
export { formsData };
