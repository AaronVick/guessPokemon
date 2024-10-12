import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';
import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log(`Received ${req.method} request to /api/start-game`);

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app';
    const fid = untrustedData?.fid; // Retrieve FID
    const sessionId = untrustedData?.sessionId; // Retrieve session ID
    
    if (!fid) {
      console.error('FID is required');
      return res.status(400).json({ error: 'FID is required' });
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

    // Randomly assign correct answer to button 1 or 2
    const correctButtonIndex = Math.random() < 0.5 ? 1 : 2;
    const button1Content = correctButtonIndex === 1 ? pokemonName : wrongPokemonName;
    const button2Content = correctButtonIndex === 2 ? pokemonName : wrongPokemonName;

    // Properly encode the parameters for the og endpoint
    const ogImageUrl = `${baseUrl}/api/og?` + new URLSearchParams({
      pokemonName: pokemonName || '',
      height: height || '',
      image: image || ''
    }).toString();

    // Update Firebase with new session info
    const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
    await sessionRef.set({
      pokemonName,
      correctIndex: correctButtonIndex,
      correctCount: 0,
      totalAnswered: 0,
      timestamp: new Date()
    });

    // Create the game response with the question
    const html = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${button1Content}" />
          <meta property="fc:frame:button:2" content="${button2Content}" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: correctButtonIndex, totalAnswered: 0, correctCount: 0, stage: 'question' }))}" />
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
