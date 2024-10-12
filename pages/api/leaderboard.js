import { db } from '../../lib/firebase';
import { ImageResponse } from '@vercel/og';
import { getFarcasterProfileName } from './pokeService'; // Assuming this is the file path

export default async function handler(req, res) {
  console.log('Accessing leaderboard API');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

  try {
    // Fetch leaderboard data from Firebase, limit to top 10 players
    const leaderboardRef = db.collection('leaderboard');
    const snapshot = await leaderboardRef.orderBy('correctCount', 'desc').limit(10).get();
    console.log('Firebase snapshot:', snapshot.empty ? 'No data' : 'Data found');

    // If no entries exist in the leaderboard
    if (snapshot.empty) {
      console.log('No leaderboard entries, sending placeholder');
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: '#1e2a38',
              color: '#fff',
              padding: '40px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#FFD700' }}>Leaderboard</h1>
            <p style={{ fontSize: '32px', lineHeight: '1.5', textAlign: 'center' }}>No players yet! Be the first to play!</p>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Fetch usernames and scores only if leaderboard is not empty
    const topPlayers = snapshot.docs.map((doc) => doc.data());
    console.log('Top players from Firebase:', topPlayers);

    // Fetch usernames from Pinata if FIDs are available
    const leaderboardItems = await Promise.all(
      topPlayers.map(async (player, index) => {
        const username = await getFarcasterProfileName(player.FID);
        console.log(`Fetched username for FID ${player.FID}:`, username);
        return `${index + 1}. ${username}: Correct: ${player.correctCount}, Total: ${player.totalAnswered}`;
      })
    );

    // Convert leaderboard items into a string for display
    const leaderboardContent = leaderboardItems.join('<br>');

    // Return the leaderboard image with the top 10 players
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#1e2a38',
            color: '#fff',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#FFD700' }}>Leaderboard</h1>
          <div style={{ fontSize: '32px', lineHeight: '1.5', textAlign: 'center' }}>
            {leaderboardItems.map((item, index) => (
              <p key={index}>{item}</p>
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
    console.error('Error generating leaderboard:', error);
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FF0000',
            width: '100%',
            height: '100%',
          }}
        >
          <h1>Error Loading Leaderboard</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
