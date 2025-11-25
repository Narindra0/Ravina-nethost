<?php

namespace App\Service;

use App\Entity\UserPlantation;
use App\Repository\SuiviSnapshotRepository;
use DateTimeImmutable;
use DateTimeInterface;

class HealthScoreService
{
    public function __construct(
        private readonly SuiviSnapshotRepository $snapshotRepository,
    ) {
    }

    /**
     * Calculate health score for a plantation (0-100).
     * 
     * @return array{score: int, status: string, factors: array, recommendations: array}
     */
    public function calculateScore(UserPlantation $plantation): array
    {
        $template = $plantation->getPlantTemplate();
        $confirmedDate = $plantation->getConfirmationPlantation();

        // If not confirmed or no template, return default score
        if (!$confirmedDate instanceof DateTimeInterface || !$template) {
            return $this->defaultScore('Plantation non confirmée ou données insuffisantes');
        }

        $plantationId = $plantation->getId();
        if (!$plantationId) {
            return $this->defaultScore('ID de plantation invalide');
        }

        // Get all snapshots for this plantation
        $snapshots = $this->snapshotRepository->findBy(
            ['userPlantation' => $plantationId],
            ['dateSnapshot' => 'DESC']
        );

        // Calculate 3 factors
        $wateringScore = $this->calculateWateringScore($plantation, $snapshots);
        $growthScore = $this->calculateGrowthScore($plantation, $snapshots);
        $ageScore = $this->calculateAgeScore($plantation);

        // Weighted total: Watering 40%, Growth 35%, Age 25%
        $totalScore = (int) round(
            ($wateringScore * 0.40) +
            ($growthScore * 0.35) +
            ($ageScore * 0.25)
        );

        // Generate status and recommendations
        $status = $this->getStatus($totalScore);
        $recommendations = $this->generateRecommendations($wateringScore, $growthScore, $ageScore);

        return [
            'score' => $totalScore,
            'status' => $status,
            'factors' => [
                'watering' => $wateringScore,
                'growth' => $growthScore,
                'age' => $ageScore,
            ],
            'recommendations' => $recommendations,
        ];
    }

    private function calculateWateringScore(UserPlantation $plantation, array $snapshots): int
    {
        if (count($snapshots) < 2) {
            // Not enough data, give neutral score
            return 70;
        }

        $expectedFrequency = $this->getExpectedWateringFrequency($plantation);
        if (!$expectedFrequency) {
            return 70; // No frequency defined, neutral score
        }

        // Check last 10 snapshots for watering regularity
        $recentSnapshots = array_slice($snapshots, 0, min(10, count($snapshots)));
        $irregularities = 0;
        $totalChecked = 0;

        for ($i = 0; $i < count($recentSnapshots) - 1; $i++) {
            $current = $recentSnapshots[$i];
            $previous = $recentSnapshots[$i + 1];

            $currentDate = $current->getDateSnapshot();
            $previousDate = $previous->getDateSnapshot();

            if ($currentDate && $previousDate) {
                $daysDiff = $previousDate->diff($currentDate)->days;
                $expectedDays = $expectedFrequency;

                // Allow ±1 day tolerance
                if (abs($daysDiff - $expectedDays) > 1) {
                    $irregularities++;
                }
                $totalChecked++;
            }
        }

        if ($totalChecked === 0) {
            return 70;
        }

        // Calculate score: fewer irregularities = higher score
        $regularityRate = 1 - ($irregularities / $totalChecked);
        return (int) round($regularityRate * 100);
    }

    private function calculateGrowthScore(UserPlantation $plantation, array $snapshots): int
    {
        if (count($snapshots) < 2) {
            return 70; // Not enough data
        }

        $template = $plantation->getPlantTemplate();
        $expectedHarvestDays = $template?->getExpectedHarvestDays();

        if (!$expectedHarvestDays) {
            return 70;
        }

        // Check if growth progression is normal
        $recentSnapshots = array_slice($snapshots, 0, min(5, count($snapshots)));
        $growthDelays = 0;

        foreach ($recentSnapshots as $snapshot) {
            $progression = (float) $snapshot->getProgressionPourcentage();
            $snapshotDate = $snapshot->getDateSnapshot();
            $confirmedDate = $plantation->getConfirmationPlantation();

            if ($snapshotDate && $confirmedDate) {
                $daysSincePlanting = $confirmedDate->diff($snapshotDate)->days;
                $expectedProgression = ($daysSincePlanting / $expectedHarvestDays) * 100;

                // If actual progression is significantly behind expected (>15% gap)
                if (($expectedProgression - $progression) > 15) {
                    $growthDelays++;
                }
            }
        }

        // Fewer delays = higher score
        $delayRate = $growthDelays / count($recentSnapshots);
        return (int) round((1 - $delayRate) * 100);
    }

    private function calculateAgeScore(UserPlantation $plantation): int
    {
        $template = $plantation->getPlantTemplate();
        $confirmedDate = $plantation->getConfirmationPlantation();
        $expectedHarvestDays = $template?->getExpectedHarvestDays();

        if (!$confirmedDate || !$expectedHarvestDays) {
            return 70;
        }

        $now = new DateTimeImmutable();
        $plantAge = $confirmedDate->diff($now)->days;
        $agePercentage = ($plantAge / $expectedHarvestDays) * 100;

        // Ideal: plant is progressing normally (0-100% of expected cycle)
        // Penalize if plant is way over expected harvest time
        if ($agePercentage <= 100) {
            return 100; // Normal age
        } elseif ($agePercentage <= 120) {
            return 80; // Slightly over
        } elseif ($agePercentage <= 150) {
            return 60; // Moderately over
        } else {
            return 40; // Way over expected time
        }
    }

    private function getExpectedWateringFrequency(UserPlantation $plantation): ?int
    {
        $template = $plantation->getPlantTemplate();
        $frequency = $template?->getWateringFrequency();

        // Parse frequency string (e.g., "2_DAYS", "3_DAYS")
        if ($frequency && str_contains($frequency, '_DAYS')) {
            $parts = explode('_', $frequency);
            return (int) $parts[0];
        }

        // Default to 2 days if not specified
        return 2;
    }

    private function getStatus(int $score): string
    {
        if ($score >= 80) {
            return 'Excellente santé';
        } elseif ($score >= 60) {
            return 'Bonne santé';
        } elseif ($score >= 40) {
            return 'Santé moyenne';
        } else {
            return 'Nécessite attention';
        }
    }

    private function generateRecommendations(int $watering, int $growth, int $age): array
    {
        $recommendations = [];

        if ($watering < 60) {
            $recommendations[] = "Améliorez la régularité de l'arrosage pour une croissance optimale";
        } elseif ($watering < 80) {
            $recommendations[] = "Maintenez l'arrosage régulier";
        }

        if ($growth < 60) {
            $recommendations[] = "Croissance ralentie détectée. Vérifiez l'exposition au soleil et la fertilisation";
        } elseif ($growth < 80) {
            $recommendations[] = "La croissance est correcte mais peut être améliorée";
        }

        if ($age < 60) {
            $recommendations[] = "La plante dépasse la durée prévue. Vérifiez les conditions de culture";
        }

        if (empty($recommendations)) {
            $recommendations[] = "Continuez ce bon travail ! Votre plantation est en excellente santé";
        }

        return $recommendations;
    }

    private function defaultScore(string $reason): array
    {
        return [
            'score' => 70,
            'status' => 'Données insuffisantes',
            'factors' => [
                'watering' => 70,
                'growth' => 70,
                'age' => 70,
            ],
            'recommendations' => [$reason],
        ];
    }
}
