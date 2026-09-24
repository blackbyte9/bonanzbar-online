import {read,json,failure} from '../server/platform.mjs';
import {publicEvents} from '../server/public-events.mjs';
export default async function handler(req,res){try{if(req.method!=='GET')return json(res,405,{error:'Methode nicht erlaubt'});const {state}=await read();return json(res,200,publicEvents(state))}catch{json(res,503,{error:'Das Veranstaltungsprogramm ist gerade nicht verfügbar. Bitte später erneut versuchen.'})}}
