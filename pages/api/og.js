import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const pokemonName = searchParams.get('pokemonName');
  const height = searchParams.get('height');
  const image = searchParams.get('image');
  const description = searchParams.get('description') || `Can you guess the Pokémon? Height: ${height}`;
  
  const placeholderImage = 'https://via.placeholder.com/400x600?text=No+Image+Available';

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#4CAF50',
            color: '#000000',
            fontWeight: 'bold',
            width: '100%',
            height: '100%',
            padding: '20px',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '20px' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Guess the Pokémon!</h1>
            <p style={{ fontSize: '32px', lineHeight: '1.4' }}>{description}</p>
          </div>
          {image && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={image} 
                alt="Pokémon" 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
              />
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new ImageResponse(
      (
        <div style={{ display: 'flex', backgroundColor: '#FF0000', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <h1>Error Generating Image</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
