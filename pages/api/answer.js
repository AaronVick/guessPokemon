import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { untrustedData } = req.body;
  const state = JSON.parse(decodeURIComponent(untrustedData?.state || '{}'));
  const { sessionId, correctIndex } = state;
  const selectedButton = untrustedData.buttonIndex;
  const fid = untrustedData?.fid;

  if (!sessionId || !fid || typeof selectedButton === 'undefined') {
    return res.status(400).json({ error: 'Missing required data' });
  }

  const sessionRef = db.collection('leaderboard').doc(fid.toString()).collection('sessions').doc(sessionId);
  const sessionSnapshot = await sessionRef.get();
  
  if (!sessionSnapshot.exists) {
    return res.status(404).json({ error: 'Game session not found' });
  }

  const sessionData = sessionSnapshot.data();
  const isCorrect = selectedButton === correctIndex;
  const newCorrectCount = isCorrect ? sessionData.correctCount + 1 : sessionData.correctCount;
  const newTotalAnswered = sessionData.totalAnswered + 1;

  await sessionRef.update({
    correctCount: newCorrectCount,
    totalAnswered: newTotalAnswered,
    timestamp: new Date(),
  });

  const message = isCorrect ? 'Correct!' : `Wrong. The correct answer was ${state.correctTitle}.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/answerOG?message=${encodeURIComponent(message)}&correctCount=${newCorrectCount}&totalAnswered=${newTotalAnswered}" />
      <meta property="fc:frame:button:1" content="Next Question" />
      <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/start-game?sessionId=${sessionId}" />
    </head>
    <body></body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}