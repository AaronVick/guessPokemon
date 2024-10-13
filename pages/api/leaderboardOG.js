import { ImageResponse } from '@vercel/og';
import { db } from '../../lib/firebase';  // Assuming Firebase is set up

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('LeaderboardOG API accessed');

  try {
    // Fetch top players from the database
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    
    let topPlayers = [];
    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;
      const sessionsSnapshot = await db.collection('leaderboard').doc(fid).collection('sessions').get();

      let totalCorrect = 0;
      let totalAnswered = 0;
      sessionsSnapshot.forEach(session => {
        totalCorrect += session.data().correctCount || 0;
        totalAnswered += session.data().totalAnswered || 0;
      });

      topPlayers.push({
        username: doc.data().username,
        totalCorrect,
        totalAnswered
      });
    }

    // Sort and get top 10
    topPlayers.sort((a, b) => b.totalCorrect - a.totalCorrect);
    topPlayers = topPlayers.slice(0, 10);

    // Generate image response with leaderboard data
    const leaderboardHTML = topPlayers.map((player, index) => `
      <p style="font-size: 20px; margin-bottom: 5px;">${index + 1}. ${player.username}: ${player.totalCorrect} correct out of ${player.totalAnswered}</p>
    `).join('');

    console.log('Generating leaderboard image with actual data');
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
          <div style={{ fontSize: '24px', textAlign: 'center' }}>
            {leaderboardHTML || 'No leaderboard data available.'}
          </div>
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
