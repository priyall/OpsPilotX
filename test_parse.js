const logs = [
  { message: '[Alice SRE] Scanning active network ingress routes and TCP socket pools.' },
  { message: '[Ethan SRE] Querying local SRE Incident History Database' },
  { message: '[System SRE] Initiating automated investigation' },
  { message: 'Discovery: Network checks failed on matching cluster endpoints!' }
];

logs.forEach(l => {
  const match = l.message.match(/\[(Alice|Bob|Charlie|David|Ethan)\s/i);
  console.log(match ? match[1].toLowerCase() : null);
});
