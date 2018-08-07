exports.getClientId = (customId) => {
  let result = -1;

  for(let i=0; i<clients.length; i++) {
    if(clients[i].customId === customId) {
      result = clients[i].clientId;
      break;
    }
  }

  return result;
}