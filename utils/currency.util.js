const Distributor = require("../models/Distributor");
const { getCountryConfig } = require("./countries.util");

/**
 * Formats a given number into string based on the provided distributor's shortName.
 * @param {number} value
 * @param {string} shortName - Example: "uy", "perito_ar"
 * @returns {string|number} formatted value
 */
const formatCurrency = (value, shortName) => {
  if (value === undefined || value === null || isNaN(value)) return value;
  
  const countryConfig = getCountryConfig(shortName);

  try {
    // Usamos es-UY para forzar siempre el "punto" para los miles (ej. 1.000)
    const numberStr = new Intl.NumberFormat("es-UY", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    let symbol = "$";
    if (countryConfig.currency === "BRL") symbol = "R$";
    if (countryConfig.currency === "PYG") symbol = "₲";

    return `${symbol}${numberStr} ${countryConfig.currency}`;
  } catch (error) {
    // Fallback if currency code is invalid/unsupported
    return `${countryConfig.currency} ${value}`;
  }
};

/**
 * Retrieves the shortName for a given distributor ID.
 * @param {string} businessId 
 * @returns {Promise<string|null>}
 */
const getDistributorShortName = async (businessId) => {
  if (!businessId) return "uy";
  const distributor = await Distributor.findById(businessId).lean();
  return distributor?.country?.shortName || "uy";
};

module.exports = {
  formatCurrency,
  getDistributorShortName,
};
