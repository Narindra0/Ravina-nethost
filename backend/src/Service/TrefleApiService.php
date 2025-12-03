<?php

namespace App\Service;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class TrefleApiService
{
    private const API_BASE_URL = 'https://trefle.io/api/v1';

    public function __construct(
        private HttpClientInterface $httpClient,
        private CacheItemPoolInterface $cache,
        private string $trefleApiKey = ''
    ) {
        // La clé API sera injectée via les variables d'environnement
        $this->trefleApiKey = $_ENV['TREFLE_API_KEY'] ?? '';
    }

    /**
     * Récupère les suggestions de plantes pour une saison donnée
     * 
     * @return array
     */
    public function getSeasonalPlants(string $season): array
    {
        // Si pas de clé API, retourner un tableau vide
        if (empty($this->trefleApiKey)) {
            return [];
        }

        // Cache des résultats
        $cacheKey = 'trefle_seasonal_plants_' . $season;
        $cacheItem = $this->cache->getItem($cacheKey);

        if ($cacheItem->isHit()) {
            return $cacheItem->get();
        }

        try {
            // Recherche de plantes selon la saison
            // Note: Trefle.io n'a pas de filtre direct par saison, 
            // donc on utilise une recherche générale et on filtre localement
            $response = $this->httpClient->request('GET', self::API_BASE_URL . '/plants', [
                'query' => [
                    'token' => $this->trefleApiKey,
                    'filter[edible]' => true, // Plantes comestibles
                    'page' => 1,
                ],
            ]);

            $data = $response->toArray();
            $plants = $data['data'] ?? [];

            // Heuristiques pour Madagascar : cultures prioritaires & exclusions
            $priorityKeywords = [
                // Fruits tropicaux & malgaches
                'vanille', 'vanilla',
                'litchi', 'lychee', 'lichi',
                'mangue', 'mango',
                'banane', 'banana',
                'ananas', 'pineapple',
                'papaye', 'papaya',
                'kaki',
                'orange',
                'citron', 'lemon', 'lime',
                'pomme', 'apple',
                'poire', 'pear',
                'raisin', 'grape',
                'fraise', 'strawberry',
                // Cultures de base
                'riz', 'rice',
                'café', 'cafe', 'coffee',
                'cacao', 'cocoa',
                'girofle', 'clove',
                'ylang',
                // Légumes courants
                'tomate', 'tomato',
                'carotte', 'carrot',
                'salade', 'laitue', 'lettuce',
                'oignon', 'onion',
                'ail', 'garlic',
                'piment', 'chili', 'pepper',
                'courgette', 'zucchini',
                'chou', 'cabbage',
                'patate douce', 'sweet potato',
                'pomme de terre', 'potato',
                'manioc', 'cassava',
            ];

            // Liste (non exhaustive) de plantes à faible intérêt pour l'appli (mauvaises herbes, ornementales sans intérêt alimentaire)
            $excludedKeywords = [
                'milfoil',
                'sorrel',
                'plantain',
                'shepherd\'s-purse',
                'shepherds purse',
                'ragwort',
                'thistle',
                'dandelion',
                'burdock',
                'dock',
                'knotweed',
            ];

            // Transformation des données Trefle en format compatible
            $mapped = array_map(function ($plant) use ($season) {
                $name = $plant['common_name'] ?? $plant['scientific_name'] ?? 'Plante inconnue';

                return [
                    'id' => $plant['id'],
                    'name' => $name,
                    'type' => $this->determinePlantType($plant),
                    'bestSeason' => $season,
                    'wateringFrequency' => $this->determineWateringFrequency($plant),
                    'sunExposure' => $this->determineSunExposure($plant),
                    'imageSlug' => $plant['image_url'] ?? null,
                    'source' => 'trefle',
                ];
            }, $plants);

            // 1) Exclure les plantes non pertinentes (mauvaises herbes, etc.)
            $mapped = array_filter($mapped, function (array $plant) use ($excludedKeywords) {
                $name = mb_strtolower($plant['name'] ?? '');

                foreach ($excludedKeywords as $needle) {
                    if (str_contains($name, $needle)) {
                        return false;
                    }
                }

                return true;
            });

            // 2) Séparer les plantes prioritaires (fort intérêt économique à Madagascar)
            $prioritary = [];
            $secondary = [];

            foreach ($mapped as $plant) {
                $name = mb_strtolower($plant['name'] ?? '');
                $isPriority = false;

                foreach ($priorityKeywords as $needle) {
                    if (str_contains($name, mb_strtolower($needle))) {
                        $isPriority = true;
                        break;
                    }
                }

                if ($isPriority) {
                    $prioritary[] = $plant;
                } else {
                    $secondary[] = $plant;
                }
            }

            // 3) Appliquer une règle de "nom simple" pour les suggestions
            $isSimpleName = function (array $plant): bool {
                $name = trim((string) ($plant['name'] ?? ''));
                if ($name === '' || $name === 'Plante inconnue') {
                    return false;
                }

                // Longueur max raisonnable pour l'autocomplétion
                if (mb_strlen($name) > 32) {
                    return false;
                }

                // Limiter les noms à trop de mots (ex: "Common plantain, narrowleaf")
                $wordCount = preg_match_all('/\S+/', $name);
                if ($wordCount !== false && $wordCount > 4) {
                    return false;
                }

                return true;
            };

            $prioritarySimple = array_values(array_filter($prioritary, $isSimpleName));
            $secondarySimple = array_values(array_filter($secondary, $isSimpleName));

            // 4) Construire la liste finale : d'abord les cultures prioritaires, puis le reste
            $suggestions = array_merge(
                array_slice($prioritarySimple, 0, 30),
                array_slice($secondarySimple, 0, 20)
            );

            // Cache pour 1 heure
            $cacheItem->set($suggestions);
            $cacheItem->expiresAfter(3600);
            $this->cache->save($cacheItem);

            return $suggestions;
        } catch (\Exception $e) {
            // En cas d'erreur API, retourner un tableau vide
            return [];
        }
    }

    /**
     * Détermine le type de plante
     */
    private function determinePlantType(array $plant): string
    {
        $vegetableFlag = (bool) ($plant['vegetable'] ?? false);
        $family = strtolower((string) ($plant['family_common_name'] ?? ''));
        $commonName = strtolower((string) ($plant['common_name'] ?? $plant['scientific_name'] ?? ''));
        $mainSpecies = $plant['main_species'] ?? [];
        $edibleParts = strtolower(implode(' ', (array) ($mainSpecies['edible_part'] ?? [])));

        // 1. Indicateur direct Trefle
        if ($vegetableFlag) {
            return 'Légume';
        }

        // 2. Parties comestibles
        if (str_contains($edibleParts, 'fruit')) {
            return 'Fruit';
        }
        if (
            str_contains($edibleParts, 'leaf') ||
            str_contains($edibleParts, 'root') ||
            str_contains($edibleParts, 'stem') ||
            str_contains($edibleParts, 'seed')
        ) {
            return 'Légume';
        }

        // 3. Heuristiques sur le nom (fruits les plus courants)
        if (preg_match('/(banan|mangue|mango|orange|citron|citrum|pomm|poire|raisin|frais|tomat|ananas|litchi|lichi|papay|melon|past(e?̀|e)que|cacao|cafe)/', $commonName)) {
            return 'Fruit';
        }

        // 4. Familles fruitières
        if (str_contains($family, 'fruit')) {
            return 'Fruit';
        }

        // 5. Heuristique "herbes aromatiques" -> légumes par défaut
        if (preg_match('/(basilic|menthe|persil|romarin|thym|ciboulette|aneth|coriandre|estragon)/', $commonName)) {
            return 'Légume';
        }

        // 6. Fallback : éviter "Plante" générique
        return 'Légume';
    }

    /**
     * Détermine la fréquence d'arrosage basée sur les données disponibles
     */
    private function determineWateringFrequency(array $plant): string
    {
        // Trefle.io ne fournit pas directement cette info
        // On utilise une valeur par défaut
        return 'Modérée';
    }

    /**
     * Détermine l'exposition au soleil
     */
    private function determineSunExposure(array $plant): string
    {
        $growth = $plant['growth'] ?? [];
        $light = $growth['light'] ?? null;

        return match ($light) {
            10 => 'Plein soleil',
            7, 8, 9 => 'Mi-ombre',
            default => 'Ombre partielle',
        };
    }

    /**
     * Recherche de plantes par nom
     */
    public function searchPlantsByName(string $name): array
    {
        if (empty($this->trefleApiKey) || empty($name)) {
            return [];
        }

        try {
            $response = $this->httpClient->request('GET', self::API_BASE_URL . '/plants/search', [
                'query' => [
                    'token' => $this->trefleApiKey,
                    'q' => $name,
                ],
            ]);

            $data = $response->toArray();
            return $data['data'] ?? [];
        } catch (\Exception $e) {
            return [];
        }
    }
}
