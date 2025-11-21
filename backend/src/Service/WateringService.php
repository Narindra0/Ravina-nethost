<?php

namespace App\Service;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;

class WateringService
{
    /**
     * @param array<string, mixed> $meteoData
     * @return array<string, mixed>
     */
    public function compute(UserPlantation $plantation, array $meteoData, ?SuiviSnapshot $lastSnapshot = null): array
    {
        $template = $plantation->getPlantTemplate();
        $baseQuantity = (float) ($template?->getWateringQuantityMl() ?? 500);
        $frequencyDays = $this->resolveFrequencyDays((string) $template?->getWateringFrequency());

        $referenceDate = $lastSnapshot?->getArrosageRecoDate()
            ?? $plantation->getDatePlantation()
            ?? new \DateTimeImmutable('today');

        $referenceDate = $this->toImmutable($referenceDate);
        $frequencyInterval = new \DateInterval(sprintf('P%dD', max(1, $frequencyDays)));

        $todayDate = new \DateTimeImmutable('today');
        $nextDate = $referenceDate->add($frequencyInterval);
        $quantity = $baseQuantity;
        $decisions = [];
        $autoValidation = null;
        $temperatureAdvice = [];
        $cards = [];

        $sanitizedLocation = $this->sanitizeLocation($plantation->getLocalisation());
        $isOutdoor = $this->isOutdoorLocation($sanitizedLocation);

        $daily = $meteoData['daily'] ?? [];
        $today = $daily[0] ?? null;
        $tomorrow = $daily[1] ?? null;

        $daysUntilNext = $this->diffInDays($todayDate, $nextDate);
        if ($isOutdoor && $daysUntilNext <= 2 && $daysUntilNext >= 0) {
            $forecastDay = $daily[$daysUntilNext] ?? null;
            if (is_array($forecastDay) && isset($forecastDay['precipitation_sum']) && $forecastDay['precipitation_sum'] !== null && $forecastDay['precipitation_sum'] >= 5) {
                $message = $daysUntilNext === 0
                    ? 'Pluie prévue aujourd\'hui, l\'arrosage est validé automatiquement. Pas besoin d\'arroser.'
                    : sprintf(
                        'Pluie prévue dans %d jour%s, l\'arrosage est validé automatiquement. Pas besoin d\'arroser.',
                        $daysUntilNext,
                        $daysUntilNext > 1 ? 's' : ''
                    );

                $autoValidation = [
                    'validated_at' => $todayDate->format(\DateTimeInterface::ATOM),
                    'validated_for' => $nextDate->format('Y-m-d'),
                    'reason' => 'rain',
                    'precipitation_sum' => (float) $forecastDay['precipitation_sum'],
                    'message' => $message,
                ];

                $decisions[] = $message;
                $cards[] = [
                    'type' => 'watering_auto',
                    'severity' => 'info',
                    'message' => $message,
                ];

                $nextDate = $nextDate->add($frequencyInterval);
                $daysUntilNext = $this->diffInDays($todayDate, $nextDate);
            }
        }

        if ($autoValidation === null && $isOutdoor && is_array($today) && isset($today['precipitation_sum']) && $today['precipitation_sum'] !== null) {
            if ($today['precipitation_sum'] >= 2) {
                $quantity *= 0.8;
                $decisions[] = 'Réduction de 20% car pluie modérée attendue.';
            }
        }

        if ($autoValidation === null && $isOutdoor && is_array($tomorrow) && isset($tomorrow['precipitation_sum']) && $tomorrow['precipitation_sum'] >= 7) {
            $nextDate = $nextDate->add(new \DateInterval('P1D'));
            $decisions[] = 'Report supplémentaire (+1 jour) car forte pluie attendue demain.';
        }

        $maxTemp = $today['temperature_max'] ?? null;
        $minTemp = $today['temperature_min'] ?? null;
        if ($maxTemp !== null) {
            if ($maxTemp >= 32) {
                $quantity *= 1.2;
                $decisions[] = 'Augmentation de 20% car température max >= 32°C.';
            } elseif ($maxTemp <= 10) {
                $quantity *= 0.9;
                $decisions[] = 'Réduction de 10% car température max <= 10°C.';
            }
        }

        if ($minTemp !== null && $minTemp >= 10 && $minTemp <= 15 && !$isOutdoor) {
            $message = 'Plante d\'intérieur : attention au froid ! Éloignez-la des courants d\'air et des vitres froides. Le plus important : Réduisez l\'arrosage au maximum. Sol froid + eau = pourriture garantie.';
            $temperatureAdvice[] = [
                'type' => 'cold_alert',
                'location' => 'indoor',
                'message' => $message,
            ];
            $cards[] = [
                'type' => 'cold_alert',
                'severity' => 'warning',
                'message' => $message,
            ];
            $decisions[] = 'Conseil froid intérieur : retardez l\'arrosage si possible et surveillez l\'humidité.';
        }

        if ($maxTemp !== null && $maxTemp > 30) {
            $message = $isOutdoor
                ? 'Appliquez une couche épaisse de paillage pour isoler le sol et arrosez profondément le soir ou tôt le matin.'
                : 'Déplacez les plantes loin du soleil direct des fenêtres et augmentez l\'humidité par vaporisation ou avec des soucoupes à billes d\'argile.';
            $temperatureAdvice[] = [
                'type' => 'heat_alert',
                'location' => $isOutdoor ? 'outdoor' : 'indoor',
                'message' => $message,
            ];
            $cards[] = [
                'type' => 'heat_alert',
                'severity' => 'info',
                'message' => $message,
            ];
            $decisions[] = 'Conseil chaleur : ' . $message;
        }

        while ($nextDate <= $todayDate) {
            $nextDate = $nextDate->add($frequencyInterval);
        }

        $quantity = round($quantity, 2);

        return [
            'date' => $nextDate,
            'quantity' => $quantity,
            'notes' => $decisions,
            'frequency_days' => $frequencyDays,
            'auto_validation' => $autoValidation,
            'temperature_advice' => $temperatureAdvice,
            'cards' => $cards,
        ];
    }

    private function resolveFrequencyDays(?string $frequency): int
    {
        if ($frequency === null || $frequency === '') {
            return 3;
        }

        $normalized = mb_strtolower($frequency);
        $map = [
            'quotidien' => 1,
            'journalier' => 1,
            'tous les jours' => 1,
            'hebdomadaire' => 7,
            'hebdo' => 7,
            'semaine' => 7,
            'bihebdomadaire' => 3,
            'tous les 2 jours' => 2,
            'toutes les 2 semaines' => 14,
            'mensuel' => 30,
        ];

        foreach ($map as $keyword => $days) {
            if (str_contains($normalized, $keyword)) {
                return $days;
            }
        }

        if (preg_match('/\d+/', $normalized, $matches)) {
            return max(1, (int) $matches[0]);
        }

        return 3;
    }

    private function toImmutable(\DateTimeInterface $dateTime): \DateTimeImmutable
    {
        return $dateTime instanceof \DateTimeImmutable
            ? $dateTime
            : \DateTimeImmutable::createFromInterface($dateTime);
    }

    private function sanitizeLocation(?string $location): string
    {
        return trim(mb_strtolower($location ?? ''));
    }

    private function isOutdoorLocation(string $location): bool
    {
        if ($location === '') {
            return false;
        }

        $keywords = ['ext', 'jardin', 'balcon', 'terrasse', 'serre', 'patio', 'veranda', 'cour'];
        foreach ($keywords as $keyword) {
            if (str_contains($location, $keyword)) {
                return true;
            }
        }

        return false;
    }

    private function diffInDays(\DateTimeImmutable $from, \DateTimeImmutable $to): int
    {
        $interval = $from->diff($to);
        $days = (int) $interval->format('%r%a');

        return $days < 0 ? 0 : $days;
    }
}


