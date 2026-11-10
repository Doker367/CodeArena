export const MAP_SVG = `<svg class="w-full h-full object-cover" fill="none" preserveaspectratio="xMidYMid slice" viewbox="0 0 1000 850" xmlns="http://www.w3.org/2000/svg">
<defs>
<lineargradient id="g-sierra" x1="0%" x2="100%" y1="0%" y2="100%">
<stop offset="0%" stop-color="#CCD9C8"></stop>
<stop offset="100%" stop-color="#BDCCB8"></stop>
</lineargradient>
<lineargradient id="g-selva" x1="0%" x2="100%" y1="0%" y2="100%">
<stop offset="0%" stop-color="#B8CFBA"></stop>
<stop offset="100%" stop-color="#9EBEA1"></stop>
</lineargradient>
<lineargradient id="g-costa" x1="0%" x2="100%" y1="0%" y2="100%">
<stop offset="0%" stop-color="#E1E5D5"></stop>
<stop offset="100%" stop-color="#CED4C0"></stop>
</lineargradient>
<lineargradient id="g-water" x1="0%" x2="100%" y1="0%" y2="100%">
<stop offset="0%" stop-color="#B7D3DF"></stop>
<stop offset="100%" stop-color="#93BED0"></stop>
</lineargradient>
<pattern height="40" id="topoGrid" patternunits="userSpaceOnUse" width="40">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(27,56,43,0.04)" stroke-width="1"></path>
</pattern>
</defs>
<!-- Background Grid -->
<rect fill="url(#topoGrid)" height="850" width="1000"></rect>
<!-- State Silhouette of Chiapas (Organic polygon representation) -->
<path d="M 180,240 
                     C 220,180 340,130 460,120 
                     C 550,110 650,140 760,200 
                     C 840,250 890,320 890,440 
                     C 890,560 830,680 730,730 
                     C 630,780 490,750 370,680 
                     C 270,620 200,530 150,440 
                     C 120,380 140,290 180,240 Z" fill="#F1F4ED" stroke="#B8C4B4" stroke-width="2"></path>
<!-- Selva Lacandona Massif (East) -->
<path d="M 620,240 C 720,260 820,330 840,430 C 850,520 780,600 690,580 C 620,560 590,440 600,340 Z" fill="url(#g-selva)" opacity="0.6"></path>
<!-- Los Altos de Chiapas Highlands (Central Core) -->
<path d="M 330,320 C 430,290 520,330 550,420 C 560,490 480,540 390,530 C 310,520 290,430 310,360 Z" fill="url(#g-sierra)" opacity="0.75"></path>
<!-- Sierra Madre de Chiapas Ridge (South Coast) -->
<path d="M 230,520 C 350,560 520,620 660,710 C 620,740 450,730 330,670 C 230,610 180,560 230,520 Z" fill="url(#g-costa)" opacity="0.7"></path>
<!-- Rio Grijalva & Canyon Cut (Blue arterial river) -->
<path d="M 240,290 Q 320,370 380,390 T 510,430 T 630,350 T 770,220" fill="none" opacity="0.85" stroke="url(#g-water)" stroke-linecap="round" stroke-width="5"></path>
<!-- Rio Usumacinta Tributaries -->
<path d="M 640,250 Q 720,300 780,380 T 820,490" fill="none" opacity="0.7" stroke="url(#g-water)" stroke-linecap="round" stroke-width="3"></path>
<!-- Pacific Ocean Coastline Indication -->
<path d="M 120,580 C 200,680 320,770 480,820" fill="none" opacity="0.25" stroke="#7BA8B8" stroke-width="14"></path>
<!-- Regional Relief Contour Rings (Los Altos) -->
<ellipse cx="440" cy="410" fill="none" rx="90" ry="60" stroke="#A7BAA2" stroke-dasharray="3 3" stroke-width="1.5"></ellipse>
<ellipse cx="440" cy="410" fill="none" rx="60" ry="40" stroke="#A7BAA2" stroke-width="1"></ellipse>
<ellipse cx="440" cy="410" fill="none" rx="30" ry="20" stroke="#A7BAA2" stroke-width="0.75"></ellipse>
<!-- Region Typography Labels embedded in Map -->
<text fill="#4B6354" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" letter-spacing="1" x="360" y="340">LOS ALTOS</text>
<text fill="#426649" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" letter-spacing="1" x="690" y="380">SELVA LACANDONA</text>
<text fill="#696D56" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" letter-spacing="1" x="440" y="690">SOCONUSCO / COSTA</text>
<text fill="#58675C" font-family="Plus Jakarta Sans" font-size="12" font-weight="600" opacity="0.8" x="210" y="330">CAÑÓN DEL SUMIDERO</text>
</svg>`;
