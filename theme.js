'use strict';
const Theme = (() => {
  const key='worldforge.theme',system=matchMedia('(prefers-color-scheme: dark)');
  let preference='light';
  try{const saved=localStorage.getItem(key);if(['light','dark','system'].includes(saved))preference=saved;}catch{}
  function apply(){document.documentElement.dataset.theme=preference==='system'?(system.matches?'dark':'light'):preference;document.querySelectorAll('[data-theme-picker]').forEach(s=>s.value=preference);}
  function change(value){preference=value;try{localStorage.setItem(key,value);}catch{if(typeof notify==='function')notify('Theme applied for this session; browser settings could not be saved.');}apply();}
  function control(){const label=document.createElement('label');label.className='theme-control';label.append('Theme ');const select=document.createElement('select');select.dataset.themePicker='';select.setAttribute('aria-label','Theme');for(const value of ['light','dark','system']){const option=document.createElement('option');option.value=value;option.textContent=value[0].toUpperCase()+value.slice(1);select.append(option);}select.value=preference;select.onchange=()=>change(select.value);label.append(select);return label;}
  system.addEventListener('change',apply);window.addEventListener('storage',e=>{if(e.key===key){preference=['light','dark','system'].includes(e.newValue)?e.newValue:'light';apply();}});
  apply();document.addEventListener('DOMContentLoaded',()=>document.getElementById('appearance-setting').append(control()));
  return {control};
})();
