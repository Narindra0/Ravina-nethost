<?php

namespace App\Controller;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use App\Service\LifecycleService;
use App\Service\MeteoService;
use App\Service\WateringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class WaterPlantationController extends AbstractController
{
    public function __construct(
        private readonly UserPlantationRepository $repository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
    ) {
    }

    #[Route('/api/plantations/{id}/water', name: 'app_plantations_water', methods: ['POST'])]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        $plantation = $this->repository->find($id);
        if (!$plantation instanceof UserPlantation) {
            return $this->json(['detail' => 'Plantation introuvable.'], 404);
        }
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        if ($plantation->getUser() !== $this->getUser()) {
            return $this->json(['detail' => 'Accès refusé.'], 403);
        }

        $lastSnapshot = $plantation->getSuiviSnapshots()->first() ?: null;
        $meteo = $this->meteoService->fetchDailyForecast(
            (float) $plantation->getGeolocalisationLat(),
            (float) $plantation->getGeolocalisationLon()
        );
        $lifecycle = $this->lifecycleService->compute($plantation);
        $watering = $this->wateringService->compute($plantation, $meteo, $lastSnapshot instanceof SuiviSnapshot ? $lastSnapshot : null, true);

        $snapshot = new SuiviSnapshot();
        $snapshot->setUserPlantation($plantation);
        $snapshot->setDateSnapshot(new \DateTimeImmutable());
        $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
        $snapshot->setStadeActuel((string) $lifecycle['stage']);
        $snapshot->setArrosageRecoDate($watering['date']);
        $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
        $decisionDetails = [
            'lifecycle' => $lifecycle['details'] ?? [],
            'watering_notes' => array_merge(['Arrosage manuel effectué'], $watering['notes'] ?? []),
            'manual' => true,
            'frequency_days' => $watering['frequency_days'] ?? null,
        ];

        if (!empty($watering['auto_validation'])) {
            $decisionDetails['auto_validation'] = $watering['auto_validation'];
        }

        if (!empty($watering['temperature_advice'])) {
            $decisionDetails['temperature_advice'] = $watering['temperature_advice'];
        }

        if (!empty($watering['cards'])) {
            $decisionDetails['cards'] = $watering['cards'];
        }

        $snapshot->setDecisionDetailsJson($decisionDetails);
        $snapshot->setMeteoDataJson([
            'daily' => $meteo['daily'] ?? [],
            'error' => $meteo['error'] ?? null,
        ]);

        $this->entityManager->persist($snapshot);
        $plantation->addSuiviSnapshot($snapshot);
        $this->entityManager->flush();

        return $this->json([
            'status' => 'ok',
            'snapshot_id' => $snapshot->getId(),
        ], 201);
    }
}


