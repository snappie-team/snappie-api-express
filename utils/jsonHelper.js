/**
 * JSON Helper Utilities
 * Provides functions for parsing and handling JSON data, particularly for additionalInfo fields
 */

/**
 * Parse additionalInfo from string to JSON object
 * @param {string|Object} additionalInfo - The additionalInfo field to parse
 * @returns {Object|null} Parsed JSON object or null if parsing fails
 */
function parseAdditionalInfo(additionalInfo) {
  if (!additionalInfo) {
    return null;
  }
  
  // If already an object, return as is
  if (typeof additionalInfo === 'object' && additionalInfo !== null) {
    return additionalInfo;
  }
  
  // If it's a string, try to parse it
  if (typeof additionalInfo === 'string') {
    try {
      return JSON.parse(additionalInfo);
    } catch (error) {
      console.error('Error parsing additionalInfo:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Stringify additionalInfo object to JSON string
 * @param {Object} additionalInfo - The additionalInfo object to stringify
 * @returns {string|null} JSON string or null if stringify fails
 */
function stringifyAdditionalInfo(additionalInfo) {
  if (!additionalInfo) {
    return null;
  }
  
  try {
    return JSON.stringify(additionalInfo);
  } catch (error) {
    console.error('Error stringifying additionalInfo:', error);
    return null;
  }
}

/**
 * Get nested property from additionalInfo safely
 * @param {string|Object} additionalInfo - The additionalInfo field
 * @param {string} path - Dot notation path to the property
 * @param {*} defaultValue - Default value if property not found
 * @returns {*} Property value or defaultValue
 */
function getAdditionalInfoProperty(additionalInfo, path, defaultValue = null) {
  const parsed = parseAdditionalInfo(additionalInfo);
  if (!parsed) {
    return defaultValue;
  }
  
  return path.split('.').reduce((obj, key) => {
    return (obj && obj[key] !== undefined) ? obj[key] : defaultValue;
  }, parsed);
}

/**
 * Merge additionalInfo objects
 * @param {string|Object} existingInfo - Existing additionalInfo
 * @param {Object} newInfo - New additionalInfo to merge
 * @returns {string} Merged JSON string
 */
function mergeAdditionalInfo(existingInfo, newInfo) {
  const parsedExisting = parseAdditionalInfo(existingInfo) || {};
  const merged = { ...parsedExisting, ...newInfo };
  
  return stringifyAdditionalInfo(merged);
}

module.exports = {
  parseAdditionalInfo,
  stringifyAdditionalInfo,
  getAdditionalInfoProperty,
  mergeAdditionalInfo
};