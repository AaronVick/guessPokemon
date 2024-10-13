import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Leaderboard API accessed');

  if (req.method !== 'POST') {
    console.error('Method not allowed');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

    // Fetch the leaderboard data from the server-side API
    const leaderboardDataResponse = await fetch(`${baseUrl}/api/leaderboardData`);
    const leaderboardData = await leaderboardDataResponse.json();

    // Format the leaderboard as HTML
    const leaderboardHTML = leaderboardData.map((player, index) => `
      <p>${index + 1}. ${player.username}: ${player.totalCorrect} correct answers out of ${player.totalAnswered}</p>
    `).join('');

    // Add a share button
    const shareText = encodeURIComponent(`Check out the Top 10 Pokémon Guessers!\n\nFrame by @aaronv.eth`);
    const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

    // Send the HTML response with Farcaster frame properties
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

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
