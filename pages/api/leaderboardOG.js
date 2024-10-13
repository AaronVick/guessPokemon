import { ImageResponse } from '@vercel/og';
import { db } from '../../lib/firebase';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    // Fetch and aggregate leaderboard data
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    
    let playerStats = [];

    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;
      const userData = doc.data();
      const sessionsRef = db.collection('leaderboard').doc(fid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();

      let totalCorrect = 0;
      let totalAnswered = 0;

      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        totalCorrect += sessionData.correctCount || 0;
        totalAnswered += sessionData.totalAnswered || 0;
      });

      playerStats.push({ 
        fid, 
        username: userData.username || `User ${fid}`,
        totalCorrect, 
        totalAnswered 
      });
    }

    // Sort and get top 10 players
    playerStats.sort((a, b) => b.totalCorrect - a.totalCorrect || b.totalAnswered - a.totalAnswered);
    const topPlayers = playerStats.slice(0, 10);

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
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 10 Pokémon Guessers</h1>
          {topPlayers.map((player, index) => (
            <div key={index} style={{ fontSize: '24px', marginBottom: '10px' }}>
              {index + 1}. {player.username}: {player.totalCorrect} / {player.totalAnswered}
            </div>
          ))}
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
        <div style={{ display: 'flex', backgroundColor: '#FF0000', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <h1>Error Generating Leaderboard Image</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}