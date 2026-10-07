export const EMERGENCY_BY_COUNTRY = {
  US: {
    police: '911',
    ambulance: '911',
    fire: '911',
    general: '911',
    embassyNote: 'Contact your embassy via state.gov for US citizens abroad.',
  },
  GB: {
    police: '999',
    ambulance: '999',
    fire: '999',
    general: '999',
    embassyNote: 'UK citizens: contact FCDO travel helpline +44 20 7008 5000.',
  },
  IN: {
    police: '100',
    ambulance: '102',
    fire: '101',
    general: '112',
    embassyNote: 'Tourist helpline: 1363 (India).',
  },
  FR: {
    police: '17',
    ambulance: '15',
    fire: '18',
    general: '112',
    embassyNote: 'EU emergency number 112 works nationwide.',
  },
  DE: {
    police: '110',
    ambulance: '112',
    fire: '112',
    general: '112',
    embassyNote: 'EU emergency number 112 works nationwide.',
  },
  JP: {
    police: '110',
    ambulance: '119',
    fire: '119',
    general: '110',
    embassyNote: 'Japan Visitor Hotline: 050-3816-2787 (24/7, English).',
  },
  AU: {
    police: '000',
    ambulance: '000',
    fire: '000',
    general: '000',
    embassyNote: 'Emergency+ app recommended for remote areas.',
  },
  AE: {
    police: '999',
    ambulance: '998',
    fire: '997',
    general: '999',
    embassyNote: 'Dubai Tourism Security: 800 4438.',
  },
  CA: {
    police: '911',
    ambulance: '911',
    fire: '911',
    general: '911',
    embassyNote: '911 available in most provinces.',
  },
  SG: {
    police: '999',
    ambulance: '995',
    fire: '995',
    general: '999',
    embassyNote: 'Non-emergency police: 1800 255 0000.',
  },
  CH: {
    police: '117',
    ambulance: '144',
    fire: '118',
    general: '112',
    embassyNote: '112 works for general EU-style emergencies.',
  },
  ES: {
    police: '091',
    ambulance: '112',
    fire: '112',
    general: '112',
    embassyNote: 'EU emergency number 112 works nationwide.',
  },
  IT: {
    police: '113',
    ambulance: '118',
    fire: '115',
    general: '112',
    embassyNote: 'EU emergency number 112 works nationwide.',
  },
  TH: {
    police: '191',
    ambulance: '1669',
    fire: '199',
    general: '191',
    embassyNote: 'Tourist police: 1155.',
  },
};

export const PLUG_BY_COUNTRY = {
  US: 'Type A/B (120V)',
  GB: 'Type G (230V)',
  IN: 'Type C/D/M (230V)',
  FR: 'Type C/E (230V)',
  DE: 'Type C/F (230V)',
  JP: 'Type A/B (100V)',
  AU: 'Type I (230V)',
  AE: 'Type G (230V)',
  CA: 'Type A/B (120V)',
  SG: 'Type G (230V)',
  CH: 'Type C/J (230V)',
  ES: 'Type C/F (230V)',
  IT: 'Type C/F/L (230V)',
  TH: 'Type A/B/C/O (220V)',
};

export const LANGUAGE_BY_COUNTRY = {
  US: 'English',
  GB: 'English',
  IN: 'Hindi, English (widely spoken)',
  FR: 'French',
  DE: 'German',
  JP: 'Japanese',
  AU: 'English',
  AE: 'Arabic (English common in cities)',
  CA: 'English, French',
  SG: 'English, Mandarin, Malay, Tamil',
  CH: 'German, French, Italian, Romansh',
  ES: 'Spanish',
  IT: 'Italian',
  TH: 'Thai',
};

export const CURRENCY_BY_COUNTRY = {
  US: 'USD', GB: 'GBP', IN: 'INR', FR: 'EUR', DE: 'EUR',
  JP: 'JPY', AU: 'AUD', AE: 'AED', CA: 'CAD', SG: 'SGD',
  CH: 'CHF', ES: 'EUR', IT: 'EUR', TH: 'THB',
};

export function getEmergencyInfo(countryCode) {
  const code = countryCode?.toUpperCase();
  return (
    EMERGENCY_BY_COUNTRY[code] || {
      police: '112',
      ambulance: '112',
      fire: '112',
      general: '112',
      embassyNote: 'Dial 112 in most countries for general emergencies.',
    }
  );
}
