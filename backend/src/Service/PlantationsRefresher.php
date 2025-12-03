<?php

namespace App\Service;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class PlantationsRefresher
{
    public function __construct(
        private readonly UserPlantationRepository $plantationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function refreshActivePlantationsForToday(): int
    {
        $today = new \DateTimeImmutable('today');
        $processed = 0;

        $plantations = $this->plantationRepository->createQueryBuilder('p')
            ->where('p.etatActuel = :status')
            ->setParameter('status', UserPlantation::STATUS_ACTIVE)
            ->getQuery()
            ->getResult();

        foreach ($plantations as $plantation) {
            if (!$plantation instanceof UserPlantation) {
                continue;
            }

            $lastSnapshot = $plantation->getSuiviSnapshots()->first();
            $hasToday = false;
            if ($lastSnapshot instanceof SuiviSnapshot) {
                $lastDate = $lastSnapshot->getDateSnapshot();
                $hasToday = $lastDate instanceof \DateTimeInterface
                    && $lastDate->format('Y-m-d') === $today->format('Y-m-d');
            }

            $meteo = $this->safeFetchMeteo((float) $plantation->getGeolocalisationLat(), (float) $plantation->getGeolocalisationLon());
            $lifecycle = $this->lifecycleService->compute($plantation);
            $watering = $this->wateringService->compute($plantation, $meteo, $lastSnapshot instanceof SuiviSnapshot ? $lastSnapshot : null);

            if ($hasToday) {
                // Si le snapshot du jour existe avec une erreur météo, on met à jour ses champs quand internet revient
                if (isset($lastSnapshot) && is_array($lastSnapshot->getMeteoDataJson()) && ($lastSnapshot->getMeteoDataJson()['error'] ?? null)) {
                    $lastSnapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
                    $lastSnapshot->setStadeActuel((string) $lifecycle['stage']);
                    $lastSnapshot->setArrosageRecoDate($watering['date']);
                    $lastSnapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
                    $decisionDetails = [
                        'lifecycle' => $lifecycle['details'] ?? [],
                        'watering_notes' => $watering['notes'] ?? [],
                        'frequency_days' => $watering['frequency_days'] ?? null,
                        'last_watered_at' => $watering['last_watered_at'] instanceof \DateTimeInterface
                            ? $watering['last_watered_at']->format(\DateTimeInterface::ATOM)
                            : null,
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

                    $lastSnapshot->setDecisionDetailsJson($decisionDetails);
                    $lastSnapshot->setMeteoDataJson([
                        'daily' => $meteo['daily'] ?? [],
                        'error' => $meteo['error'] ?? null,
                    ]);
                    $processed++;
                }
                continue;
            }

            $snapshot = new SuiviSnapshot();
            $snapshot->setUserPlantation($plantation);
            $snapshot->setDateSnapshot(new \DateTimeImmutable());
            $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
            $snapshot->setStadeActuel((string) $lifecycle['stage']);
            $snapshot->setArrosageRecoDate($watering['date']);
            $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
            $decisionDetails = [
                'lifecycle' => $lifecycle['details'] ?? [],
                'watering_notes' => $watering['notes'] ?? [],
                'frequency_days' => $watering['frequency_days'] ?? null,
                'last_watered_at' => $watering['last_watered_at'] instanceof \DateTimeInterface
                    ? $watering['last_watered_at']->format(\DateTimeInterface::ATOM)
                    : null,
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
            $processed++;
        }

        if ($processed > 0) {
            $this->entityManager->flush();
        }

        return $processed;
    }

    /**
     * @return array<string, mixed>
     */
    private function safeFetchMeteo(float $lat, float $lon): array
    {
        try {
            return $this->meteoService->fetchDailyForecast($lat, $lon);
        } catch (\Throwable $e) {
            $this->logger->warning('Meteo fetch failed (uncaught). Using empty data.', [
                'message' => $e->getMessage(),
            ]);
            return ['raw' => null, 'daily' => [], 'error' => 'internal_error'];
        }
    }
}


