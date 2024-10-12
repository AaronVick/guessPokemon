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
    console.log('Received POST request to /api/start-game');

    // Try to pull FID from untrustedData
    const fid = untrustedData?.fid;
    
    if (!fid) {
      console.error('FID not provided in untrusted data');
      return res.status(400).json({ error: 'Valid FID is required' });
    }

    // Create a sessionId if not provided
    let sessionId = untrustedData?.sessionId;

    if (!sessionId) {
      sessionId = uuidv4(); // Generate a unique session ID
      console.log(`New session created with sessionId: ${sessionId}`);
      
      // Create a new session in Firestore under the user's FID
      const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
      await sessionRef.set({
        correctCount: 0,
        totalAnswered: 0,
        sessionId: sessionId,
        timestamp: new Date(),
      });
    } else {
      console.log(`Existing session used with sessionId: ${sessionId}`);
    }

    // Fetch Pokémon data for the first question
    const pokemonData = await fetchPokemonData();
    const wrongPokemonNames = await fetchRandomPokemonNames(1, pokemonData.pokemonName);

    const questionData = {
      pokemonName: pokemonData.pokemonName,
      height: pokemonData.height,
      image: pokemonData.image,
      wrongPokemonName: wrongPokemonNames[0],
    };

    console.log('Game data:', questionData);

    // Present the first question
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${questionData.image}" />
        <meta property="fc:frame:input:question" content="Guess the Pokémon's name!" />
        <meta property="fc:frame:button:1" content="${questionData.pokemonName}" />
        <meta property="fc:frame:button:2" content="${questionData.wrongPokemonName}" />
        <meta property="fc:frame:button:1:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        <meta property="fc:frame:button:2:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
        <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctIndex: 1, stage: 'question' }))}" />
      </head>
      <body>
        <h1>Guess the Pokémon!</h1>
        <img src="${questionData.image}" alt="Pokémon Image" />
        <p>Can you guess the Pokémon?</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error starting game:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
