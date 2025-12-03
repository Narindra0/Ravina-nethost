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
    public function compute(UserPlantation $plantation, array $meteoData, ?SuiviSnapshot $lastSnapshot = null, bool $isManualWatering = false): array
    {
        $template = $plantation->getPlantTemplate();
        $baseQuantity = (float) ($template?->getWateringQuantityMl() ?? 500);
        $frequencyDays = $this->resolveFrequencyDays((string) $template?->getWateringFrequency());

        $todayDate = new \DateTimeImmutable('today');
        $lastWateredAt = $this->resolveLastWateredAt($plantation, $lastSnapshot);
        $referenceDate = $lastWateredAt;

        if ($isManualWatering) {
            $referenceDate = $todayDate;
            $lastWateredAt = $todayDate;
        }

        $frequencyInterval = new \DateInterval(sprintf('P%dD', max(1, $frequencyDays)));

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
            
            // 1. Vérifier la pluie AUJOURD'HUI (Auto-Arrosage)
            if (is_array($today) && isset($today['precipitation_sum']) && $today['precipitation_sum'] >= 5) {
                $message = sprintf(
                    'Pluie détectée aujourd\'hui (%.1f mm). L\'arrosage est validé automatiquement et le cycle est réinitialisé.',
                    $today['precipitation_sum']
                );

                $autoValidation = [
                    'validated_at' => $todayDate->format(\DateTimeInterface::ATOM),
                    'validated_for' => $todayDate->format('Y-m-d'), // Validé pour aujourd'hui
                    'reason' => 'rain',
                    'precipitation_sum' => (float) $today['precipitation_sum'],
                    'message' => $message,
                ];

                $decisions[] = $message;
                $cards[] = [
                    'type' => 'watering_auto',
                    'severity' => 'success', // Succès car ça remplace l'action utilisateur
                    'message' => $message,
                ];

                // Réinitialiser le cycle à partir d'aujourd'hui
                $referenceDate = $todayDate;
                $lastWateredAt = $todayDate;
                $nextDate = $referenceDate->add($frequencyInterval);
                $daysUntilNext = $this->diffInDays($todayDate, $nextDate);
            }
            // 2. Sinon, vérifier la pluie le jour prévu (Annulation simple)
            elseif (is_array($forecastDay) && isset($forecastDay['precipitation_sum']) && $forecastDay['precipitation_sum'] !== null && $forecastDay['precipitation_sum'] >= 5) {
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
                    'reason' => 'rain_forecast', // Distinction avec 'rain' (réel)
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

        // Calcul de la pluie cumulée (Aujourd'hui + Demain)
        $rainToday = (float) ($today['precipitation_sum'] ?? 0);
        $rainTomorrow = (float) ($tomorrow['precipitation_sum'] ?? 0);
        $cumulativeRain = $rainToday + $rainTomorrow;

        // SEUIL DANGER PLUIE (30mm en 2 jours)
        if ($isOutdoor && $cumulativeRain >= 30) {
            $plantName = mb_strtolower($template?->getName() ?? '');
            $plantType = mb_strtolower($template?->getType() ?? '');
            $stage = mb_strtolower($lastSnapshot?->getStadeActuel() ?? '');

            $alertMessage = '';
            $advice = '';

            // 1. Logique Spécifique par NOM
            if (str_contains($plantName, 'tomate') || str_contains($plantName, 'pomme de terre')) {
                $alertMessage = sprintf('Alerte Mildiou (Pluie %.1fmm).', $cumulativeRain);
                $advice = 'Risque élevé de Mildiou. Surveillez les taches brunes sur les feuilles et évitez absolument de mouiller le feuillage.';
            } elseif (str_contains($plantName, 'fraise') || str_contains($plantName, 'laitue') || str_contains($plantName, 'salade')) {
                $alertMessage = sprintf('Risque Pourriture (Pluie %.1fmm).', $cumulativeRain);
                $advice = 'Sol détrempé : risque de pourriture et limaces. Paillez et surélevez les fruits si possible.';
            } elseif (str_contains($plantName, 'cactus') || str_contains($plantName, 'succulente') || str_contains($plantName, 'plante grasse')) {
                $alertMessage = 'DANGER MORTEL : Excès d\'eau critique.';
                $advice = 'Rentrez vos plantes ou couvrez-les impérativement. Elles ne supporteront pas cette quantité d\'eau.';
            } 
            // 2. Logique Spécifique par TYPE et STADE (Fruits)
            elseif ((str_contains($plantType, 'fruit') || str_contains($plantName, 'tomate') || str_contains($plantName, 'cerise')) && 
                   (str_contains($stage, 'fructification') || str_contains($stage, 'maturation'))) {
                $alertMessage = sprintf('Risque Éclatement (Pluie %.1fmm).', $cumulativeRain);
                $advice = 'Les fruits gorgés d\'eau risquent d\'éclater. Récoltez les fruits mûrs immédiatement avant la pluie !';
            }
            // 3. Logique Générale par TYPE
            elseif (str_contains($plantType, 'légume')) {
                $alertMessage = sprintf('Alerte Fortes Pluies (%.1fmm).', $cumulativeRain);
                $advice = 'Risque de maladies fongiques et d\'asphyxie racinaire. Assurez un bon drainage.';
            } elseif (str_contains($plantType, 'fleur')) {
                $alertMessage = sprintf('Pluie Intense (%.1fmm).', $cumulativeRain);
                $advice = 'Risque d\'abîmer les fleurs fragiles. Protégez-les ou tuteurez-les si possible.';
            } 
            // 4. Défaut
            else {
                $alertMessage = sprintf('Alerte Fortes Pluies (%.1fmm).', $cumulativeRain);
                $advice = 'Risque de saturation du sol. N\'arrosez surtout pas et vérifiez le drainage.';
            }

            $fullMessage = $alertMessage . ' ' . $advice;
            $decisions[] = $fullMessage;
            $cards[] = [
                'type' => 'danger_alert',
                'severity' => 'warning',
                'message' => $fullMessage,
            ];
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

        $quantity = round($quantity, 2);

        return [
            'date' => $nextDate,
            'quantity' => $quantity,
            'notes' => $decisions,
            'frequency_days' => $frequencyDays,
            'auto_validation' => $autoValidation,
            'temperature_advice' => $temperatureAdvice,
            'cards' => $cards,
            'last_watered_at' => $lastWateredAt,
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

        return (int) $interval->format('%r%a');
    }

    private function resolveLastWateredAt(UserPlantation $plantation, ?SuiviSnapshot $lastSnapshot): \DateTimeImmutable
    {
        $decisionDetails = $lastSnapshot?->getDecisionDetailsJson();
        $raw = is_array($decisionDetails) ? ($decisionDetails['last_watered_at'] ?? null) : null;

        if ($raw instanceof \DateTimeInterface) {
            return $this->toImmutable($raw);
        }

        if (is_string($raw) && trim($raw) !== '') {
            try {
                return new \DateTimeImmutable($raw);
            } catch (\Throwable) {
                // fallback handled below
            }
        }

        if (is_array($decisionDetails) && ($decisionDetails['manual'] ?? false)) {
            $manualDate = $lastSnapshot?->getDateSnapshot();
            if ($manualDate instanceof \DateTimeInterface) {
                return $this->toImmutable($manualDate);
            }
        }

        $fallback = $plantation->getConfirmationPlantation()
            ?? $plantation->getDatePlantation()
            ?? new \DateTimeImmutable('today');

        return $this->toImmutable($fallback);
    }
}


