// Load locations from https://provinces.open-api.vn/api/v1/?depth=3
// Provide a lightweight cache and sync-compatible helpers used by components.

const API_URL = 'https://provinces.open-api.vn/api/v1/?depth=3';

let _cache = {
  cities: [],
  districts: {}, // cityId -> [{id,name,cityId}]
  wards: {}, // districtId -> [{id,name,districtId}]
  loaded: false,
};

let _loadPromise = null;

export const loadLocations = () => {
  if (_cache.loaded) return Promise.resolve(_cache);
  if (_loadPromise) return _loadPromise;

  _loadPromise = fetch(API_URL)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch locations');
      return res.json();
    })
    .then((data) => {
      // data is array of provinces with nested districts and wards
      const cities = [];
      const districts = {};
      const wards = {};

      data.forEach((prov) => {
        const cityId = String(prov.code);
        cities.push({ id: cityId, name: prov.name });
        if (Array.isArray(prov.districts)) {
          districts[cityId] = prov.districts.map((d) => ({
            id: String(d.code),
            name: d.name,
            cityId,
          }));

          prov.districts.forEach((d) => {
            const districtId = String(d.code);
            if (Array.isArray(d.wards)) {
              wards[districtId] = d.wards.map((w) => ({
                id: String(w.code),
                name: w.name,
                districtId,
              }));
            } else {
              wards[districtId] = [];
            }
          });
        } else {
          districts[cityId] = [];
        }
      });

      _cache = { cities, districts, wards, loaded: true };
      return _cache;
    })
    .catch((err) => {
      // keep empty cache on error
      console.error('Error loading locations:', err.message || err);
      _cache.loaded = false;
      return _cache;
    });

  return _loadPromise;
};

export const getCities = () => {
  return _cache.cities || [];
};

export const getDistrictsByCity = (cityId) => {
  return _cache.districts?.[cityId] || [];
};

export const getWardsByDistrict = (districtId) => {
  return _cache.wards?.[districtId] || [];
};

export const getCityName = (cityId) => {
  return (_cache.cities.find((c) => c.id === cityId)?.name) || '';
};

export const getDistrictName = (districtId) => {
  for (const districts of Object.values(_cache.districts || {})) {
    const district = districts.find((d) => d.id === districtId);
    if (district) return district.name;
  }
  return '';
};

export const getWardName = (wardId) => {
  for (const wards of Object.values(_cache.wards || {})) {
    const ward = wards.find((w) => w.id === wardId);
    if (ward) return ward.name;
  }
  return '';
};

// Start loading immediately in background so UI can get data quickly
loadLocations();