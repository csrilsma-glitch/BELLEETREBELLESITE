import jobs from './jobs.js';
// Netlify refuse les invocations URL pour les fonctions planifiées modernes.
export default async()=>{const r=await jobs.run();return new Response(r.body,{status:r.statusCode,headers:r.headers});};
export const config={schedule:'*/5 * * * *'};
