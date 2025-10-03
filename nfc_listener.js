const { NFC } = require('nfc-pcsc');
const nfc = new NFC();

nfc.on('reader', reader => {
  console.log(`${reader.reader.name} ready`);

  reader.on('card', async card => {
    console.log(`Card tapped: ${card.uid}`);

    try {
      const res = await fetch('http://localhost:5000/api/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: card.uid })
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Tap failed:', data.error);
      } else {
        console.log('Student tapped:', data);
      }
    } catch (err) {
      console.error('Error sending tap:', err.message);
    }
  });

  reader.on('error', err => console.error('Reader error:', err));
  reader.on('end', () => console.log(`${reader.reader.name} removed`));
});

nfc.on('error', err => {
  console.error('NFC error:', err);
});