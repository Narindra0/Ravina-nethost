<?php

namespace App\DataProcessor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\SuiviSnapshot;
use App\Entity\User;
use App\Entity\UserPlantation;
use App\Enum\NotificationType;
use App\Service\LifecycleService;
use App\Service\MeteoService;
use App\Service\NotificationService;
use App\Service\WateringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class UserPlantationProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): UserPlantation
    {
        if (!$data instanceof UserPlantation) {
            throw new \RuntimeException('UserPlantationProcessor ne peut traiter que UserPlantation.');
        }

        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new AccessDeniedException('Authentification requise pour créer une plantation.');
        }

        $data->setUser($user);

        if ($data->getDatePlantation() === null) {
            $data->setDatePlantation(new \DateTimeImmutable('today'));
        }

        // Gestion de la confirmation de plantation selon la date choisie
        $today = new \DateTimeImmutable('today');
        $plantationDate = $data->getDatePlantation() instanceof \DateTimeInterface
            ? \DateTimeImmutable::createFromInterface($data->getDatePlantation())
            : $today;

        // Cas 1 : date future -> en attente de confirmation, pas de date de confirmation
        if ($plantationDate > $today) {
            $data->setConfirmationPlantation(null);
        } else {
            // Cas 2 : aujourd'hui -> confirmation automatique
            // Cas 3 : date passée -> confirmation sur la date réelle indiquée
            $data->setConfirmationPlantation($plantationDate);
        }

        if ($data->getEtatActuel() === null) {
            $data->setEtatActuel(UserPlantation::STATUS_ACTIVE);
        }

        $latitude = (float) $data->getGeolocalisationLat();
        $longitude = (float) $data->getGeolocalisationLon();
        $meteo = $this->meteoService->fetchDailyForecast($latitude, $longitude);
        $lifecycle = $this->lifecycleService->compute($data);
        $lastSnapshot = $data->getSuiviSnapshots()->first() ?: null;
        if ($lastSnapshot instanceof SuiviSnapshot) {
            // for new entity there should be none, but keep for consistency
        } else {
            $lastSnapshot = null;
        }
        $watering = $this->wateringService->compute($data, $meteo, $lastSnapshot);

        // On ne crée un premier snapshot que si la plantation est confirmée
        $shouldCreateSnapshot = $data->getConfirmationPlantation() instanceof \DateTimeInterface;

        if ($shouldCreateSnapshot) {
            $snapshot = new SuiviSnapshot();
            $snapshot->setDateSnapshot(new \DateTimeImmutable());
            $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
            $snapshot->setStadeActuel((string) $lifecycle['stage']);
            $snapshot->setArrosageRecoDate($watering['date']);
            $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
            $decisionDetails = [
                'lifecycle' => $lifecycle['details'] ?? [],
                'watering_notes' => $watering['notes'] ?? [],
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

            $data->addSuiviSnapshot($snapshot);
        }

        $isNew = $data->getId() === null;

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        if ($isNew) {
            $this->notifyLateRegistrationIfNeeded($data, $user, $plantationDate, $today);
        }

        return $data;
    }

    private function notifyLateRegistrationIfNeeded(
        UserPlantation $plantation,
        User $user,
        \DateTimeImmutable $plantationDate,
        \DateTimeImmutable $today,
    ): void {
        if ($plantationDate >= $today) {
            return;
        }

        $delayDays = (int) $plantationDate->diff($today)->format('%a');
        if ($delayDays <= 0) {
            return;
        }

        $plantName = $plantation->getPlantTemplate()?->getName() ?? 'votre plante';

        $this->notificationService->createNotification(
            $user,
            NotificationType::PLANTATION_RETARD,
            [
                'plant_name' => $plantName,
                'delay_days' => $delayDays,
            ],
            $plantation
        );
    }
}


