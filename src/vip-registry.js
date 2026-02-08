// VIP Aircraft Registry
// Known ICAO hex codes for high-profile private jets and government aircraft.
// All hex codes are public knowledge, tracked by ADS-B Exchange and aviation communities.

const VIP_AIRCRAFT = new Map([
  // Elon Musk
  ['a835af', { owner: 'Elon Musk', aircraft: 'Gulfstream G650ER', registration: 'N628TS', note: '' }],
  ['a2ae0a', { owner: 'Elon Musk', aircraft: 'Gulfstream G550', registration: 'N272BG', note: '' }],

  // Jeff Bezos
  ['a029e0', { owner: 'Jeff Bezos', aircraft: 'Gulfstream G700', registration: 'N11AF', note: '' }],
  ['a2aa92', { owner: 'Jeff Bezos', aircraft: 'Gulfstream G650ER', registration: 'N271DV', note: '' }],

  // Bill Gates
  ['ac39d6', { owner: 'Bill Gates', aircraft: 'Gulfstream G650ER', registration: 'N887WM', note: '' }],

  // Taylor Swift
  ['a81b13', { owner: 'Taylor Swift', aircraft: 'Dassault Falcon 7X', registration: 'N621MM', note: '' }],

  // Drake
  ['aa5bc4', { owner: 'Drake', aircraft: 'Boeing 767 "Air Drake"', registration: 'N767CJ', note: '' }],

  // Mark Zuckerberg
  ['a9247d', { owner: 'Mark Zuckerberg', aircraft: 'Gulfstream G650ER', registration: 'N68885', note: '' }],

  // Oprah Winfrey
  ['a6d9e0', { owner: 'Oprah Winfrey', aircraft: 'Gulfstream G700', registration: 'N540W', note: '' }],

  // Donald Trump
  ['aa3410', { owner: 'Donald Trump', aircraft: 'Boeing 757 "Trump Force One"', registration: 'N757AF', note: '' }],

  // Kim Kardashian
  ['a18845', { owner: 'Kim Kardashian', aircraft: 'Gulfstream G650ER "Kim Air"', registration: 'N1980K', note: '' }],

  // Jay-Z & Beyoncé
  ['a55c76', { owner: 'Jay-Z & Beyoncé', aircraft: 'Bombardier Global 7500', registration: 'N44440', note: '' }],

  // Air Force One
  ['adfdf8', { owner: 'Air Force One', aircraft: 'Boeing VC-25A', registration: '82-8000', note: 'Presidential aircraft' }],
  ['adfdf9', { owner: 'Air Force One', aircraft: 'Boeing VC-25A', registration: '92-9000', note: 'Presidential aircraft' }],

  // E-4B Nightwatch ("Doomsday Plane")
  ['adfeb3', { owner: 'USSTRATCOM', aircraft: 'Boeing E-4B "Doomsday"', registration: '73-1676', note: 'Nightwatch' }],
  ['adfeb4', { owner: 'USSTRATCOM', aircraft: 'Boeing E-4B "Doomsday"', registration: '73-1677', note: 'Nightwatch' }],
  ['adfeb5', { owner: 'USSTRATCOM', aircraft: 'Boeing E-4B "Doomsday"', registration: '74-0787', note: 'Nightwatch' }],
  ['adfeb6', { owner: 'USSTRATCOM', aircraft: 'Boeing E-4B "Doomsday"', registration: '75-0125', note: 'Nightwatch' }],
]);

/**
 * Look up VIP info by ICAO24 hex code.
 * @param {string} icao24 - lowercase hex
 * @returns {{ owner: string, aircraft: string, registration: string, note: string } | null}
 */
export function getVipInfo(icao24) {
  if (!icao24) return null;
  return VIP_AIRCRAFT.get(icao24.toLowerCase()) || null;
}

export { VIP_AIRCRAFT };
