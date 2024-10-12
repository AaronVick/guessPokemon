import { db } from '../../lib/firebase';
import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService'; // Adjusted import

export default async function handler(req, res) {
  console.log('Start Game API accessed');
  
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body;
    console.log('Received data:', untrustedData);
    
    const fid = untrustedData.fid;

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'FID is required' });
    }

    console.log('Received FID:', fid);

    // Create a new session
    const sessionId = require('crypto').randomUUID();
    console.log('New session created with sessionId:', sessionId);

    // Get Pokémon data for the first question
    const { pokemonName, height, weight, image, descriptionText } = await fetchPokemonData();

    // Store the session data in Firebase
    const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
    await sessionRef.set({
      fid,
      sessionId,
      correctCount: 0,
      totalAnswered: 0,
      timestamp: new Date(),
    });

    console.log('Session stored in Firebase for FID:', fid);

    // Prepare to send the first question in the frame
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/og?pokemonName=${pokemonName}&height=${height}&weight=${weight}" />
        <meta property="fc:frame:button:1" content="Option 1" />
        <meta property="fc:frame:button:2" content="Option 2" />
        <meta property="fc:frame:button:3" content="Option 3" />
        <meta property="fc:frame:button:4" content="Option 4" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: Math.floor(Math.random() * 4) + 1, totalAnswered: 0, correctCount: 0, stage: 'question' }))}" />
      </head>
      <body>
        <p>Guess the Pokémon</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error in start-game handler:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
