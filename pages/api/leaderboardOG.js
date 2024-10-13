import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('LeaderboardOG API accessed');

  if (req.method !== 'GET') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Fetch the top 10 players from the leaderboard in Firebase
    const leaderboardRef = db.collection('leaderboard');
    const leaderboardSnapshot = await leaderboardRef.get();

    let topPlayers = [];

    // Loop through each FID document to get the sessions sub-collection
    leaderboardSnapshot.forEach((doc) => {
      const fid = doc.id;
      const data = doc.data();

      // Push each player into the topPlayers array
      topPlayers.push({
        username: data.username || 'Unknown',
        totalCorrect: data.totalCorrect || 0,
        totalAnswered: data.totalAnswered || 0,
      });
    });

    // Sort players by their totalCorrect count in descending order
    topPlayers.sort((a, b) => b.totalCorrect - a.totalCorrect);
    topPlayers = topPlayers.slice(0, 10); // Get the top 10 players

    // Prepare leaderboard HTML content
    const leaderboardHTML = topPlayers.map((player, index) => `
      <p>${index + 1}. ${player.username}: ${player.totalCorrect} correct out of ${player.totalAnswered} total</p>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://example.com/leaderboard-image.png" />
        </head>
        <body>
          <h1>Top 10 Leaderboard</h1>
          ${leaderboardHTML}
        </body>
      </html>
    `;

    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error generating leaderboard OG image:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
