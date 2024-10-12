import { db } from '../../lib/firebase';
import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService'; // Adjusted import for pokeService

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app';
  const { untrustedData } = req.body;
  const state = JSON.parse(decodeURIComponent(untrustedData?.state || '{}'));

  const fid = untrustedData?.fid;
  const sessionId = state.sessionId;
  const buttonIndex = untrustedData?.buttonIndex;

  const { correctTitle, correctIndex, totalAnswered = 0, correctCount = 0, stage } = state;

  if (!fid || !sessionId) {
    console.error('Missing required FID or Session ID');
    return res.status(400).json({ error: 'Missing required FID or Session ID' });
  }

  try {
    let html;

    if (stage === 'question' && buttonIndex !== undefined) {
      // Calculate new counts for correct answers and total answered
      const newTotalAnswered = totalAnswered + 1;
      const isCorrect = buttonIndex === correctIndex;
      const newCorrectCount = correctCount + (isCorrect ? 1 : 0);

      const message = isCorrect
        ? `Correct! The answer was ${correctTitle}. You've guessed ${newCorrectCount} out of ${newTotalAnswered} correctly.`
        : `Wrong. The correct answer was ${correctTitle}. You've guessed ${newCorrectCount} out of ${newTotalAnswered} correctly.`;

      const shareText = encodeURIComponent(`I've guessed ${newCorrectCount} Pokémon correctly out of ${newTotalAnswered} questions! Can you beat my score?\n\nFrame by @aaronv.eth`);
      const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

      // Update Firebase session data with new answer counts
      const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
      const sessionSnapshot = await sessionRef.get();

      if (!sessionSnapshot.exists) {
        console.error('Game session not found for FID:', fid);
        return res.status(404).json({ error: 'Game session not found' });
      }

      // Update session with new counts
      await sessionRef.update({
        correctCount: newCorrectCount,
        totalAnswered: newTotalAnswered,
        timestamp: new Date(),
      });

      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent(message)}" />
          <meta property="fc:frame:button:1" content="Next Question" />
          <meta property="fc:frame:button:2" content="Share" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="${shareUrl}" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, totalAnswered: newTotalAnswered, correctCount: newCorrectCount, stage: 'answer' }))}" />
        </head>
        <body></body>
        </html>
      `;
    } else {
      // Fetch Pokémon data for new question
      const { pokemonName, height, weight, image, descriptionText } = await fetchPokemonData();
      const wrongAnswer = await fetchRandomPokemonNames(1, pokemonName);
      const answers = [pokemonName, wrongAnswer].sort(() => Math.random() - 0.5);
      const newCorrectIndex = answers.indexOf(pokemonName) + 1;

      // Update Firebase session data for the new question
      const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
      await sessionRef.set({
        pokemonName,
        correctIndex: newCorrectIndex,
        correctCount: 0,
        totalAnswered: 0,
        timestamp: new Date(),
      });

      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?image=${encodeURIComponent(image)}&description=${encodeURIComponent(descriptionText)}" />
          <meta property="fc:frame:button:1" content="${answers[0]}" />
          <meta property="fc:frame:button:2" content="${answers[1]}" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
          <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, correctTitle: pokemonName, correctIndex: newCorrectIndex, totalAnswered, correctCount, stage: 'question' }))}" />
        </head>
        <body></body>
        </html>
      `;
    }

    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in answer handler:', error);

    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent('An error occurred. Please try again.')}" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start-game" />
      </head>
      <body></body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}
