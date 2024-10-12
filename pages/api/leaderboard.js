import { db } from '../../lib/firebase';
import fetch from 'node-fetch';

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const USER_DATA_TYPES = { USERNAME: 6 };

async function getFarcasterProfileName(fid) {
  try {
    const response = await fetch(`${PINATA_HUB_API}/userDataByFid?fid=${fid}&user_data_type=${USER_DATA_TYPES.USERNAME}`);
    const data = await response.json();
    return data?.data?.userDataBody?.value || 'Unknown User';
  } catch {
    return 'Unknown User';
  }
}

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

  try {
    // Fetch leaderboard data from Firebase
    const leaderboardRef = db.collection('leaderboard');
    const snapshot = await leaderboardRef.orderBy('correctCount', 'desc').limit(10).get();

    // Check if the leaderboard is empty
    if (snapshot.empty) {
      const emptyHtml = `
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent('No players yet! Play to be the first on the leaderboard.')}" />
            <meta property="fc:frame:button:1" content="Play Game" />
            <meta property="fc:frame:button:1:post_url" content="${baseUrl}/api/start-game" />
          </head>
          <body>
            <h1>No players yet! Play to be the first on the leaderboard.</h1>
          </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(emptyHtml);
    }

    // Fetch usernames from Pinata for each player
    const topPlayers = snapshot.docs.map((doc) => doc.data());
    const leaderboardItems = await Promise.all(
      topPlayers.map(async (player) => {
        const username = await getFarcasterProfileName(player.FID);
        return `${username}: ${player.correctCount} / ${player.totalAnswered}`;
      })
    );

    // Convert leaderboard items into a string for display
    const leaderboardContent = leaderboardItems
      .map((item, index) => `${index + 1}. ${item}`)
      .join('<br>');

    // Return the HTML response with Farcaster frame meta tags
    const html = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?leaderboard=${encodeURIComponent(leaderboardContent)}" />
          <meta property="fc:frame:button:1" content="Play Game" />
          <meta property="fc:frame:button:1:post_url" content="${baseUrl}/api/start-game" />
          <meta property="fc:frame:button:2" content="Share Leaderboard" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=${encodeURIComponent('Check out the top players in the Pokémon Guessing Game!')}" />
        </head>
        <body></body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error generating leaderboard:', error);

    const errorHtml = `
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent('Error loading leaderboard.')}" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:button:1:post_url" content="${baseUrl}/api/leaderboard" />
        </head>
        <body>
          <p>Error loading leaderboard. Please try again.</p>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}
