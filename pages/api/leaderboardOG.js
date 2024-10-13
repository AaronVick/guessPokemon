import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('LeaderboardOG API accessed');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';
    console.log('Fetching leaderboard data from:', `${baseUrl}/api/leaderboardData`);
    
    const response = await fetch(`${baseUrl}/api/leaderboardData`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const topPlayers = await response.json();
    console.log('Leaderboard data fetched:', topPlayers);

    // Generate OG image
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
            padding: '20px',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 10 Pokémon Guessers</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {topPlayers.map((player, index) => (
              <p key={index} style={{ fontSize: '24px', margin: '5px 0' }}>
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
        <div style={{ display: 'flex', backgroundColor: '#FF0000', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <h1>Error Generating Leaderboard Image</h1>
          <p>{error.message}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}