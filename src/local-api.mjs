export const duties=['Theke','Parkplatz','Ton','Licht','Eintritt','Joker'];
export async function apiFetch(url,options={}){const r=await fetch(url,{...options,credentials:'same-origin'});if(r.status===401)window.dispatchEvent(new Event('signed-out'));return r}
