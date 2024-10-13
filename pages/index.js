import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid'; // For generating session IDs

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guess-pokemon-orpin.vercel.app';

  // Generate a new session ID for each game
  const sessionId = uuidv4();

  const shareText = encodeURIComponent(`Check out this awesome Pokémon Guessing Game!\n\nFrame by @aaronv.eth`);
  const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

  return (
    <div>
      <Head>
        <title>Pokémon Guessing Game</title>
        <meta name="description" content="A fun game to guess Pokémon stats from images and descriptions" />
        <meta property="og:title" content="Pokémon Guessing Game" />
        <meta property="og:description" content="Test your knowledge of Pokémon!" />
        <meta property="og:image" content={`${baseUrl}/pokeMain.png`} />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/pokeMain.png`} />
        <meta property="fc:frame:button:1" content="Play Game" />
        <meta
          property="fc:frame:button:1:post_url"
          content={`${baseUrl}/api/start-game?sessionId=${sessionId}`}
        />
        <meta property="fc:frame:button:2" content="View Leaderboard" />
        <meta property="fc:frame:button:2:post_url" content={`${baseUrl}/api/leaderboard`} />
        <meta property="fc:frame:button:3" content="Share" />
        <meta property="fc:frame:button:3:action" content="link" />
        <meta property="fc:frame:button:3:target" content={shareLink} />
      </Head>
      <h1>Pokémon Guessing Game</h1>
      <img
        src="/pokeMain.png"
        alt="Pokémon Guessing Game"
        width="600"
        height="300"
      />
    </div>
  );
}