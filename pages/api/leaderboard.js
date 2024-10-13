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

    // Fetch leaderboard data
    console.log('Fetching leaderboard data...');
    const leaderboardResponse = await fetch(`${baseUrl}/api/leaderboardData`);
    if (!leaderboardResponse.ok) {
      throw new Error(`HTTP error! status: ${leaderboardResponse.status}`);
    }
    const topPlayers = await leaderboardResponse.json();
    console.log('Leaderboard data fetched:', JSON.stringify(topPlayers));

    const ogImageUrl = `${baseUrl}/api/leaderboardOG?topPlayers=${encodeURIComponent(JSON.stringify(topPlayers))}`;
    console.log('OG Image URL:', ogImageUrl);

    // Add a share button
    const shareText = encodeURIComponent(`Check out the Top 10 Pokémon Guessers!\n\nFrame by @aaronv.eth`);
    const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

    // Create HTML response
    const html = `
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrl}" />
        <meta property="fc:frame:button:1" content="Play Game" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start-game" />
        <meta property="fc:frame:button:2" content="Share Leaderboard" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${shareLink}" />
      </head>
      <body>
        <h1>Top 10 Pokémon Guessers</h1>
        <p>View the leaderboard image for rankings.</p>
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