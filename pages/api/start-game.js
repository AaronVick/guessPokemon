import { fetchPokemonData, fetchRandomPokemonNames, getFarcasterProfileName } from './pokeService';
import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log(`Received ${req.method} request to /api/start-game`);

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body;
    const fid = untrustedData?.fid;
    const sessionId = req.query.sessionId;

    if (!fid || !sessionId) {
      console.error('FID and sessionId are required');
      return res.status(400).json({ error: 'FID and sessionId are required' });
    }

    console.log('Received FID:', fid);

    // Check if we already have the username for this FID
    const userRef = db.collection('leaderboard').doc(fid.toString());
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().username) {
      // If we don't have the username, fetch it from Pinata and store it
      const username = await getFarcasterProfileName(fid);
      await userRef.set({ username }, { merge: true });
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

    // Reference to the session document in Firestore
    const sessionRef = userRef.collection('sessions').doc(sessionId);

    // Check if the session already exists
    const sessionDoc = await sessionRef.get();
    let totalAnswered = 0;
    let correctCount = 0;

    if (!sessionDoc.exists) {
      // If the session doesn't exist, create it
      await sessionRef.set({
        pokemonName,
        correctIndex: correctButtonIndex,
        timestamp: new Date(),
        totalAnswered: 0,
        correctCount: 0,
      });
    } else {
      // If the session exists, update it
      const sessionData = sessionDoc.data();
      totalAnswered = sessionData.totalAnswered || 0;
      correctCount = sessionData.correctCount || 0;
      await sessionRef.update({
        pokemonName,
        correctIndex: correctButtonIndex,
        timestamp: new Date(),
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';
    
    // Properly encode the parameters for the og endpoint
    const ogImageUrl = `${baseUrl}/api/og?` + new URLSearchParams({
      pokemonName: pokemonName || '',
      height: height?.toString() || '',
      image: image || ''
    }).toString();

    // Create the game response with the question
    const html = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="${button1Content}" />
          <meta property="fc:frame:button:2" content="${button2Content}" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: correctButtonIndex, totalAnswered, correctCount, stage: 'question' }))}" />
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