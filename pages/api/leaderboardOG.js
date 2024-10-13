import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('LeaderboardOG API accessed');

  try {
    // Generate a simple OG image without fetching data
    console.log('Generating simple image response');
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
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Pokémon Guessing Game Leaderboard</h1>
          <p style={{ fontSize: '24px' }}>Loading leaderboard data...</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error in leaderboardOG handler:', error);
    console.error('Error stack:', error.stack);
    console.log('Generating error image response');
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
            backgroundColor: '#FF0000',
            color: '#FFFFFF',
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Error Loading Leaderboard</h1>
          <p style={{ fontSize: '24px', maxWidth: '80%' }}>{error.message || 'Unknown error occurred'}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}