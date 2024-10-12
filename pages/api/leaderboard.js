import { db } from '../../lib/firebase';
import { ImageResponse } from '@vercel/og';
import fetch from 'node-fetch';

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const USER_DATA_TYPES = { USERNAME: 6 };

async function getFarcasterProfileName(fid) {
  try {
    const response = await fetch(`${PINATA_HUB_API}/userDataByFid?fid=${fid}&user_data_type=${USER_DATA_TYPES.USERNAME}`);
    const data = await response.json();
    return data?.data?.userDataBody?.value || 'Unknown User';
  } catch {
    return 'Unknown User';
  }
}

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

  try {
    // Fetch leaderboard data from Firebase
    const leaderboardRef = db.collection('leaderboard');
    const snapshot = await leaderboardRef.orderBy('correctCount', 'desc').limit(10).get();

    // Check if the leaderboard is empty
    if (snapshot.empty) {
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

    // Fetch usernames from Pinata for each player
    const topPlayers = snapshot.docs.map((doc) => doc.data());
    const leaderboardItems = await Promise.all(
      topPlayers.map(async (player) => {
        const username = await getFarcasterProfileName(player.FID);
        return `${username}: ${player.correctCount} / ${player.totalAnswered}`;
      })
    );

    // Convert leaderboard items into a string for display
    const leaderboardContent = leaderboardItems
      .map((item, index) => `${index + 1}. ${item}`)
      .join('<br>');

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
              <p key={index}>{index + 1}. {item}</p>
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
