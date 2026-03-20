// Uses Node 18+ built-in fetch (no external package needed)

// ============ OpenFoodFacts API ============
const searchOpenFoodFacts = async (query) => {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.products || []).map(p => ({
      source: 'openfoodfacts',
      name: p.product_name || 'Unknown',
      brand: p.brands || '',
      barcode: p.code,
      serving: p.serving_size || '100g',
      nutrients: {
        calories: p.nutriments?.['energy-kcal_100g'] || 0,
        protein: p.nutriments?.proteins_100g || 0,
        carbs: p.nutriments?.carbohydrates_100g || 0,
        fat: p.nutriments?.fat_100g || 0,
        fiber: p.nutriments?.fiber_100g || 0,
        sugar: p.nutriments?.sugars_100g || 0,
        sodium: p.nutriments?.sodium_100g || 0
      },
      imageUrl: p.image_front_small_url || null
    }));
  } catch (err) {
    console.error('OpenFoodFacts search error:', err.message);
    return [];
  }
};

// ============ USDA FoodData Central API ============
const searchUSDA = async (query) => {
  const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=10`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.foods || []).map(f => {
      const getNutrient = (id) => {
        const n = f.foodNutrients?.find(fn => fn.nutrientId === id);
        return n ? n.value : 0;
      };
      return {
        source: 'usda',
        name: f.description || 'Unknown',
        brand: f.brandName || '',
        fdcId: f.fdcId,
        serving: '100g',
        nutrients: {
          calories: getNutrient(1008),
          protein: getNutrient(1003),
          carbs: getNutrient(1005),
          fat: getNutrient(1004),
          fiber: getNutrient(1079),
          sugar: getNutrient(2000),
          sodium: getNutrient(1093)
        }
      };
    });
  } catch (err) {
    console.error('USDA search error:', err.message);
    return [];
  }
};

// ============ Unified Search ============
const searchFood = async (query) => {
  const [offResults, usdaResults] = await Promise.all([
    searchOpenFoodFacts(query),
    searchUSDA(query)
  ]);
  return [...offResults, ...usdaResults];
};

module.exports = { searchOpenFoodFacts, searchUSDA, searchFood };
