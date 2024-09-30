import { fetchPokemonData } from './pokeService';

export default async function handler(req, res) {
  const { untrustedData } = req.body;
  const buttonIndex = untrustedData?.buttonIndex;

  try {
    let html = '';
    const state = JSON.parse(decodeURIComponent(untrustedData?.state || '{}'));
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app';

    if (!state.stage || state.stage === 'initial') {
      const { pokemonName, height, image } = await fetchPokemonData();

      html = `
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/api/og?pokemonName=${encodeURIComponent(pokemonName)}&height=${encodeURIComponent(height)}&image=${encodeURIComponent(image)}" />
            <meta property="fc:frame:button:1" content="${pokemonName}" />
            <meta property="fc:frame:button:2" content="Not ${pokemonName}" />
            <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
          </head>
          <body></body>
        </html>
      `;
    } else if (state.stage === 'question') {
      const isCorrect = buttonIndex === 1;
      const message = isCorrect ? `Correct!` : `Wrong.`;

      html = `
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent(message)}" />
            <meta property="fc:frame:button:1" content="Next Question" />
          </head>
          <body></body>
        </html>
      `;
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error("Error in frame handler:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
