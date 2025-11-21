<?php

namespace App\Service;

use App\Entity\PlantTemplate;
use App\Entity\UserPlantation;

class LifecycleService
{
    /**
     * @return array<string, mixed>
     */
    public function compute(UserPlantation $plantation): array
    {
        $template = $plantation->getPlantTemplate();
        $expectedDays = max(1, $template?->getExpectedHarvestDays() ?? 1);

        // On base le cycle sur la date de confirmation si elle existe, sinon sur la date de plantation
        $baseDate = $plantation->getConfirmationPlantation() instanceof \DateTimeInterface
            ? \DateTimeImmutable::createFromInterface($plantation->getConfirmationPlantation())
            : ($plantation->getDatePlantation() instanceof \DateTimeInterface
                ? \DateTimeImmutable::createFromInterface($plantation->getDatePlantation())
                : new \DateTimeImmutable());

        $daysElapsed = (int) $baseDate->diff(new \DateTimeImmutable('today'))->format('%a');
        $progression = round(min(100, max(0, ($daysElapsed / $expectedDays) * 100)), 2);

        $stageInfo = $this->determineStage($template, $daysElapsed, $progression);

        return [
            'progression' => $progression,
            'stage' => $stageInfo['name'],
            'details' => [
                'days_elapsed' => $daysElapsed,
                'expected_days' => $expectedDays,
                'stage_source' => $stageInfo['source'],
            ],
        ];
    }

    /**
     * @return array{name: string, source: string}
     */
    private function determineStage(?PlantTemplate $template, int $daysElapsed, float $progression): array
    {
        $phases = $template?->getCyclePhasesJson();
        if (is_array($phases) && $phases !== []) {
            $normalized = $this->sortAndNormalizePhases($phases);
            foreach ($normalized as $phase) {
                if (isset($phase['start_day']) && $daysElapsed < $phase['start_day']) {
                    break;
                }
                if (isset($phase['start_percentage']) && $progression < $phase['start_percentage']) {
                    break;
                }
                $current = $phase['name'];
            }

            if (isset($current)) {
                return ['name' => $current, 'source' => 'template'];
            }
        }

        return ['name' => $this->stageFromProgression($progression), 'source' => 'default'];
    }

    /**
     * @param array<int, mixed> $phases
     * @return array<int, array{name: string, start_day?: int, start_percentage?: float}>
     */
    private function sortAndNormalizePhases(array $phases): array
    {
        $normalized = [];
        foreach ($phases as $phase) {
            if (!is_array($phase) || !isset($phase['name'])) {
                continue;
            }

            $normalized[] = [
                'name' => (string) $phase['name'],
                'start_day' => isset($phase['start_day']) ? (int) $phase['start_day'] : (isset($phase['startDay']) ? (int) $phase['startDay'] : null),
                'start_percentage' => isset($phase['start_percentage']) ? (float) $phase['start_percentage'] : (isset($phase['startPercentage']) ? (float) $phase['startPercentage'] : null),
            ];
        }

        usort($normalized, static function (array $a, array $b): int {
            $dayA = $a['start_day'] ?? PHP_INT_MAX;
            $dayB = $b['start_day'] ?? PHP_INT_MAX;

            if ($dayA !== $dayB) {
                return $dayA <=> $dayB;
            }

            $percentA = $a['start_percentage'] ?? PHP_FLOAT_MAX;
            $percentB = $b['start_percentage'] ?? PHP_FLOAT_MAX;

            return $percentA <=> $percentB;
        });

        return $normalized;
    }

    private function stageFromProgression(float $progression): string
    {
        return match (true) {
            $progression < 15 => 'Germination',
            $progression < 45 => 'Croissance',
            $progression < 75 => 'Floraison',
            $progression < 95 => 'Maturation',
            default => 'Récolte',
        };
    }
}


