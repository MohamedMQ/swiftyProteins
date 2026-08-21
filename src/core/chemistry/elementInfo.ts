interface ElementInfo {
  name: string;
  atomicNumber: number;
  color: string;
}

const ELEMENT_INFO: Record<string, ElementInfo> = {
  H: { name: 'Hydrogen', atomicNumber: 1, color: '#E8EAED' },
  Li: { name: 'Lithium', atomicNumber: 3, color: '#CC80FF' },
  B: { name: 'Boron', atomicNumber: 5, color: '#FFB5B5' },
  C: { name: 'Carbon', atomicNumber: 6, color: '#909090' },
  N: { name: 'Nitrogen', atomicNumber: 7, color: '#378ADD' },
  O: { name: 'Oxygen', atomicNumber: 8, color: '#E24B4A' },
  F: { name: 'Fluorine', atomicNumber: 9, color: '#90E050' },
  Na: { name: 'Sodium', atomicNumber: 11, color: '#AB5CF2' },
  Mg: { name: 'Magnesium', atomicNumber: 12, color: '#8AFF00' },
  Al: { name: 'Aluminium', atomicNumber: 13, color: '#BFA6A6' },
  Si: { name: 'Silicon', atomicNumber: 14, color: '#F0C8A0' },
  P: { name: 'Phosphorus', atomicNumber: 15, color: '#EF9F27' },
  S: { name: 'Sulfur', atomicNumber: 16, color: '#FFFF30' },
  Cl: { name: 'Chlorine', atomicNumber: 17, color: '#1FF01F' },
  K: { name: 'Potassium', atomicNumber: 19, color: '#8F40D4' },
  Ca: { name: 'Calcium', atomicNumber: 20, color: '#3DFF00' },
  Mn: { name: 'Manganese', atomicNumber: 25, color: '#9C7AC7' },
  Fe: { name: 'Iron', atomicNumber: 26, color: '#E06633' },
  Co: { name: 'Cobalt', atomicNumber: 27, color: '#F090A0' },
  Ni: { name: 'Nickel', atomicNumber: 28, color: '#50D050' },
  Cu: { name: 'Copper', atomicNumber: 29, color: '#C88033' },
  Zn: { name: 'Zinc', atomicNumber: 30, color: '#7D80B0' },
  As: { name: 'Arsenic', atomicNumber: 33, color: '#BD80E3' },
  Se: { name: 'Selenium', atomicNumber: 34, color: '#FFA100' },
  Br: { name: 'Bromine', atomicNumber: 35, color: '#A62929' },
  Mo: { name: 'Molybdenum', atomicNumber: 42, color: '#54B5B5' },
  Ag: { name: 'Silver', atomicNumber: 47, color: '#C0C0C0' },
  Cd: { name: 'Cadmium', atomicNumber: 48, color: '#FFD98F' },
  Sn: { name: 'Tin', atomicNumber: 50, color: '#668080' },
  Sb: { name: 'Antimony', atomicNumber: 51, color: '#9E63B5' },
  I: { name: 'Iodine', atomicNumber: 53, color: '#940094' },
  Ba: { name: 'Barium', atomicNumber: 56, color: '#00C900' },
  Pt: { name: 'Platinum', atomicNumber: 78, color: '#D0D0E0' },
  Au: { name: 'Gold', atomicNumber: 79, color: '#FFD123' },
  Hg: { name: 'Mercury', atomicNumber: 80, color: '#B8B8D0' },
  Pb: { name: 'Lead', atomicNumber: 82, color: '#575961' },
};

const FALLBACK_INFO: ElementInfo = { name: 'Unknown', atomicNumber: 0, color: '#8B93A0' };

export function getElementInfo(symbol: string): ElementInfo {
  return ELEMENT_INFO[symbol] ?? FALLBACK_INFO;
}
