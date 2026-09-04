// Grundnahrungsmittel, Nährwerte pro 100 g bzw. 100 ml (Richtwerte, gerundet: Protein/Carbs/Fett/kcal)
const B=(name,p,c,f,k,unit='g',aka='')=>({name,p,c,f,kcal:k,unit,aka,basic:true});
export const BASICS=[
 // Eier & Milch
 B('Ei (Hühnerei)',13,1.1,11,155,'g','Eier Huhn Hühnerei gekocht Spiegelei Rührei'),B('Eiklar',11,0.7,0.2,48,'g','Eiweiß'),B('Eigelb',16,3.6,32,352),
 B('Milch 1,5 %',3.4,4.9,1.5,47,'ml','fettarm'),B('Milch 3,5 %',3.3,4.8,3.5,64,'ml','Vollmilch'),B('Buttermilch',3.5,4,0.5,35,'ml'),
 B('Magerquark',12,4,0.2,67),B('Speisequark 20 %',12,3,5,105),B('Skyr natur',11,4,0.2,63),B('Hüttenkäse',12,3,4,98,'g','Körniger Frischkäse'),
 B('Griechischer Joghurt 10 %',5,4,10,130),B('Joghurt natur 1,5 %',4,4.5,1.5,48),B('Joghurt natur 3,5 %',4,4.5,3.5,64),
 B('Gouda',25,0,28,356,'g','Käse'),B('Emmentaler',29,0,30,382,'g','Käse'),B('Mozzarella',18,1,20,253),B('Feta',17,1,21,264),B('Parmesan',33,0,28,392),B('Frischkäse',6,3,24,250),B('Harzer Käse',30,0,0.7,125),
 B('Butter',0.7,0.6,83,742),B('Sahne 30 %',2.4,3.2,30,290,'ml','Schlagsahne'),B('Whey Protein (Pulver)',75,6,5,380,'g','Eiweißpulver Proteinpulver Shake'),
 // Fleisch & Fisch
 B('Hähnchenbrust roh',23,0,1.5,110,'g','Huhn Hühnchen Geflügel'),B('Putenbrust roh',24,0,1,105,'g','Pute Truthahn'),B('Hähnchenschenkel mit Haut',18,0,12,180,'g','Huhn'),
 B('Rinderhackfleisch 20 %',19,0,20,260,'g','Hack Rind Hackfleisch'),B('Rinderhackfleisch 5 %',21,0,5,130,'g','mager Tatar'),B('Rindersteak roh',22,0,4,125,'g','Rind Steak Filet'),
 B('Schweinefilet roh',22,0,2,107,'g','Schwein'),B('Schweineschnitzel roh',22,0,3,115),B('Gemischtes Hack',18,0,22,270,'g','Hackfleisch'),
 B('Lachs roh',20,0,13,200,'g','Fisch'),B('Thunfisch (Dose, Wasser)',24,0,1,105,'g','Fisch Tuna'),B('Thunfisch (Dose, Öl)',25,0,9,190),B('Kabeljau',17,0,0.7,80,'g','Fisch Seelachs'),B('Garnelen',20,0,1,90,'g','Shrimps'),
 B('Bacon',13,0,40,420,'g','Speck Frühstücksspeck'),B('Schinken gekocht',20,1,3,110,'g','Kochschinken'),B('Salami',24,0,32,390),B('Putenbrust Aufschnitt',21,1,1.5,100),
 // Kohlenhydrate
 B('Haferflocken',13,59,7,370,'g','Hafer Oats Porridge'),B('Reis roh',7,78,0.6,350,'g','Basmati Jasmin'),B('Reis gekocht',2.5,28,0.3,130,'g','Basmati Jasmin'),
 B('Vollkornreis roh',7.5,74,2.2,350,'g','Naturreis brauner Reis'),B('Nudeln roh',13,72,1.5,355,'g','Pasta Spaghetti'),B('Nudeln gekocht',5,27,0.9,140,'g','Pasta Spaghetti'),
 B('Vollkornnudeln roh',13,62,2.5,340,'g','Pasta'),B('Kartoffeln gekocht',2,15,0.1,70,'g','Erdapfel'),B('Süßkartoffel gekocht',1.5,20,0.1,86),B('Pommes frites',3,35,14,280),
 B('Vollkornbrot',7,40,1.5,210,'g','Brot'),B('Weißbrot / Toast',8,50,3,260,'g','Toastbrot Brot'),B('Brötchen',9,52,2,270,'g','Semmel Weckle'),B('Wrap / Tortilla',8,50,7,300),B('Reiswaffel',8,80,3,380),
 B('Couscous roh',13,72,2,360),B('Quinoa roh',14,64,6,370),B('Bulgur roh',12,68,1.5,340),B('Müsli',10,60,8,360,'g','Granola'),B('Cornflakes',7,84,1,370),
 B('Linsen roh',24,50,1.5,320,'g','Hülsenfrüchte'),B('Kichererbsen (Dose)',7,15,2.5,120,'g','Hülsenfrüchte'),B('Kidneybohnen (Dose)',8,15,0.5,95,'g','Bohnen'),B('Tofu',12,1,7,120,'g','Soja'),
 // Obst & Gemüse
 B('Banane',1.2,20,0.3,89,'g','Obst'),B('Apfel',0.3,12,0.2,52,'g','Obst'),B('Beeren gemischt',1,8,0.4,45,'g','Himbeeren Heidelbeeren Erdbeeren Blaubeeren'),B('Orange',1,9,0.2,47),B('Weintrauben',0.7,16,0.2,70),B('Mango',0.6,13,0.4,60),
 B('Avocado',2,2,15,160),B('Brokkoli',3,3,0.3,34,'g','Gemüse'),B('Spinat',3,1,0.3,23,'g','Gemüse'),B('Paprika',1,5,0.3,28),B('Tomate',1,3,0.2,18),B('Gurke',0.6,2,0.1,12),B('Karotte',1,7,0.2,36,'g','Möhre'),B('Zucchini',1.5,2,0.3,19),B('Salat gemischt',1.5,2,0.2,17),B('Erbsen',5,12,0.4,80),B('Mais (Dose)',3,15,1.5,85),
 // Fette & Snacks
 B('Olivenöl',0,0,100,884,'ml','Öl'),B('Rapsöl',0,0,100,884,'ml','Öl'),B('Erdnussbutter',25,12,50,600,'g','Peanut Butter'),B('Mandeln',21,6,53,600,'g','Nüsse'),B('Walnüsse',15,6,65,690,'g','Nüsse'),B('Cashews',18,30,44,570,'g','Nüsse'),B('Erdnüsse',26,8,50,580,'g','Nüsse'),
 B('Honig',0.4,82,0,330),B('Zucker',0,100,0,400),B('Marmelade',0.5,60,0.2,250,'g','Konfitüre'),B('Nutella',6,57,31,540,'g','Nuss-Nougat-Creme'),B('Zartbitterschokolade 70 %',8,35,42,560,'g','Schokolade'),B('Vollmilchschokolade',7,55,32,540,'g','Schokolade'),
 B('Chips',6,50,32,530,'g','Kartoffelchips'),B('Proteinriegel (typisch)',30,25,10,330,'g','Riegel'),B('Cola',0,10.6,0,42,'ml','Softdrink'),B('Bier',0.5,3,0,43,'ml'),B('Orangensaft',0.7,9,0.2,45,'ml','Saft'),
];
const norm=s=>s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
// Trefferqualität: 3 = Wortanfang im Namen, 2 = Wort im Alias, 1 = Teilstring
export function score(item,q){const nq=norm(q).split(/\s+/).filter(Boolean);if(!nq.length)return 0;const name=norm(item.name),aka=norm(item.aka||''),brand=norm(item.brand||'');let s=0;
  for(const t of nq){const w=new RegExp('(^|[^a-z])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));if(w.test(name))s+=3;else if(w.test(aka)||w.test(brand))s+=2;else if(t.length>=4&&(name.includes(t)||aka.includes(t)))s+=1;else return 0}return s}
export function searchBasics(q){return BASICS.map(b=>[score(b,q),b]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,10).map(x=>x[1])}
