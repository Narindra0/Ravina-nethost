<?php

namespace App\Service;

use App\Enum\NotificationType;
use DateTimeImmutable;
use DateTimeInterface;

class NotificationFormatter
{
    /**
     * @param NotificationType $type
     * @param array<string, mixed> $context
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
            NotificationType::PLANTATION_SUPPRIMEE => $this->formatPlantationSupprimee($context),
            NotificationType::RECOLTE_PROCHE => $this->formatRecolteProche($context),
            NotificationType::FERTILISATION_RECOMMANDEE => $this->formatFertilisationRecommandee($context),
            NotificationType::ALERTE_METEO => $this->formatAlerteMeteo($context),
        };
    }

    private function formatPluie(array $context): array
    {
        $plants = $this->formatPlantNames($context);

        return [
            'title' => 'Pluie prévue aujourd\'hui',
            'message' => sprintf(
                "Pluie prévue aujourd'hui, l'arrosage des %s n'est plus nécessaire.",
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
                // Correction : suppression du backslash inutile devant l'apostrophe dans une chaîne à guillemets doubles
                "C'est aujourd'hui ! Commençons la plantation de %s.",
                $plant
            ),
        ];
    }

    private function formatArrosageRappel(array $context): array
    {
        $plants = $this->formatPlantNames($context);
        $time = $this->formatTime($context['time'] ?? null);

        return [
            'title' => "Rappel d'arrosage",
            'message' => sprintf(
                "N'oubliez pas d'arroser les %s%s.",
                $plants,
                $time ? " à {$time}" : ''
            ),
        ];
    }

    private function formatArrosageOublie(array $context): array
    {
        $plants = $this->formatPlantNames($context);
        // Cast en int pour la sécurité
        $delay = (int) ($context['delay_hours'] ?? 48);

        return [
            'title' => 'Arrosage manqué',
            'message' => sprintf(
                "Attention, arrosage manqué ! Vous avez oublié d'arroser les %s depuis plus de %d heures. Risque de dessèchement !",
                $plants,
                $delay
            ),
        ];
    }

    private function formatPlantationRetard(array $context): array
    {
        $plant = $this->formatSinglePlantName($context);
        $delayDays = max(1, (int) ($context['delay_days'] ?? 1));
        $isFinalWarning = (bool) ($context['final_warning'] ?? false);

        if ($isFinalWarning) {
            return [
                'title' => 'Dernier avertissement avant suppression',
                'message' => sprintf(
                    "Votre plantation %s est en attente depuis %d jour%s. Sans confirmation d'ici demain, elle sera supprimée automatiquement.",
                    $plant,
                    $delayDays,
                    $delayDays > 1 ? 's' : ''
                ),
            ];
        }

        return [
            'title' => 'Plantation en retard',
            'message' => sprintf(
                "Aucune action enregistrée sur %s depuis %d jour%s. Confirmez-la pour lancer le suivi et éviter sa suppression.",
                $plant,
                $delayDays,
                $delayDays > 1 ? 's' : ''
            ),
        ];
    }

    private function formatRecolteProche(array $context): array
    {
        $plant = $this->formatSinglePlantName($context);
        $daysRemaining = (int) ($context['days_remaining'] ?? 7);

        return [
            'title' => 'Récolte bientôt prête',
            'message' => sprintf(
                "Votre %s sera bientôt prête à récolter ! Récolte prévue dans %d jour%s.",
                $plant,
                $daysRemaining,
                $daysRemaining > 1 ? 's' : '' // 0 et 1 jour sont singuliers en français
            ),
        ];
    }

    private function formatFertilisationRecommandee(array $context): array
    {
        $plants = $this->formatPlantNames($context);
        $phase = $context['phase'] ?? 'croissance';
        
        $phaseText = match (strtolower((string)$phase)) {
            'vegetative', 'végétative' => 'la phase végétative',
            'flowering', 'floraison' => 'la floraison',
            'fruiting', 'fructification' => 'la fructification',
            default => 'une nouvelle phase de croissance',
        };

        return [
            'title' => 'Fertilisation recommandée',
            'message' => sprintf(
                "Vos %s ont atteint %s. Une fertilisation est recommandée pour optimiser la croissance.",
                $plants,
                $phaseText
            ),
        ];
    }

    private function formatAlerteMeteo(array $context): array
    {
        $message = (string) ($context['message'] ?? 'Alerte météo importante.');
        return [
            'title' => 'Alerte météo',
            'message' => $message,
        ];
    }

    private function formatPlantationSupprimee(array $context): array
    {
        $plant = $this->formatSinglePlantName($context);
        $delayDays = max(11, (int) ($context['delay_days'] ?? 11));

        return [
            'title' => sprintf('Plantation %s supprimée', $plant),
            'message' => sprintf(
                "Faute d'action depuis %d jour%s, la plantation %s a été supprimée automatiquement. Vous pouvez la recréer à tout moment.",
                $delayDays,
                $delayDays > 1 ? 's' : '',
                $plant
            ),
        ];
    }

    // --- Méthodes utilitaires ---

    private function formatPlantNames(array $context): string
    {
        $names = $context['plant_names'] ?? null;

        if (is_string($names)) {
            return $names;
        }

        // On s'assure que c'est bien un tableau et qu'il n'est pas vide
        if (is_array($names) && !empty($names)) {
            // Nettoyage : on s'assure que toutes les valeurs sont des chaînes
            $names = array_map('strval', array_values($names));

            if (count($names) === 1) {
                return $names[0];
            }

            $last = array_pop($names);
            return implode(', ', $names) . ' et ' . $last;
        }

        return 'vos plantes';
    }

    private function formatSinglePlantName(array $context): string
    {
        $name = $context['plant_name'] ?? null;
        if (is_string($name) && trim($name) !== '') {
            return $name;
        }
        // Fallback sur la méthode plurielle si le nom singulier est manquant
        return $this->formatPlantNames($context);
    }

    private function formatDate(mixed $date): string
    {
        if ($date instanceof DateTimeInterface) {
            return $date->format('d/m/Y');
        }

        if (is_string($date) && !empty($date)) {
            try {
                return (new DateTimeImmutable($date))->format('d/m/Y');
            } catch (\Exception) {
                // En cas de format invalide, on continue vers le fallback
            }
        }

        // Fallback : date du jour par défaut
        return (new DateTimeImmutable())->format('d/m/Y');
    }

    private function formatTime(mixed $time): ?string
    {
        if ($time instanceof DateTimeInterface) {
            return $time->format('H\hi');
        }

        if (is_string($time) && trim($time) !== '') {
            return $time;
        }

        return null;
    }
}