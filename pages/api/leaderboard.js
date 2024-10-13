import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Leaderboard API accessed');

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

    // Fetch all FIDs in the leaderboard collection
    const leaderboardSnapshot = await db.collection('leaderboard').get();

    let topPlayers = [];

    // Loop through each FID document to get the sessions sub-collection
    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;

      // Get all sessions for the current FID
      const sessionsRef = db.collection('leaderboard').doc(fid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();

      // Aggregate session data (correctCount, totalAnswered, etc.)
      let totalCorrect = 0;
      let totalAnswered = 0;

      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        totalCorrect += sessionData.correctCount || 0;
        totalAnswered += sessionData.totalAnswered || 0;
      });

      if (totalAnswered > 0) {
        topPlayers.push({
          username: doc.data().username, // assuming username is stored in the root document
          totalCorrect,
          totalAnswered,
        });
      }
    }

    // Sort the players by correctCount in descending order and limit to top 10
    topPlayers.sort((a, b) => b.totalCorrect - a.totalCorrect);
    topPlayers = topPlayers.slice(0, 10);

    // If no players are found, return a default "No entries yet" message
    if (topPlayers.length === 0) {
      console.log('No leaderboard entries found');
      const html = `
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://example.com/no-entries.png" />
        </head>
        <body>
          <h1>Top 10 Leaderboard</h1>
          <p>No entries yet</p>
        </body>
        </html>
      `;
      return res.status(200).send(html);
    }

    // Prepare the OG image for the leaderboard with the top 10 players
    const leaderboardHTML = topPlayers.map((player, index) => `
      <p>${index + 1}. ${player.username}: ${player.totalCorrect} correct answers out of ${player.totalAnswered}</p>
    `).join('');

    // Add share button
    const shareText = encodeURIComponent(`Check out the Top 10 Pokémon Guessers!\n\nFrame by @aaronv.eth`);
    const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

    const html = `
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/leaderboardOG" />
        <meta property="fc:frame:button:1" content="Play Game" />
        <meta property="fc:frame:button:1:post_url" content="${baseUrl}/api/start-game" />
        <meta property="fc:frame:button:2" content="Share Leaderboard" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${shareLink}" />
      </head>
      <body>
        <h1>Top 10 Pokémon Guessers</h1>
        ${leaderboardHTML}
      </body>
      </html>
    `;

    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
