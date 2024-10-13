import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';
import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log(`Received ${req.method} request to /api/start-game`);

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body; // Correctly get untrustedData from the POST request
    const fid = untrustedData?.fid; // Retrieve fid directly from untrustedData
    const sessionId = untrustedData?.sessionId; // Get session ID passed from index.js

    // Ensure both fid and sessionId are passed in the request
    if (!fid || !sessionId) {
      console.error('FID and sessionId are required');
      return res.status(400).json({ error: 'FID and sessionId are required' });
    }

    // Fetch Pokémon data for the game question
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

    // Update the existing session in Firestore with new question data
    const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
    await sessionRef.update({
      pokemonName,
      correctIndex: correctButtonIndex,
      timestamp: new Date(),
    });

    // Create the game response with the question
    const html = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${image}" />
          <meta property="fc:frame:button:1" content="${button1Content}" />
          <meta property="fc:frame:button:2" content="${button2Content}" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: correctButtonIndex }))}" />
        </head>
        <body></body>
      </html>
    `;

    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error in start-game handler:', error);

    // Provide error-specific HTML to inform the user
    const errorHtml = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app'}/api/og?message=${encodeURIComponent('An error occurred. Please try again.')}" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app'}/api/start-game" />
        </head>
        <body></body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}
