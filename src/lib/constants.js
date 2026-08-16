import * as d3 from 'd3';

// The three encodable variables plus the two health sub-metrics.
// Labels are resolved at render time through the `vars.<key>` i18n keys.
export const VAR_META = {
  r: { key: 'r', labelKey: 'vars.r', unit: 'nW/cm²/sr', interp: d3.interpolateInferno },
  g: { key: 'g', labelKey: 'vars.g', unit: 'USD', interp: d3.interpolateViridis },
  d: { key: 'd', labelKey: 'vars.d', unit: '/100k', interp: d3.interpolateMagma },
  a: { key: 'a', labelKey: 'vars.a', unit: '/100k', interp: d3.interpolateMagma },
};

export const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

export const TEXTURES = {
  day: '/textures/earth-day-4k.jpg',
  bump: '/textures/earth-topology.png',
  spec: '/textures/earth-water.png',
  clouds: '/textures/earth-clouds.jpg',
  fallback: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
};

export const GLOBE_RADIUS = 2;
