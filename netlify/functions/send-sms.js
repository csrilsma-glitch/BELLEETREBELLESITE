// Ancien endpoint de test : aucun envoi direct. Les SMS passent par les tâches transactionnelles.
exports.handler=async()=>({statusCode:410,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({error:'Endpoint de test SMS retiré'})});
