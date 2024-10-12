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

    const fid = untrustedData?.fid;
    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'Valid FID is required' });
    }

    // Generate or use existing session ID
    let sessionId = untrustedData?.sessionId;
    if (!sessionId) {
      sessionId = uuidv4(); // Create new session ID
      console.log(`New session created with sessionId: ${sessionId}`);

      // Store session data in Firestore
      const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
      await sessionRef.set({
        correctCount: 0,
        totalAnswered: 0,
        sessionId: sessionId,
        timestamp: new Date(),
      });
    } else {
      console.log(`Using existing session with sessionId: ${sessionId}`);
    }

    // Fetch Pokémon data
    let pokemonData, wrongPokemonName;
    try {
      pokemonData = await fetchPokemonData();
      [wrongPokemonName] = await fetchRandomPokemonNames(1, pokemonData.pokemonName);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw new Error('Failed to fetch necessary data for the game');
    }

    const { pokemonName, height, image } = pokemonData;

    console.log('Game data:', { pokemonName, height, image, wrongPokemonName });

    // Randomly assign the correct answer to button 1 or 2
    const correctButtonIndex = Math.random() < 0.5 ? 1 : 2;
    const button1Content = correctButtonIndex === 1 ? pokemonName : wrongPokemonName;
    const button2Content = correctButtonIndex === 2 ? pokemonName : wrongPokemonName;

    // Create the question response HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${image}" />
          <meta property="fc:frame:input:question" content="Guess the Pokémon's name!" />
          <meta property="fc:frame:button:1" content="${button1Content}" />
          <meta property="fc:frame:button:2" content="${button2Content}" />
          <meta property="fc:frame:button:1:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
          <meta property="fc:frame:button:2:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: correctButtonIndex, totalAnswered: 0, correctCount: 0, stage: 'question' }))}" />
        </head>
        <body>
          <h1>Guess the Pokémon!</h1>
          <img src="${image}" alt="Pokémon Image" />
          <p>Can you guess the Pokémon?</p>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error starting game:', error);
    
    // Provide error-specific HTML
    const errorHtml = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/og?message=${encodeURIComponent('An error occurred. Please try again.')}" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/start-game" />
        </head>
        <body></body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}
