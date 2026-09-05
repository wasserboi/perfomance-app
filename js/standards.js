// Grobe, allgemeine Kraftstandard-Richtwerte (1RM ÷ Körpergewicht), nicht wissenschaftlich,
// ohne Berücksichtigung von Geschlecht, Alter oder Trainingsjahren. Nur zur groben Einordnung.
export const LIFTS=[
  {key:'bench',label:'Bankdrücken',match:/bench|bankdrücken/i,tiers:[.5,.75,1,1.25,1.5]},
  {key:'squat',label:'Kniebeuge',match:/squat|kniebeuge/i,tiers:[.75,1,1.25,1.5,2]},
  {key:'deadlift',label:'Kreuzheben',match:/deadlift|kreuzheben/i,tiers:[1,1.25,1.5,2,2.5]},
  {key:'ohp',label:'Schulterdrücken',match:/overhead press|schulterdrücken|military press/i,tiers:[.35,.5,.65,.8,1]},
];
export const TIER_NAMES=['Anfänger','Fortgeschritten','Gut','Sehr gut','Elite'];
export function findLift(exerciseName){return LIFTS.find(l=>l.match.test(exerciseName))||null}
export function classifyStandard(lift,bw,brm){
  const ratio=bw>0?brm/bw:0;
  let tier=0;for(let i=0;i<lift.tiers.length;i++)if(ratio>=lift.tiers[i])tier=i+1;
  const next=lift.tiers[tier];// undefined wenn schon Elite
  return{ratio,tier,tierName:tier===0?'Unter Anfänger-Niveau':TIER_NAMES[tier-1],next,nextName:tier<TIER_NAMES.length?TIER_NAMES[tier]:null,nextKg:next?Math.round(next*bw):null};
}
