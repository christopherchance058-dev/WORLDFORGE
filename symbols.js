/* Shared, fixed SVG vocabulary. No remote fonts or icon service required. */
(function(root){
 const paths={
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  person:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3M9 15l3 4 3-4"/>',
  house:'<path d="m3 10 9-8 9 8M5 9v12h14V9M10 21v-7h4v7"/>',
  castle:'<path d="M3 21V5h3v3h3V3h6v5h3V5h3v16ZM9 21v-5a3 3 0 0 1 6 0v5"/>',
  magic:'<path d="m4 20 11-11M13 7l4 4M18 2v4M16 4h4M5 3v4M3 5h4M19 16v5M16.5 18.5h5"/>',
  beast:'<path d="m5 8-2-5 7 3h4l7-3-2 5 1 7-4 7H8l-4-7ZM7 11l3 2M17 11l-3 2M9 17l3 2 3-2"/>',
  dragon:'<path d="m3 5 7 3 5-5 2 5 5 4-6 2-2 6-6 1-5-5 6 1 2-5-5-1ZM17 9h.1"/>',
  sword:'<path d="m4 20 9-9M3 16l5 5M9 7l8-5 5 5-8 8ZM5 19l-3 3M9 7l5 8"/>',
  shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6ZM12 6v11M7 11h10"/>',
  book:'<path d="M12 5v17M12 5C8 1 3 3 2 3v16c5-1 8 0 10 3 2-3 5-4 10-3V3c-5-1-8 0-10 2Z"/>',
  scroll:'<path d="M7 3h13a3 3 0 0 1 0 6h-3V6a3 3 0 0 0-6 0v12a3 3 0 0 1-6 0v-2H2v2a3 3 0 0 0 3 3h10M8 3a3 3 0 0 0-3 3v6M14 11h6M14 15h6"/>',
  flag:'<path d="M5 22V3c5-4 9 4 15 0v12c-6 4-10-4-15 0"/>',
  mountain:'<path d="m2 21 8-17 5 9 2-4 5 12ZM7 10l3 3 3-3"/>',
  tree:'<path d="m12 2 6 7h-3l6 8h-7v5h-4v-5H3l6-8H6Z"/>',
  skull:'<path d="M7 19v3h10v-3c4-2 5-4 5-8a10 10 0 0 0-20 0c0 4 1 6 5 8ZM10 18v4M14 18v4"/><circle cx="7.5" cy="11" r="2"/><circle cx="16.5" cy="11" r="2"/><path d="m10 16 2-3 2 3"/>',
  gem:'<path d="m2 8 5-6h10l5 6-10 14ZM2 8h20M7 2l5 20 5-20"/>',
  potion:'<path d="M8 2h8M9 2v7l-6 9c-1 2 0 4 3 4h12c3 0 4-2 3-4l-6-9V2M7 14h10"/><circle cx="11" cy="18" r="1"/>',
  portal:'<ellipse cx="12" cy="12" rx="8" ry="10"/><path d="M9 6c6-2 9 7 4 11-4 3-7-2-4-4s4 2 2 2M2 12h4M18 12h4"/>',
  sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  moon:'<path d="M21 14A9 9 0 0 1 10 3 9 9 0 1 0 21 14Z"/>',
  map:'<path d="m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3ZM9 2v17M15 5v17"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',minus:'<path d="M4 12h16"/>',
  zoom:'<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7M10 7v6M7 10h6"/>',
  zoomout:'<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7M7 10h6"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v7M14 10v7"/>',
  fullscreen:'<path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6"/>',
  fit:'<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  images:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 3-3 5 5"/>',
  upload:'<path d="M12 16V2M7 7l5-5 5 5M3 15v6h18v-6"/>',
  download:'<path d="M12 2v14M7 11l5 5 5-5M3 16v5h18v-5"/>',
  back:'<path d="m10 5-7 7 7 7M3 12h18"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',
  edit:'<path d="m3 17 14-14 4 4L7 21H3ZM14 6l4 4"/>',
  up:'<path d="m5 14 7-7 7 7"/>',down:'<path d="m5 10 7 7 7-7"/>',
  save:'<path d="M4 3h13l4 4v14H3V3ZM7 3v7h10V3M7 21v-7h10v7"/>',
  hand:'<path d="M8 12V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v9c0 4-3 7-7 7-3 0-5-2-7-4l-4-6c-1-2 1-3 3-2l3 3"/>',
  link:'<path d="m10 7 3-3a5 5 0 0 1 7 7l-3 3M14 17l-3 3a5 5 0 0 1-7-7l3-3M8 16l8-8"/>',
  list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>'
 };
 const markers=['pin','person','house','castle','magic','beast','dragon','sword','shield','book','scroll','flag','mountain','tree','skull','gem','potion','portal','sun','moon'];
 const defaults=[{name:'Characters',icon:'person'},{name:'Locations',icon:'house'},{name:'History',icon:'scroll'},{name:'Factions',icon:'flag'},{name:'Magic',icon:'magic'},{name:'Bestiary',icon:'beast'}];
 const api={paths,markers,defaults,svg(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.pin}</svg>`;}};
 if(typeof module!=='undefined')module.exports=api;else root.Symbols=api;
})(globalThis);
