import { db } from '../../lib/firebase';
import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';

export default async function handler(req, res) {
  console.log('Answer API accessed');

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body;
    console.log('Received data:', untrustedData);

    const state = JSON.parse(decodeURIComponent(untrustedData.state || '{}'));
    const fid = untrustedData?.fid;
    const sessionId = state.sessionId;
    const selectedButton = untrustedData.buttonIndex;
    const correctIndex = state.correctIndex;

    if (!fid || !sessionId || typeof selectedButton === 'undefined' || typeof correctIndex === 'undefined') {
      console.error('Missing required data:', { fid, sessionId, selectedButton, correctIndex });
      return res.status(400).json({ error: 'Missing required data' });
    }

    const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
    const sessionSnapshot = await sessionRef.get();

    if (!sessionSnapshot.exists) {
      console.error('Game session not found for FID:', fid);
      return res.status(404).json({ error: 'Game session not found' });
    }

    const sessionData = sessionSnapshot.data();
    const isCorrect = selectedButton === correctIndex;
    const newCorrectCount = isCorrect ? sessionData.correctCount + 1 : sessionData.correctCount;
    const newTotalAnswered = sessionData.totalAnswered + 1;

    console.log('New correct count:', newCorrectCount);
    console.log('New total answered:', newTotalAnswered);

    // Update session with new data
    await sessionRef.update({
      correctCount: newCorrectCount,
      totalAnswered: newTotalAnswered,
      timestamp: new Date(),
    });

    // Feedback message
    const message = isCorrect
      ? `Correct! The answer was ${state.correctTitle}. You've guessed ${newCorrectCount} out of ${newTotalAnswered} correctly.`
      : `Wrong. The correct answer was ${state.correctTitle}. You've guessed ${newCorrectCount} out of ${newTotalAnswered} correctly.`;

    // Create the share URL
    const shareText = encodeURIComponent(`I've guessed ${newCorrectCount} Pokémon correctly out of ${newTotalAnswered} questions! Can you beat my score?\n\nFrame by @aaronv.eth`);
    const shareUrl = `https://warpcast.com/~/compose?text=${shareText}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app';

    // Generate the OG image URL for answer feedback
    const ogImageUrl = `${baseUrl}/api/answerOG?message=${encodeURIComponent(message)}&correctCount=${newCorrectCount}&totalAnswered=${newTotalAnswered}`;

    // Generate the response HTML with metatags
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrl}" />
        <meta property="fc:frame:button:1" content="Next Question" />
        <meta property="fc:frame:button:1:post_url" content="${baseUrl}/api/start-game?fid=${encodeURIComponent(fid)}&sessionId=${encodeURIComponent(sessionId)}" />
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${shareUrl}" />
      </head>
      <body>
        <h1>Answer Feedback: ${message}</h1>
        <p>Correct Answers: ${newCorrectCount}</p>
        <p>Total Answered: ${newTotalAnswered}</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error in answer handler:', error);
    const errorHtml = `
      <!DOCTYPE html>
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
    return res.status(500).send(errorHtml);
  }
}
