import { db } from '../../lib/firebase';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req, res) {
  console.log('Leaderboard API accessed');

  if (req.method !== 'GET') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

    // Fetch all users in the leaderboard collection
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    
    let playerStats = [];

    // Aggregate data for each player
    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;
      const userData = doc.data();
      const sessionsRef = db.collection('leaderboard').doc(fid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();

      let totalCorrect = 0;
      let totalAnswered = 0;

      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        totalCorrect += sessionData.correctCount || 0;
        totalAnswered += sessionData.totalAnswered || 0;
      });

      playerStats.push({ 
        fid, 
        username: userData.username || `User ${fid}`,
        totalCorrect, 
        totalAnswered 
      });
    }

    // Sort players by total correct answers and then by total answered
    playerStats.sort((a, b) => {
      if (b.totalCorrect !== a.totalCorrect) {
        return b.totalCorrect - a.totalCorrect;
      }
      return b.totalAnswered - a.totalAnswered;
    });

    // Get top 10 players
    const topPlayers = playerStats.slice(0, 10);

    // Create HTML response
    const html = `
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/leaderboardOG" />
        <meta property="fc:frame:button:1" content="Play Game" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start-game" />
      </head>
      <body>
        <h1>Top 10 Pokémon Guessers</h1>
        ${topPlayers.map((player, index) => `
          <p>${index + 1}. ${player.username}: ${player.totalCorrect} correct out of ${player.totalAnswered}</p>
        `).join('')}
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}