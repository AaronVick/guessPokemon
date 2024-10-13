import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('Leaderboard API accessed');
  console.log('Request method:', req.method);

  if (req.method !== 'GET' && req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';
    console.log('Base URL:', baseUrl);

    // Fetch leaderboard data from the new API endpoint
    console.log('Fetching leaderboard data...');
    const response = await fetch(`${baseUrl}/api/leaderboardData`);
    const topPlayers = await response.json();
    console.log('Leaderboard data fetched:', topPlayers);

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

    console.log('Sending HTML response');
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in leaderboard handler:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}