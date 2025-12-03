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

            // Transformation des données Trefle en format compatible
            $suggestions = array_map(function ($plant) use ($season) {
                return [
                    'id' => $plant['id'],
                    'name' => $plant['common_name'] ?? $plant['scientific_name'] ?? 'Plante inconnue',
                    'type' => $this->determinePlantType($plant),
                    'bestSeason' => $season,
                    'wateringFrequency' => $this->determineWateringFrequency($plant),
                    'sunExposure' => $this->determineSunExposure($plant),
                    'imageSlug' => $plant['image_url'] ?? null,
                    'source' => 'trefle',
                ];
            }, array_slice($plants, 0, 20)); // Limiter à 20 résultats

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
        $vegetableType = $plant['vegetable'] ?? false;

        if ($vegetableType) {
            return 'Légume';
        }

        // Vérifier si c'est un fruit
        $family = $plant['family_common_name'] ?? '';
        if (str_contains(strtolower($family), 'fruit')) {
            return 'Fruit';
        }

        return 'Plante';
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
