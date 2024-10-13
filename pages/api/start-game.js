import { db } from '../../lib/firebase';
import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  console.log('Start Game API accessed');

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body;
    const fid = untrustedData?.fid;

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'Valid FID is required' });
    }

    // Use existing sessionId or generate a new one
    let sessionId = untrustedData?.sessionId || uuidv4();

    console.log(`Session ID: ${sessionId}`);
    const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);

    // Check if session exists or create a new one
    const sessionSnapshot = await sessionRef.get();
    if (!sessionSnapshot.exists) {
      await sessionRef.set({
        correctCount: 0,
        totalAnswered: 0,
        sessionId,
        timestamp: new Date(),
      });
    }

    // Fetch Pokémon data
    const pokemonData = await fetchPokemonData();
    const [wrongPokemonName] = await fetchRandomPokemonNames(1, pokemonData.pokemonName);
    const { pokemonName, height, image } = pokemonData;

    console.log('Game data:', { pokemonName, height, image, wrongPokemonName });

    const correctButtonIndex = Math.random() < 0.5 ? 1 : 2;
    const button1Content = correctButtonIndex === 1 ? pokemonName : wrongPokemonName;
    const button2Content = correctButtonIndex === 2 ? pokemonName : wrongPokemonName;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${image}" />
        <meta property="fc:frame:button:1" content="${button1Content}" />
        <meta property="fc:frame:button:2" content="${button2Content}" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: correctButtonIndex, totalAnswered: 0, correctCount: 0, stage: 'question' }))}" />
        <style>
          body { display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; }
          .question-container { width: 45%; }
          .image-container { width: 45%; }
        </style>
      </head>
      <body>
        <div class="question-container">
          <h1>Guess the Pokémon's Name!</h1>
          <button>${button1Content}</button>
          <button>${button2Content}</button>
        </div>
        <div class="image-container">
          <img src="${image}" alt="${pokemonName}" width="300" />
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error in start-game handler:', error);
    res.status(500).send('Internal Server Error');
  }
}
