import { ImageResponse } from '@vercel/og';
import { db } from '../../lib/firebase'; // Assuming Firebase is initialized here

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    // Fetch leaderboard data from Firebase
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    let topPlayers = [];

    // Loop through each FID document and their session sub-collection
    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;
      const sessionsRef = db.collection('leaderboard').doc(fid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();
      
      let totalCorrect = 0;
      let totalAnswered = 0;

      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        totalCorrect += sessionData.correctCount || 0;
        totalAnswered += sessionData.totalAnswered || 0;
      });

      topPlayers.push({
        username: doc.data().username || `User ${fid}`,
        totalCorrect,
        totalAnswered,
      });
    }

    // Sort and get the top 10 players
    topPlayers.sort((a, b) => b.totalCorrect - a.totalCorrect);
    topPlayers = topPlayers.slice(0, 10);

    // Generate leaderboard OG image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontWeight: 'bold',
            width: '100%',
            height: '100%',
            padding: '20px',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 10 Pokémon Guessers</h1>
          <ol style={{ fontSize: '32px', lineHeight: '1.6' }}>
            {topPlayers.map((player, index) => (
              <li key={index}>
                {player.username}: {player.totalCorrect} correct out of {player.totalAnswered}
              </li>
            ))}
          </ol>
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
