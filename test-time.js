const d = new Date();
const str = d.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
console.log('toLocaleString:', str);

// Simulate Vercel's UTC environment by forcing the Date constructor in UTC? We can't force Node timezone easily without env vars, but we can set process.env.TZ = 'UTC'
process.env.TZ = 'UTC';
const utcDate = new Date(str);
console.log('Parsed in UTC env:', utcDate.toISOString());
console.log('Hours in UTC env:', utcDate.getHours());
console.log('Minutes in UTC env:', utcDate.getMinutes());
console.log('Day in UTC env:', utcDate.getDay());
