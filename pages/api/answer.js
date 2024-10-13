import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Received request to /api/answer');

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { untrustedData } = req.body;
  const state = JSON.parse(decodeURIComponent(untrustedData?.state || '{}'));
  const { sessionId, correctIndex, totalAnswered, correctCount } = state;
  const selectedButton = untrustedData.buttonIndex;
  const fid = untrustedData?.fid;

  console.log('Parsed data:', { sessionId, correctIndex, selectedButton, fid, totalAnswered, correctCount });

  if (!sessionId || !fid || typeof selectedButton === 'undefined') {
    console.log('Missing required data');
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
    const sessionSnapshot = await sessionRef.get();
    
    if (!sessionSnapshot.exists) {
      console.log('Game session not found');
      return res.status(404).json({ error: 'Game session not found' });
    }

    const sessionData = sessionSnapshot.data();
    const isCorrect = selectedButton === correctIndex;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    const newTotalAnswered = totalAnswered + 1;

    await sessionRef.update({
      correctCount: newCorrectCount,
      totalAnswered: newTotalAnswered,
      timestamp: new Date(),
    });

    console.log('Updated session data:', { newCorrectCount, newTotalAnswered });

    const message = isCorrect ? 'Correct!' : `Wrong. The correct answer was ${state.correctTitle}.`;

    console.log('Answer processed:', { isCorrect, newCorrectCount, newTotalAnswered, message });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';
    const imageUrl = `${baseUrl}/api/answerOG?` + new URLSearchParams({
      message: message,
      correctCount: newCorrectCount.toString(),
      totalAnswered: newTotalAnswered.toString()
    }).toString();

    console.log('Generated image URL:', imageUrl);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:button:1" content="Next Question" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start-game?sessionId=${sessionId}" />
        <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ sessionId, totalAnswered: newTotalAnswered, correctCount: newCorrectCount }))}" />
      </head>
      <body></body>
      </html>
    `;

    console.log('Sending HTML response');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in answer handler:', error);
    const errorHtml = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app'}/api/og?message=${encodeURIComponent('An error occurred. Please try again.')}" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app'}/api/start-game" />
        </head>
        <body></body>
      </html>
    `;
    console.log('Sending error HTML response');
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}