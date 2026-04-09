const COUNTRIES_MAP = {
  uy: {
    id: 1,
    shortName: "uy",
    name: "Uruguay",
    currency: "UYU",
    locale: "es-UY",
    usdCotization: 40,
  },
  perito_uy: {
    id: 1,
    shortName: "perito_uy",
    name: "Uruguay",
    currency: "UYU",
    locale: "es-UY",
    usdCotization: 40,
  },
  ar: {
    id: 2,
    shortName: "ar",
    name: "Argentina",
    currency: "ARS",
    locale: "es-AR",
    usdCotization: 1000,
  },
  perito_ar: {
    id: 2,
    shortName: "perito_ar",
    name: "Argentina",
    currency: "ARS",
    locale: "es-AR",
    usdCotization: 1000,
  },
  br: {
    id: 3,
    shortName: "br",
    name: "Brasil",
    currency: "BRL",
    locale: "pt-BR",
    usdCotization: 5.2,
  },
  perito_br: {
    id: 3,
    shortName: "perito_br",
    name: "Brasil",
    currency: "BRL",
    locale: "pt-BR",
    usdCotization: 5.2,
  },
  cl: {
    id: 4,
    shortName: "cl",
    name: "Chile",
    currency: "CLP",
    locale: "es-CL",
    usdCotization: 950,
  },
  perito_cl: {
    id: 4,
    shortName: "perito_cl",
    name: "Chile",
    currency: "CLP",
    locale: "es-CL",
    usdCotization: 950,
  },
  py: {
    id: 5,
    shortName: "py",
    name: "Paraguay",
    currency: "PYG",
    locale: "es-PY",
    usdCotization: 7300,
  },
  perito_py: {
    id: 5,
    shortName: "perito_py",
    name: "Paraguay",
    currency: "PYG",
    locale: "es-PY",
    usdCotization: 7300,
  },
  usd: {
    id: 99,
    shortName: "usd",
    name: "United States",
    currency: "USD",
    locale: "en-US",
    usdCotization: 1,
  },
};

const getCountryConfig = (shortName) => {
  if (!shortName) return COUNTRIES_MAP["uy"];
  return COUNTRIES_MAP[shortName.toLowerCase()] || COUNTRIES_MAP["uy"];
};

module.exports = {
  COUNTRIES_MAP,
  getCountryConfig,
};
