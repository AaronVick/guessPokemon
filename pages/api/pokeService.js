import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2';

export async function fetchPokemonData() {
  try {
    const pokemonId = Math.floor(Math.random() * 898) + 1; // 898 Pokémon as of Gen 8
    const response = await axios.get(`${BASE_URL}/pokemon/${pokemonId}`);
    const pokemon = response.data;

    const pokemonName = pokemon.name;
    const height = pokemon.height;
    const weight = pokemon.weight;
    const image = pokemon.sprites?.front_default;

    return { pokemonName, height, weight, image };
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
    throw new Error('Failed to fetch Pokémon data');
  }
}

export async function fetchRandomPokemonNames(count = 1, excludeName = '') {
  try {
    const response = await axios.get(`${BASE_URL}/pokemon?limit=898`);
    const allPokemon = response.data.results;
    const filteredPokemon = allPokemon.filter((pokemon) => pokemon.name !== excludeName);
    
    const shuffledPokemon = filteredPokemon.sort(() => 0.5 - Math.random());
    return shuffledPokemon.slice(0, count).map((pokemon) => pokemon.name);
  } catch (error) {
    console.error('Error fetching random Pokémon names:', error);
    return ['pikachu', 'charizard', 'bulbasaur']; // Fallback names
  }
}
