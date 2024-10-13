import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
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

    playerStats.sort((a, b) => b.totalCorrect - a.totalCorrect || b.totalAnswered - a.totalAnswered);
    const topPlayers = playerStats.slice(0, 10);

    res.status(200).json(topPlayers);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}