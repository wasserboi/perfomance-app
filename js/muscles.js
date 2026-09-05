// Grobe Zuordnung Übung -> Muskelgruppe(n), für die Körper-Heatmap.
// Bei zusammengesetzten Übungen (z. B. Kreuzheben) wird das Volumen auf zwei Gruppen aufgeteilt.
const RULES=[
  [/deadlift|kreuzheben/i,[['Rücken',.5],['Beine',.5]]],
  [/squat|kniebeuge|hack squat|leg press|beinpresse/i,[['Beine',1]]],
  [/leg extension|leg curl|lunge|ausfallschritt|calf|wade/i,[['Beine',1]]],
  [/bench|bankdrücken|chest|brust|fly|crossover|dip|pec/i,[['Brust',1]]],
  [/row|rudern|pulldown|pullover|lat |^lat|klimmzug|pull.up|rücken|t.bar/i,[['Rücken',1]]],
  [/shrug|nacken/i,[['Rücken',.5],['Schultern',.5]]],
  [/overhead press|shoulder|schulter|military press|lateral raise|raise|delt|face pull/i,[['Schultern',1]]],
  [/curl|bizeps|bicep/i,[['Arme',1]]],
  [/triceps|trizeps|pushdown|extension \(cable/i,[['Arme',1]]],
  [/crunch|sit.up|situp|plank|bauch|core|leg raise|ab.wheel/i,[['Bauch',1]]],
];
export function classify(name){
  for(const [re,groups] of RULES)if(re.test(name))return groups;
  return [['Sonstiges',1]];
}
export const GROUPS=['Brust','Rücken','Schultern','Arme','Beine','Bauch'];

// Farbverlauf für die Heatmap: von neutral (kein Volumen) zu Akzentblau (viel Volumen)
function heatColor(t){
  t=Math.max(0,Math.min(1,t));
  const a=[45,51,59],b=[63,111,232]; // --bg3 -> --accent
  const c=a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
// Stilisiertes Körperdiagramm (kein anatomisches Abbild) mit eingefärbten Regionen je nach Wochenvolumen.
export function bodySVG(view,volumes){
  const max=Math.max(1,...Object.values(volumes));
  const col=g=>heatColor((volumes[g]||0)/max);
  const neutral='#3a414b';
  const region=(g,d)=>`<path d="${d}" fill="${col(g)}" stroke="#1c2026" stroke-width="1.5"/>`;
  const head=`<circle cx="100" cy="28" r="19" fill="${neutral}"/>`;
  if(view==='front'){
    return `<svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg">
      ${head}
      <rect x="92" y="44" width="16" height="16" fill="${neutral}"/>
      ${region('Schultern','M55,78 Q70,58 95,66 L95,90 Q70,96 52,92 Z')}
      ${region('Schultern','M145,78 Q130,58 105,66 L105,90 Q130,96 148,92 Z')}
      ${region('Brust','M62,72 Q100,62 138,72 L134,118 Q100,128 66,118 Z')}
      ${region('Arme','M42,90 Q52,88 56,96 L50,190 Q40,192 34,186 Z')}
      ${region('Arme','M158,90 Q148,88 144,96 L150,190 Q160,192 166,186 Z')}
      ${region('Bauch','M68,120 Q100,128 132,120 L128,168 Q100,176 72,168 Z')}
      ${region('Beine','M70,172 Q86,178 96,174 L92,340 Q78,346 66,338 Z')}
      ${region('Beine','M130,172 Q114,178 104,174 L108,340 Q122,346 134,338 Z')}
    </svg>`;
  }
  return `<svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg">
    ${head}
    <rect x="92" y="44" width="16" height="16" fill="${neutral}"/>
    ${region('Schultern','M55,78 Q70,58 95,66 L95,90 Q70,96 52,92 Z')}
    ${region('Schultern','M145,78 Q130,58 105,66 L105,90 Q130,96 148,92 Z')}
    ${region('Rücken','M64,72 Q100,64 136,72 L132,140 Q100,150 68,140 Z')}
    ${region('Arme','M42,90 Q52,88 56,96 L50,190 Q40,192 34,186 Z')}
    ${region('Arme','M158,90 Q148,88 144,96 L150,190 Q160,192 166,186 Z')}
    ${region('Beine','M70,172 Q86,178 96,174 L92,340 Q78,346 66,338 Z')}
    ${region('Beine','M130,172 Q114,178 104,174 L108,340 Q122,346 134,338 Z')}
  </svg>`;
}
