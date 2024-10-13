import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge', // Keep this as edge since it’s generating the image
};

export default async function handler(req) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

  // Fetch leaderboard data from a server-side API
  const leaderboardDataResponse = await fetch(`${baseUrl}/api/leaderboardData`);
  const leaderboardData = await leaderboardDataResponse.json();

  const topPlayersHTML = leaderboardData.map((player, index) => `
    <p>${index + 1}. ${player.username}: ${player.totalCorrect} correct answers out of ${player.totalAnswered}</p>
  `).join('');

  // Generate OG image
  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#4CAF50',
            color: 'white',
            width: '100%',
            height: '100%',
            padding: '40px',
            fontSize: '36px',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 10 Pokémon Guessers</h1>
          <div>
            {topPlayersHTML}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new ImageResponse(
      (
        <div style={{ backgroundColor: 'red', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h1>Error Generating Leaderboard</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
