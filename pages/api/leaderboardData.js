import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('LeaderboardData API accessed');

  if (req.method !== 'GET') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('Fetching leaderboard data from Firestore');
    const leaderboardRef = db.collection('leaderboard');
    const leaderboardSnapshot = await leaderboardRef.get();
    console.log('Leaderboard documents fetched:', leaderboardSnapshot.size);
    
    let playerStats = [];

    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;
      const userData = doc.data();
      console.log(`Processing user ${fid}:`, userData);

      const sessionsRef = leaderboardRef.doc(fid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();
      console.log(`Sessions for user ${fid}:`, sessionsSnapshot.size);

      let totalCorrect = 0;
      let totalAnswered = 0;

      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        console.log(`Session data for ${fid}:`, sessionData);
        totalCorrect += sessionData.correctCount || 0;
        totalAnswered += sessionData.totalAnswered || 0;
      });

      console.log(`User ${fid} aggregated stats:`, { totalCorrect, totalAnswered });

      if (totalAnswered > 0) {
        playerStats.push({ 
          fid, 
          username: userData.username || `User ${fid}`,
          totalCorrect, 
          totalAnswered 
        });
      }
    }

    console.log('Total players with stats:', playerStats.length);
    console.log('Player stats before sorting:', JSON.stringify(playerStats));

    // Sort players first by totalCorrect (descending), then by totalAnswered (ascending)
    playerStats.sort((a, b) => {
      if (b.totalCorrect !== a.totalCorrect) {
        return b.totalCorrect - a.totalCorrect;
      }
      return a.totalAnswered - b.totalAnswered;
    });

    const topPlayers = playerStats.slice(0, 10);

    console.log('Top players after sorting:', JSON.stringify(topPlayers));

    // If there are no players, return an empty array
    if (topPlayers.length === 0) {
      console.log('No players found in the leaderboard');
      return res.status(200).json([]);
    }

    res.status(200).json(topPlayers);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}