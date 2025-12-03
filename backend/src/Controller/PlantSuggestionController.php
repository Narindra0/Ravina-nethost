<?php
namespace App\Controller;

use App\Entity\PlantTemplate;
use App\Repository\PlantTemplateRepository;
use App\Service\TrefleApiService;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class PlantSuggestionController extends AbstractController
{
    #[Route('/api/suggestions/plants', name: 'api_plants_suggestions', methods: ['GET'])]
    public function suggestions(
        Request $request,
        PlantTemplateRepository $plantTemplateRepository,
        CacheItemPoolInterface $cache,
        TrefleApiService $trefleApiService
    ): JsonResponse {
        $month = (int) $request->query->get('month', date('n'));

        $season = match (true) {
            in_array($month, [12, 1, 2]) => 'Été',
            in_array($month, [3, 4, 5]) => 'Automne',
            in_array($month, [6, 7, 8]) => 'Hiver',
            in_array($month, [9, 10, 11]) => 'Printemps',
            default => 'Printemps'
        };

        $monthNames = [
            1 => 'Janvier',
            2 => 'Février',
            3 => 'Mars',
            4 => 'Avril',
            5 => 'Mai',
            6 => 'Juin',
            7 => 'Juillet',
            8 => 'Août',
            9 => 'Septembre',
            10 => 'Octobre',
            11 => 'Novembre',
            12 => 'Décembre'
        ];

        // Vérifier si l'utilisateur est premium
        $user = $this->getUser();
        $isPremium = $user && method_exists($user, 'isPremium') && $user->isPremium();

        $suggestions = [];

        if ($isPremium) {
            // Utilisateur PREMIUM : utiliser l'API Trefle.io
            $suggestions = $trefleApiService->getSeasonalPlants($season);

            // Si l'API Trefle ne retourne rien, fallback sur PlantTemplate
            if (empty($suggestions)) {
                $suggestions = $this->getPlantTemplatesForSeason($plantTemplateRepository, $cache, $season);
            }
        } else {
            // Utilisateur FREE ou non authentifié : utiliser PlantTemplate
            $suggestions = $this->getPlantTemplatesForSeason($plantTemplateRepository, $cache, $season);
        }

        $data = [
            'currentMonth' => $monthNames[$month] ?? 'Inconnu',
            'currentSeason' => $season,
            'isPremium' => $isPremium,
            'suggestions' => $suggestions,
        ];

        return $this->json($data);
    }

    /**
     * Récupère les suggestions depuis PlantTemplate (pour utilisateurs FREE)
     */
    private function getPlantTemplatesForSeason(
        PlantTemplateRepository $plantTemplateRepository,
        CacheItemPoolInterface $cache,
        string $season
    ): array {
        // Cache + déduplication par nom pour la saison
        $cacheKey = 'plant_suggestions_global_' . $season;
        $cacheItem = $cache->getItem($cacheKey);

        if (!$cacheItem->isHit()) {
            $sub = $plantTemplateRepository->createQueryBuilder('pt2')
                ->select('MAX(pt2.id)')
                ->andWhere('pt2.bestSeason = :season OR LOWER(pt2.bestSeason) LIKE :yearRound')
                ->groupBy('pt2.name');

            $qb = $plantTemplateRepository->createQueryBuilder('pt');
            $expr = $qb->expr();
            $qb->andWhere('pt.bestSeason = :season OR LOWER(pt.bestSeason) LIKE :yearRound')
                ->andWhere($expr->in('pt.id', $sub->getDQL()))
                ->setParameter('season', $season)
                ->setParameter('yearRound', '%toute%')
                ->add('orderBy', "CASE pt.type WHEN 'Fruit' THEN 1 WHEN 'Légume' THEN 2 WHEN 'Herbe' THEN 3 ELSE 4 END, pt.name ASC");

            $plantTemplates = $qb->getQuery()->getResult();
            $cacheItem->set($plantTemplates);
            $cacheItem->expiresAfter(300);
            $cache->save($cacheItem);
        } else {
            $plantTemplates = $cacheItem->get();
        }

        return array_map(fn(PlantTemplate $plantTemplate) => [
            'id' => $plantTemplate->getId(),
            'name' => $plantTemplate->getName(),
            'type' => $plantTemplate->getType(),
            'bestSeason' => $plantTemplate->getBestSeason(),
            'wateringFrequency' => $plantTemplate->getWateringFrequency(),
            'sunExposure' => $plantTemplate->getSunExposure(),
            'imageSlug' => $plantTemplate->getImageSlug(),
            'source' => 'local',
        ], $plantTemplates);
    }
}