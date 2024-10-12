import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Answer API accessed');

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { untrustedData } = req.body;
    
    // Logging incoming data
    console.log('Received data:', untrustedData);

    const fid = untrustedData?.fid;
    const sessionId = untrustedData?.sessionId; // Get session ID from the request
    const selectedButton = untrustedData?.selectedButton;
    const correctIndex = untrustedData?.correctIndex;
    const correctTitle = untrustedData?.correctTitle;

    // Ensure all required data is present
    if (!fid || !sessionId || typeof selectedButton === 'undefined' || typeof correctIndex === 'undefined') {
      console.error('Missing required data:', { fid, sessionId, selectedButton, correctIndex });
      return res.status(400).json({ error: 'Missing required data' });
    }

    console.log('Received FID:', fid);
    console.log('Received sessionId:', sessionId);
    console.log('Selected button:', selectedButton);
    console.log('Correct button index:', correctIndex);
    console.log('Correct answer title:', correctTitle);

    // Fetch the specific game session from Firebase using the sessionId
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

    // Update the specific game session in Firebase
    await sessionRef.update({
      correctCount: newCorrectCount,
      totalAnswered: newTotalAnswered,
      timestamp: new Date(), // Update timestamp with the latest interaction
    });

    // Prepare the HTML response with the result
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://some-image-url/answer-image" />
        <meta property="fc:frame:button:1" content="Play Again" />
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/start-game" />
      </head>
      <body>
        <p>${isCorrect ? 'Correct!' : 'Incorrect'} Answer: ${correctTitle}</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error in answer handler:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
