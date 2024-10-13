import { ImageResponse } from '@vercel/og';
import { db } from '../../lib/firebase';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('LeaderboardOG API accessed');

  try {
    // Fetch the top 10 players from the leaderboard in Firebase
    const leaderboardRef = db.collection('leaderboard');
    const leaderboardSnapshot = await leaderboardRef.get();

    let topPlayers = [];

    // Loop through each FID document to get the sessions sub-collection
    leaderboardSnapshot.forEach((doc) => {
      const fid = doc.id;
      const data = doc.data();

      // Push each player into the topPlayers array
      topPlayers.push({
        username: data.username || 'Unknown',
        totalCorrect: data.totalCorrect || 0,
        totalAnswered: data.totalAnswered || 0,
      });
    });

    // Sort players by their totalCorrect count in descending order
    topPlayers.sort((a, b) => b.totalCorrect - a.totalCorrect);
    topPlayers = topPlayers.slice(0, 10); // Get the top 10 players

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