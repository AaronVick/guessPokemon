import { fetchPokemonData, fetchRandomPokemonNames } from './pokeService';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pokeguess.vercel.app';
  const { untrustedData } = req.body;
  const buttonIndex = untrustedData?.buttonIndex;
  const state = JSON.parse(decodeURIComponent(untrustedData?.state || '{}'));
  const { correctTitle, correctIndex, totalAnswered = 0, correctCount = 0, stage } = state;

  try {
    let html;
    if (stage === 'question' && buttonIndex !== undefined) {
      const newTotalAnswered = totalAnswered + 1;
      const isCorrect = buttonIndex === correctIndex;
      const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
      const message = isCorrect 
        ? `Correct! The answer was ${correctTitle}. You've guessed ${newCorrectCount} out of ${newTotalAnswered} correctly.`
        : `Wrong. The correct answer was ${correctTitle}. You've guessed ${newCorrectCount} out of ${newTotalAnswered} correctly.`;

      const shareText = encodeURIComponent(`I've guessed ${newCorrectCount} Pokémon correctly out of ${newTotalAnswered} questions! Can you beat my score?\n\nFrame by @aaronv.eth`);
      const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

      html = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent(message)}" />
    <meta property="fc:frame:button:1" content="Next Question" />
    <meta property="fc:frame:button:2" content="Share" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${shareUrl}" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
    <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ totalAnswered: newTotalAnswered, correctCount: newCorrectCount, stage: 'answer' }))}" />
  </head>
  <body></body>
</html>`;
    } else {
      const { pokemonName, height, weight, image, descriptionText } = await fetchPokemonData();
      const wrongAnswer = await fetchRandomPokemonNames(1, pokemonName); // Ensure wrong answer is a name
      const answers = [pokemonName, wrongAnswer].sort(() => Math.random() - 0.5);
      const newCorrectIndex = answers.indexOf(pokemonName) + 1;

      html = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/og?image=${encodeURIComponent(image)}&description=${encodeURIComponent(descriptionText)}" />
    <meta property="fc:frame:button:1" content="${answers[0]}" />
    <meta property="fc:frame:button:2" content="${answers[1]}" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
    <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify({ correctTitle: pokemonName, correctIndex: newCorrectIndex, totalAnswered, correctCount, stage: 'question' }))}" />
  </head>
  <body></body>
</html>`;
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in answer handler:', error);

    const errorHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/og?message=${encodeURIComponent('An error occurred. Please try again.')}" />
    <meta property="fc:frame:button:1" content="Try Again" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/answer" />
  </head>
  <body></body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorHtml);
  }
}
