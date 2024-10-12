import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';
import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log(`Received ${req.method} request to /api/start-game`);

  if (req.method !== 'GET' && req.method !== 'POST') {
    console.log(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app';
    const { fid } = req.body; // FID passed in the request
    if (!fid) {
      console.error('FID missing from request');
      return res.status(400).json({ error: 'FID is required' });
    }

    console.log(`Base URL: ${baseUrl}, FID: ${fid}`);

    // Fetch the Pokémon data
    let pokemonData, wrongPokemonName;
    try {
      pokemonData = await fetchPokemonData();
      [wrongPokemonName] = await fetchRandomPokemonNames(1, pokemonData.pokemonName);
    } catch (error) {
      console.error('Error fetching Pokémon data:', error);
      return res.status(500).json({ error: 'Failed to fetch Pokémon data' });
    }

    const { pokemonName, height, image } = pokemonData;

    console.log('Game data:', { pokemonName, height, image, wrongPokemonName });

    // Save game session to Firebase
    await db.collection('leaderboard').add({
      FID: fid,
      correctCount: 0,
      totalAnswered: 0,
      timestamp: new Date(),
    });

    const correctButtonIndex = Math.random() < 0.5 ? 1 : 2;
    const button1Content = correctButtonIndex === 1 ? pokemonName : wrongPokemonName;
    const button2Content = correctButtonIndex === 2 ? pokemonName : wrongPokemonName;

    const ogImageUrl = `${baseUrl}/api/og?` + new URLSearchParams({
      pokemonName: pokemonName || '',
      height: height || '',
      image: image || ''
    }).toString();

    const html = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${button1Content}" />
          <meta property="fc:frame:button:2" content="${button2Content}" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ correctTitle: pokemonName, correctIndex: correctButtonIndex, totalAnswered: 0, correctCount: 0, stage: 'question' }))}" />
        </head>
        <body></body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in start-game handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
