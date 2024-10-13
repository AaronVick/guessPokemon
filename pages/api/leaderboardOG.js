import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('LeaderboardOG API accessed');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';
    
    // Fetch leaderboard data from the leaderboardData endpoint
    const response = await fetch(`${baseUrl}/api/leaderboardData`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const topPlayers = await response.json();
    console.log('Leaderboard data fetched:', JSON.stringify(topPlayers));

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            fontFamily: 'Arial, sans-serif',
            padding: '40px',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 10 Pokémon Guessers</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            {topPlayers.map((player, index) => (
              <p key={index} style={{ fontSize: '24px', margin: '5px 0', width: '100%', textAlign: 'left' }}>
                {index + 1}. {player.username}: {player.totalCorrect} / {player.totalAnswered}
              </p>
            ))}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating leaderboard OG image:', error);
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF0000', color: '#FFFFFF', fontFamily: 'Arial, sans-serif', padding: '40px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Error Loading Leaderboard</h1>
          <p style={{ fontSize: '24px', textAlign: 'center' }}>{error.message || 'Unknown error occurred'}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}