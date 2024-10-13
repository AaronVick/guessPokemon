import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('LeaderboardData API accessed');

  if (req.method !== 'GET') {
    console.error(`Method ${req.method} not allowed`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('Fetching leaderboard data from Firestore');
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    console.log('Leaderboard documents fetched:', leaderboardSnapshot.size);
    
    let playerStats = [];

    for (const doc of leaderboardSnapshot.docs) {
      const fid = doc.id;
      const userData = doc.data();
      console.log(`Processing user ${fid}`);
      const sessionsRef = db.collection('leaderboard').doc(fid).collection('sessions');
      const sessionsSnapshot = await sessionsRef.get();
      console.log(`Sessions for user ${fid}:`, sessionsSnapshot.size);

      let totalCorrect = 0;
      let totalAnswered = 0;

      sessionsSnapshot.forEach(sessionDoc => {
        const sessionData = sessionDoc.data();
        totalCorrect += sessionData.correctCount || 0;
        totalAnswered += sessionData.totalAnswered || 0;
      });

      console.log(`User ${fid} stats:`, { totalCorrect, totalAnswered });

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

    // Sort players first by totalCorrect (descending), then by totalAnswered (ascending)
    playerStats.sort((a, b) => {
      if (b.totalCorrect !== a.totalCorrect) {
        return b.totalCorrect - a.totalCorrect;
      }
      return a.totalAnswered - b.totalAnswered;
    });

    const topPlayers = playerStats.slice(0, 10);

    console.log('Top players:', JSON.stringify(topPlayers));

    res.status(200).json(topPlayers);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}