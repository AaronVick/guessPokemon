import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';
import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Start Game API accessed');

  // Base URL for the frame
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

  // Check if the request method is POST
  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const fid = untrustedData?.fid;

    console.log('Received FID:', fid);

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'FID is required to start the game' });
    }

    try {
      // Log the FID to check if it's correct
      console.log(`Starting game for FID: ${fid}`);

      // Fetch Pokémon data
      let pokemonData, wrongPokemonName;
      try {
        pokemonData = await fetchPokemonData();
        [wrongPokemonName] = await fetchRandomPokemonNames(1, pokemonData.pokemonName);
      } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        return res.status(500).json({ error: 'Failed to fetch Pokémon data' });
      }

      const { pokemonName, height, image } = pokemonData;

      // Save game session to Firebase
      await db.collection('leaderboard').doc(fid.toString()).set({
        FID: fid,
        correctCount: 0,
        totalAnswered: 0,
        timestamp: new Date(),
      });

      // Generate buttons for guessing game
      const correctButtonIndex = Math.random() < 0.5 ? 1 : 2;
      const button1Content = correctButtonIndex === 1 ? pokemonName : wrongPokemonName;
      const button2Content = correctButtonIndex === 2 ? pokemonName : wrongPokemonName;

      // Generate image URL for the OG response
      const ogImageUrl = `${baseUrl}/api/og?` + new URLSearchParams({
        pokemonName: pokemonName || '',
        height: height || '',
        image: image || ''
      }).toString();

      // Build HTML response for the frame
      const html = `
        <!DOCTYPE html>
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
      return res.status(200).send(html);

    } catch (error) {
      console.error('Error starting the game session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    console.log(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
