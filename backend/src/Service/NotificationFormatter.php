<?php

namespace App\Service;

use App\Enum\NotificationType;

class NotificationFormatter
{
    /**
     * @return array{title: string, message: string}
     */
    public function format(NotificationType $type, array $context = []): array
    {
        return match ($type) {
            NotificationType::PLUIE => $this->formatPluie($context),
            NotificationType::J_1_PLANTATION => $this->formatPlantationJMoinsUn($context),
            NotificationType::JOUR_J_PLANTATION => $this->formatPlantationJourJ($context),
            NotificationType::ARROSAGE_RAPPEL => $this->formatArrosageRappel($context),
            NotificationType::ARROSAGE_OUBLIE => $this->formatArrosageOublie($context),
            NotificationType::PLANTATION_RETARD => $this->formatPlantationRetard($context),
        };
    }

    private function formatPluie(array $context): array
    {
        $plants = $this->formatPlantNames($context);

        return [
            'title' => 'Pluie prévue aujourd\'hui',
            'message' => sprintf(
                'Pluie prévue aujourd\'hui, l\'arrosage des %s n\'est plus nécessaire.',
                $plants
            ),
        ];
    }

    private function formatPlantationJMoinsUn(array $context): array
    {
        $plant = $this->formatSinglePlantName($context);
        $date = $this->formatDate($context['date'] ?? null);

        return [
            'title' => 'Plantation demain',
            'message' => sprintf(
                'Préparez-vous, votre plantation de %s est prévue pour demain (%s).',
                $plant,
                $date
            ),
        ];
    }

    private function formatPlantationJourJ(array $context): array
    {
        $plant = $this->formatSinglePlantName($context);

        return [
            'title' => 'Jour de plantation',
            'message' => sprintf(
                'C\'est aujourd\'hui ! Commençons la plantation de %s.',
                $plant
            ),
        ];
    }

    private function formatArrosageRappel(array $context): array
    {
        $plants = $this->formatPlantNames($context);
        $time = $this->formatTime($context['time'] ?? null);

        return [
            'title' => 'Rappel d\'arrosage',
            'message' => sprintf(
                'N\'oubliez pas d\'arroser les %s%s.',
                $plants,
                $time ? " à {$time}" : ''
            ),
        ];
    }

    private function formatArrosageOublie(array $context): array
    {
        $plants = $this->formatPlantNames($context);
        $delay = $context['delay_hours'] ?? 48;

        return [
            'title' => 'Arrosage manqué',
            'message' => sprintf(
                'Attention, arrosage manqué ! Vous avez oublié d\'arroser les %s depuis plus de %d heures. Risque de dessèchement !',
                $plants,
                $delay
            ),
        ];
    }

    private function formatPlantationRetard(array $context): array
    {
        $plant = $this->formatSinglePlantName($context);
        $delayDays = max(1, (int) ($context['delay_days'] ?? 1));

        return [
            'title' => 'Enregistrement tardif',
            'message' => sprintf(
                'Vous avez enregistré la plantation de %s avec %d jour%s de retard par rapport à la date de plantation effective.%s',
                $plant,
                $delayDays,
                $delayDays > 1 ? 's' : '',
                PHP_EOL . 'Afin d\'assurer un suivi précis de vos cultures, nous vous recommandons d\'enregistrer vos plantations dès qu\'elles sont effectuées.'
            ),
        ];
    }

    private function formatPlantNames(array $context): string
    {
        $names = $context['plant_names'] ?? null;

        if (is_string($names)) {
            return $names;
        }

        if (is_array($names) && $names !== []) {
            if (count($names) === 1) {
                return (string) $names[0];
            }

            $last = array_pop($names);
            return implode(', ', $names) . ' et ' . $last;
        }

        return 'vos plantes';
    }

    private function formatSinglePlantName(array $context): string
    {
        $name = $context['plant_name'] ?? null;

        if (is_string($name) && $name !== '') {
            return $name;
        }

        return $this->formatPlantNames($context);
    }

    private function formatDate(null|string|\DateTimeInterface $date): string
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('d/m/Y');
        }

        if (is_string($date)) {
            try {
                return (new \DateTimeImmutable($date))->format('d/m/Y');
            } catch (\Exception) {
                // ignore
            }
        }

        return (new \DateTimeImmutable())->format('d/m/Y');
    }

    private function formatTime(null|string|\DateTimeInterface $time): ?string
    {
        if ($time instanceof \DateTimeInterface) {
            return $time->format('H\hi');
        }

        if (is_string($time) && $time !== '') {
            return $time;
        }

        return null;
    }
}


