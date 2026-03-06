// Anomaly / Interesting Aircraft Detection
// Scans fetched aircraft for emergency squawks, military, VIP, and unusual flight profiles

import { getVipInfo } from './vip-registry.js';
import { getNearestAirport } from './airports.js';

const EMERGENCY_SQUAWKS = {
  '7500': 'HIJACK',
  '7600': 'COMMS FAILURE',
  '7700': 'EMERGENCY',
};

// Military callsign prefixes (common USAF/NATO patterns)
const MIL_PREFIXES = [
  'RCH',    // USAF strategic airlift (Reach)
  'EVAC',   // Aeromedical evacuation
  'DUKE',   // USAF C-12
  'JAKE',   // USAF
  'IRON',   // USAF tanker
  'DOOM',   // B-2 Spirit
  'TOPCAT', // US Navy
  'NAVY',   // US Navy
  'BATT',   // USAF Battle
  'FORGE',  // USAF
  'GHOST',  // Various military
  'COBRA',  // US Army
  'VIPER',  // USAF F-16
  'RAGE',   // USAF fighter
  'HAVOC',  // US Army Apache
  'BONE',   // B-1B Lancer
  'HAWK',   // Various military
  'TANGO',  // NATO
  'NATO',   // NATO AWACS
  'ASCOT',  // RAF transport
  'RAFR',   // RAF
  'CNV',    // US Navy carrier
  'GOLD',   // IDF
  'IAM',    // Italian Air Force
  'GAF',    // German Air Force
  'FAF',    // French Air Force
  'BAF',    // Belgian Air Force
  'RRR',    // Royal Air Force
  'CFC',    // Canadian Forces
];

// Private / business jet ICAO type designators
const PRIVATE_JET_TYPES = new Set([
  // Gulfstream
  'GLF2', 'GLF3', 'GLF4', 'GLF5', 'GLF6', 'G150', 'G200', 'G280', 'GLEX',
  // Bombardier
  'CL30', 'CL35', 'CL60', 'BD70', 'GL5T', 'GL7T', 'BD10',
  // Cessna Citation
  'C500', 'C510', 'C525', 'C25A', 'C25B', 'C25C', 'C550', 'C560', 'C56X',
  'C680', 'C68A', 'C700', 'C750',
  // Learjet
  'LJ24', 'LJ25', 'LJ31', 'LJ35', 'LJ40', 'LJ45', 'LJ55', 'LJ60', 'LJ70', 'LJ75',
  // Embraer
  'E35L', 'E50P', 'E55P', 'E545', 'E550',
  // Dassault Falcon
  'FA10', 'FA20', 'FA50', 'FA7X', 'FA8X', 'F900', 'F2TH', 'F6X',
  // Pilatus
  'PC12', 'PC24',
  // HondaJet / Eclipse / Cirrus
  'HDJT', 'EA50', 'SF50',
  // Hawker / Beechcraft
  'H25B', 'H25C', 'HA4T', 'BE40', 'PRM1',
  // Other bizjets
  'ASTR', 'WW24', 'SBR1', 'SBR2', 'GALX',
]);

// Military aircraft sub-type classification by ICAO type designator
const MIL_FIGHTERS = new Set([
  'F16', 'F15', 'F15E', 'F18', 'FA18', 'F22', 'F35', 'F14', 'F4', 'F5',
  'F104', 'F111', 'A10', 'A4', 'AV8B',  // attack
  'EF2K', 'EUFI',  // Eurofighter Typhoon
  'RFAL',          // Dassault Rafale
  'GR4', 'TORN',   // Tornado
  'GRIP', 'JAS39', // Gripen
  'MIR2', 'M2KC',  // Mirage 2000
  'SU24', 'SU25', 'SU27', 'SU30', 'SU33', 'SU34', 'SU35', 'SU57',
  'MG29', 'MG31', 'MG35',  // MiG
  'J10', 'J11', 'J16', 'J20', 'JF17', 'JH7',
  'F2',  // Mitsubishi F-2
  'HAR', 'HARR',  // Harrier
  'S37',  // Sukhoi
]);

const MIL_HELOS = new Set([
  'AH64', 'H64',   // Apache
  'UH60', 'H60', 'S70',  // Black Hawk family
  'CH47', 'H47',   // Chinook
  'CH53', 'H53',   // Sea Stallion / Super Stallion
  'V22',           // Osprey
  'AH1', 'AH1Z',  // Cobra/Viper
  'OH58',          // Kiowa
  'MH60', 'HH60', 'SH60',  // Hawk variants
  'NH90',          // NATO Helicopter
  'MI8', 'MI17', 'MI24', 'MI28', 'MI35',  // Mil
  'KA50', 'KA52',  // Kamov
  'AS32', 'EC25', 'EC35', 'EC45', 'EC55', 'EC65',  // Eurocopter mil
  'S61', 'S65', 'S80', 'S92',  // Sikorsky
  'A109', 'A129', 'A139', 'A149', 'A189',  // AgustaWestland
  'LYNX', 'WILD',  // Wildcat
  'H135', 'H145', 'H160', 'H215', 'H225',  // Airbus Helicopters
  'B06', 'B212', 'B412', 'B429',  // Bell
  'R22', 'R44', 'R66',  // Robinson (used by some mil)
  'PUMA', 'AS33', 'SA33',  // Puma / Super Puma
  'MRH9',         // MRH-90
]);

const MIL_TRANSPORT = new Set([
  'C17', 'C130', 'C5', 'C5M', 'C27J', 'C2',  // US / NATO
  'A400', 'A40M',  // A400M Atlas
  'C160',          // Transall
  'C295',          // CASA
  'C12', 'C26',    // Beechcraft mil
  'C30J', 'L100',  // Herc variants
  'CN35',          // CN-235
  'IL76', 'AN12', 'AN22', 'AN26', 'AN30', 'AN32', 'AN70', 'AN72', 'AN124', 'AN225',
  'Y8', 'Y9', 'Y20', // Chinese
  'C1', 'C2',     // Kawasaki
  'DHC4', 'DHC5', 'DHC6',  // De Havilland mil
]);

const MIL_TANKERS = new Set([
  'KC10', 'K10', 'DC10',  // Extender
  'KC46', 'K46',           // Pegasus
  'K135', 'KC35',          // Stratotanker
  'KC30', 'A332', 'MRTT', // A330 MRTT
  'KC13',                  // KC-130
]);

const MIL_BOMBERS = new Set([
  'B1', 'B1B',    // Lancer
  'B2', 'B2A',    // Spirit
  'B52', 'B52H',  // Stratofortress
  'B21',          // Raider
  'TU95', 'TU22', 'TU160', // Russian
  'H6',           // Chinese
]);

const MIL_RECON = new Set([
  'U2', 'U2S',     // Dragon Lady
  'SR71',          // Blackbird
  'RC35', 'R135',  // Rivet Joint
  'E3', 'E3TF',   // AWACS/Sentry
  'E8', 'E8C',    // JSTARS
  'E2', 'E2C', 'E2D',  // Hawkeye
  'E6', 'E6B',    // Mercury (TACAMO)
  'P3', 'P3C',    // Orion
  'P8', 'P8A',    // Poseidon
  'EP3',           // Aries
  'E4B', 'B742',   // Nightwatch
  'E7',            // Wedgetail
  'GLEX',          // Bombardier (SIGINT variants)
  'C37', 'C40',    // VIP transport
  'GLF5', 'GLF5',  // Gulfstream (C-37)
  'RQ4', 'MQ9', 'MQ1', 'MQ4', // Drones
  'HRON',          // Heron
  'PRED',          // Predator
]);

const MIL_TRAINERS = new Set([
  'T6', 'T6A', 'T6B',   // Texan II
  'T38', 'T38A',         // Talon
  'T45', 'T45C',         // Goshawk
  'T1', 'T1A',           // Jayhawk
  'PC21',                // Pilatus
  'HAWK', 'MK67',        // BAE Hawk
  'PC7', 'PC9',          // Pilatus trainers
  'M346',                // Leonardo
  'L39', 'L159',         // Albatros / ALCA
  'YK13', 'T50',         // Korean
  'K8',                  // Chinese
  'MB33', 'MB39',        // Aermacchi
  'TUCA', 'T27',         // Tucano
  'EMB3',                // Super Tucano
]);

export function isPrivateJetType(typeDesignator) {
  if (!typeDesignator) return false;
  return PRIVATE_JET_TYPES.has(String(typeDesignator).toUpperCase());
}

/**
 * Classify a military aircraft by sub-type.
 * Returns a short label or null.
 */
function getMilSubType(ac) {
  const t = (ac.aircraft_type || '').toUpperCase();
  if (!t) {
    // Fallback: use ADS-B category if no type designator
    const cat = (ac.category || '').toUpperCase();
    if (cat === 'A7' || cat === 'B2') return 'HELO';
    if (cat === 'B4') return 'UAV';
    return null;
  }
  if (MIL_FIGHTERS.has(t)) return 'FIGHTER';
  if (MIL_HELOS.has(t)) return 'HELO';
  if (MIL_BOMBERS.has(t)) return 'BOMBER';
  if (MIL_TANKERS.has(t)) return 'TANKER';
  if (MIL_RECON.has(t)) return 'RECON';
  if (MIL_TRAINERS.has(t)) return 'TRAINER';
  if (MIL_TRANSPORT.has(t)) return 'TRANSPORT';
  // Fallback: check ADS-B category
  const cat = (ac.category || '').toUpperCase();
  if (cat === 'A7' || cat === 'B2') return 'HELO';
  if (cat === 'B4') return 'UAV';
  return null;
}

// Thresholds for "interesting" aircraft
const HIGH_ALT_FT = 45000;
const HIGH_SPEED_KTS = 600;
const HIGH_VRATE_FPM = 5000;

/**
 * Detect anomalies in an aircraft array.
 * Returns array of { aircraft, type, reason, priority }
 * Types: 'emergency', 'military', 'interesting'
 */
export function detectAnomalies(aircraft) {
  const anomalies = [];

  for (const ac of aircraft) {
    if (ac.isGhost) continue;

    // 1. Emergency squawk
    if (ac.squawk && EMERGENCY_SQUAWKS[ac.squawk]) {
      anomalies.push({
        aircraft: ac,
        type: 'emergency',
        reason: `SQUAWK ${ac.squawk} — ${EMERGENCY_SQUAWKS[ac.squawk]}`,
        priority: 0,
      });
      continue; // Don't double-list
    }

    // 2. VIP aircraft detection (BEFORE military so AF1/E-4B show as VIP, not generic MIL)
    const vipInfo = getVipInfo(ac.icao24);
    if (vipInfo) {
      let reason = `${vipInfo.owner} · ${vipInfo.aircraft}`;
      if (ac.on_ground && ac.latitude != null && ac.longitude != null) {
        const nearest = getNearestAirport(ac.latitude, ac.longitude);
        reason += nearest ? ` · GND @ ${nearest.icao}` : ' · ON GROUND';
      }
      anomalies.push({
        aircraft: ac,
        type: 'vip',
        reason,
        priority: 1,
      });
      continue;
    }

    // 3. Military detection
    // dbFlags bit 0 = military in adsb.lol data
    const isMilFlag = (ac.dbFlags & 1) !== 0;
    const isMilCallsign = ac.callsign && MIL_PREFIXES.some(p => ac.callsign.toUpperCase().startsWith(p));

    if (isMilFlag || isMilCallsign) {
      const subType = getMilSubType(ac);
      const typeTag = subType ? ` [${subType}]` : '';
      const callTag = ac.callsign ? ac.callsign : ac.aircraft_type || '';
      anomalies.push({
        aircraft: ac,
        type: 'military',
        reason: `MIL: ${callTag}${typeTag}`,
        priority: 1,
      });
      continue;
    }

    // 4. Private / business jet detection
    if (ac.aircraft_type && isPrivateJetType(ac.aircraft_type)) {
      const typeLabel = ac.aircraft_type.toUpperCase();
      const altInfo = ac.altitude_ft != null ? ` · FL${Math.round(ac.altitude_ft / 100)}` : '';
      anomalies.push({
        aircraft: ac,
        type: 'private',
        reason: `PVT: ${typeLabel}${altInfo}`,
        priority: 2,
      });
      continue;
    }

    // 5. Interesting flight profiles
    const reasons = [];

    if (ac.altitude_ft != null && ac.altitude_ft > HIGH_ALT_FT) {
      reasons.push(`ALT ${Math.round(ac.altitude_ft / 1000)}K FT`);
    }

    if (ac.speed_kts != null && ac.speed_kts > HIGH_SPEED_KTS) {
      reasons.push(`SPD ${ac.speed_kts} KTS`);
    }

    if (ac.vertical_rate_fpm != null && Math.abs(ac.vertical_rate_fpm) > HIGH_VRATE_FPM) {
      const dir = ac.vertical_rate_fpm > 0 ? 'CLIMB' : 'DESC';
      reasons.push(`${dir} ${Math.abs(Math.round(ac.vertical_rate_fpm))} FPM`);
    }

    if (reasons.length > 0) {
      anomalies.push({
        aircraft: ac,
        type: 'interesting',
        reason: reasons.join(' · '),
        priority: 2,
      });
    }
  }

  // Sort by priority (emergency first), then by callsign
  anomalies.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.aircraft.callsign || '').localeCompare(b.aircraft.callsign || '');
  });

  return anomalies;
}

const COLLAPSED_ITEMS = 8;
let expanded = false;

/**
 * Update the anomaly tracker panel DOM.
 * @param {Array} anomalies - from detectAnomalies()
 * @param {Function} onSelect - callback(aircraft) when user clicks an item
 */
export function updateAnomalyPanel(anomalies, onSelect) {
  const listEl = document.getElementById('anomaly-list');
  const countEl = document.getElementById('anomaly-count');
  if (!listEl || !countEl) return;

  countEl.textContent = anomalies.length;

  if (anomalies.length === 0) {
    listEl.innerHTML = '<div class="anomaly-empty">NO ANOMALIES DETECTED</div>';
    return;
  }

  const limit = expanded ? anomalies.length : COLLAPSED_ITEMS;
  const display = anomalies.slice(0, limit);
  listEl.innerHTML = '';

  for (const entry of display) {
    const item = document.createElement('div');
    item.className = 'anomaly-item';

    const callsign = document.createElement('span');
    callsign.className = 'anomaly-callsign';
    callsign.textContent = entry.aircraft.callsign || entry.aircraft.icao24;

    const badge = document.createElement('span');
    badge.className = `anomaly-badge ${entry.type}`;
    badge.textContent = entry.type === 'emergency' ? 'EMER'
      : entry.type === 'military' ? 'MIL'
      : entry.type === 'vip' ? 'VIP'
      : entry.type === 'private' ? 'PVT'
      : 'INTL';

    const reason = document.createElement('span');
    reason.className = 'anomaly-reason';
    reason.textContent = entry.reason;

    item.appendChild(callsign);
    item.appendChild(reason);
    item.appendChild(badge);

    item.addEventListener('click', () => {
      if (onSelect) onSelect(entry.aircraft);
    });

    listEl.appendChild(item);
  }

  // Show expand/collapse toggle when there are more than COLLAPSED_ITEMS
  if (anomalies.length > COLLAPSED_ITEMS) {
    const toggle = document.createElement('div');
    toggle.className = 'anomaly-toggle';
    if (expanded) {
      toggle.textContent = '▲ COLLAPSE';
    } else {
      toggle.textContent = `▼ +${anomalies.length - COLLAPSED_ITEMS} MORE`;
    }
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      expanded = !expanded;
      updateAnomalyPanel(anomalies, onSelect);
    });
    listEl.appendChild(toggle);
  }
}
