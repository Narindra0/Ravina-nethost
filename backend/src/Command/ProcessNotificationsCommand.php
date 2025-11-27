<?php

namespace App\Command;

use App\Entity\UserPlantation;
use App\Enum\NotificationType;
use App\Repository\NotificationRepository;
use App\Repository\SuiviSnapshotRepository;
use App\Repository\UserPlantationRepository;
use App\Service\MeteoService;
use App\Service\NotificationService;
use App\Service\WateringService;
use DateInterval;
use DateTimeImmutable;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:notifications:process',
    description: 'Génère les notifications météo, plantation et arrosage.',
)]
class ProcessNotificationsCommand extends Command
{
    private const RAIN_THRESHOLD_MM = 5.0;
    private const REMINDER_HOUR = 17;
    private const OVERDUE_HOURS = 48;

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $forecastCache = [];

    public function __construct(
        private readonly UserPlantationRepository $plantationRepository,
        private readonly SuiviSnapshotRepository $snapshotRepository,
        private readonly MeteoService $meteoService,
        private readonly WateringService $wateringService,
        private readonly NotificationService $notificationService,
        private readonly NotificationRepository $notificationRepository,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Traitement des notifications automatiques');

        $plantations = $this->plantationRepository->createQueryBuilder('p')
            ->andWhere('p.etatActuel IN (:statuses)')
            ->setParameter('statuses', [UserPlantation::STATUS_ACTIVE, UserPlantation::STATUS_PLANNED])
            ->getQuery()
            ->getResult();

        $io->text(sprintf('%d plantations (actives et en attente) à analyser.', count($plantations)));

        $processed = 0;
        foreach ($plantations as $plantation) {
            if (!$plantation instanceof UserPlantation || $plantation->getUser() === null) {
                continue;
            }

            $this->processPlantation($plantation, $io);
            ++$processed;
        }

        $io->success(sprintf('Notifications traitées pour %d plantations.', $processed));

        return Command::SUCCESS;
    }

    private function processPlantation(UserPlantation $plantation, SymfonyStyle $io): void
    {
        $today = new DateTimeImmutable('today');
        $now = new DateTimeImmutable();
        $plantationId = $plantation->getId();

        if ($plantationId === null) {
            return;
        }

        $forecast = $this->getForecast($plantation);
        $latestSnapshot = $this->snapshotRepository->findLatestForPlantation($plantationId);
        $wateringData = $this->wateringService->compute($plantation, $forecast, $latestSnapshot);
        $nextWateringDate = $wateringData['date'] ?? null;

        $plantName = $plantation->getPlantTemplate()?->getName() ?? 'votre plante';
        $plantNames = [$plantName];

        $autoValidation = $wateringData['auto_validation'] ?? null;

        $this->handleRainCancellation($plantation, $forecast, $nextWateringDate, $autoValidation, $plantNames, $today, $io);
        $this->handleWeatherAlerts($plantation, $wateringData, $plantNames, $today, $io);
        $this->handlePlantationReminders($plantation, $plantName, $today, $io);
        $this->handlePlantationOverdue($plantation, $plantName, $today, $io);
        $this->handleHarvestReminder($plantation, $plantName, $today, $io);
        $this->handleFertilizationRecommendation($plantation, $plantNames, $today, $io);
        $this->handleWateringReminder($plantation, $nextWateringDate, $forecast, $plantNames, $today, $now, $io);
        $this->handleWateringOverdue($plantation, $nextWateringDate, $plantNames, $now, $io);
        
        // Auto-delete must be last (after all notifications)
        $this->handlePlantationAutoDelete($plantation, $today, $io);
    }

    private function handleWeatherAlerts(
        UserPlantation $plantation,
        array $wateringData,
        array $plantNames,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        $cards = $wateringData['cards'] ?? [];
        $alertCard = null;

        foreach ($cards as $card) {
            if (($card['type'] ?? '') === 'danger_alert') {
                $alertCard = $card;
                break;
            }
        }

        if (!$alertCard) {
            return;
        }

        // Éviter de spammer l'alerte (une fois par jour max)
        if ($this->notificationServiceAlreadySent($plantation, NotificationType::ALERTE_METEO, $today)) {
            return;
        }

        $this->notificationService->createNotification(
            $plantation->getUser(),
            NotificationType::ALERTE_METEO,
            [
                'plant_names' => $plantNames,
                'message' => $alertCard['message'] ?? 'Alerte météo importante.',
                'severity' => $alertCard['severity'] ?? 'warning',
            ],
            $plantation
        );

        $io->text(sprintf('🌩️ Notification Alerte Météo créée pour la plantation #%d.', $plantation->getId()));
    }

    /**
     * @return array<string, mixed>
     */
    private function getForecast(UserPlantation $plantation): array
    {
        $lat = (float) $plantation->getGeolocalisationLat();
        $lon = (float) $plantation->getGeolocalisationLon();
        $cacheKey = sprintf('%0.2f_%0.2f', $lat, $lon);

        if (!isset($this->forecastCache[$cacheKey])) {
            $this->forecastCache[$cacheKey] = $this->meteoService->fetchDailyForecast($lat, $lon, 3);
        }

        return $this->forecastCache[$cacheKey];
    }

    private function handleRainCancellation(
        UserPlantation $plantation,
        array $forecast,
        ?\DateTimeInterface $nextWateringDate,
        ?array $autoValidation,
        array $plantNames,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        // 1. Vérifier si une auto-validation "pluie" a eu lieu (nouveau système)
        if ($autoValidation !== null && ($autoValidation['reason'] ?? '') === 'rain') {
            if ($this->notificationServiceAlreadySent($plantation, NotificationType::PLUIE, $today)) {
                return;
            }

            $precipitation = $autoValidation['precipitation_sum'] ?? 0;
            
            $this->notificationService->createNotification(
                $plantation->getUser(),
                NotificationType::PLUIE,
                [
                    'plant_names' => $plantNames,
                    'precipitation_sum' => $precipitation,
                    'message' => 'Pluie détectée. Arrosage validé automatiquement.',
                ],
                $plantation
            );

            $io->text(sprintf('🌧️ Notification pluie (auto-arrosage) créée pour la plantation #%d.', $plantation->getId()));
            return;
        }

        // 2. Ancien système (Annulation simple si pluie prévue le jour même)
        $daily = $forecast['daily'][0] ?? null;
        $precipitation = is_array($daily) ? ($daily['precipitation_sum'] ?? 0) : 0;

        if ($nextWateringDate === null || $precipitation === null) {
            return;
        }

        $sameDay = $nextWateringDate->format('Y-m-d') === $today->format('Y-m-d');
        if (!$sameDay || $precipitation < self::RAIN_THRESHOLD_MM) {
            return;
        }

        if ($this->notificationServiceAlreadySent($plantation, NotificationType::PLUIE, $today)) {
            return;
        }

        $this->notificationService->createNotification(
            $plantation->getUser(),
            NotificationType::PLUIE,
            [
                'plant_names' => $plantNames,
                'precipitation_sum' => $precipitation,
            ],
            $plantation
        );

        $io->text(sprintf('🌧️ Notification pluie créée pour la plantation #%d.', $plantation->getId()));
    }

    private function handlePlantationReminders(
        UserPlantation $plantation,
        string $plantName,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        $plannedDate = $plantation->getDatePlantation();
        if (!$plannedDate instanceof \DateTimeInterface || $plantation->getConfirmationPlantation() !== null) {
            return;
        }

        $plannedImmutable = DateTimeImmutable::createFromInterface($plannedDate);
        $diff = (int) $today->diff($plannedImmutable)->format('%r%a');

        if ($diff === 1 && !$this->notificationServiceAlreadySent($plantation, NotificationType::J_1_PLANTATION, $today)) {
            $this->notificationService->createNotification(
                $plantation->getUser(),
                NotificationType::J_1_PLANTATION,
                [
                    'plant_name' => $plantName,
                    'date' => $plannedImmutable,
                ],
                $plantation
            );
            $io->text(sprintf('⏰ Notification J-1 pour plantation #%d.', $plantation->getId()));
        }

        if ($diff === 0 && !$this->notificationServiceAlreadySent($plantation, NotificationType::JOUR_J_PLANTATION, $today)) {
            $this->notificationService->createNotification(
                $plantation->getUser(),
                NotificationType::JOUR_J_PLANTATION,
                [
                    'plant_name' => $plantName,
                    'date' => $plannedImmutable,
                ],
                $plantation
            );
            $io->text(sprintf('🚀 Notification Jour J pour plantation #%d.', $plantation->getId()));
        }
    }

    private function handleWateringReminder(
        UserPlantation $plantation,
        ?\DateTimeInterface $nextWateringDate,
        array $forecast,
        array $plantNames,
        DateTimeImmutable $today,
        DateTimeImmutable $now,
        SymfonyStyle $io,
    ): void {
        if (!$nextWateringDate instanceof \DateTimeInterface) {
            return;
        }

        $isToday = $nextWateringDate->format('Y-m-d') === $today->format('Y-m-d');
        if (!$isToday || (int) $now->format('H') < self::REMINDER_HOUR) {
            return;
        }

        $precipitation = $forecast['daily'][0]['precipitation_sum'] ?? 0;
        if ($precipitation !== null && $precipitation >= self::RAIN_THRESHOLD_MM) {
            return;
        }

        if ($this->notificationServiceAlreadySent($plantation, NotificationType::ARROSAGE_RAPPEL, $today)) {
            return;
        }

        $this->notificationService->createNotification(
            $plantation->getUser(),
            NotificationType::ARROSAGE_RAPPEL,
            [
                'plant_names' => $plantNames,
                'time' => sprintf('%sh00', self::REMINDER_HOUR),
            ],
            $plantation
        );

        $io->text(sprintf('💧 Rappel arrosage pour plantation #%d.', $plantation->getId()));
    }

    private function handleWateringOverdue(
        UserPlantation $plantation,
        ?\DateTimeInterface $nextWateringDate,
        array $plantNames,
        DateTimeImmutable $now,
        SymfonyStyle $io,
    ): void {
        if (!$nextWateringDate instanceof \DateTimeInterface) {
            return;
        }

        $next = DateTimeImmutable::createFromInterface($nextWateringDate);
        if ($next >= $now->sub(new DateInterval(sprintf('PT%dH', self::OVERDUE_HOURS)))) {
            return;
        }

        if ($this->notificationServiceAlreadySent($plantation, NotificationType::ARROSAGE_OUBLIE, $now->sub(new DateInterval('P1D')))) {
            return;
        }

        $interval = $next->diff($now);
        $delayHours = max(
            self::OVERDUE_HOURS,
            ($interval->days * 24) + $interval->h
        );
        $this->notificationService->createNotification(
            $plantation->getUser(),
            NotificationType::ARROSAGE_OUBLIE,
            [
                'plant_names' => $plantNames,
                'delay_hours' => max(self::OVERDUE_HOURS, $delayHours),
            ],
            $plantation
        );

        $io->text(sprintf('⚠️ Arrosage oublié pour plantation #%d.', $plantation->getId()));
    }

    private function handleHarvestReminder(
        UserPlantation $plantation,
        string $plantName,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        // Only for confirmed plantations
        $confirmedDate = $plantation->getConfirmationPlantation();
        if (!$confirmedDate instanceof \DateTimeInterface) {
            return;
        }

        $template = $plantation->getPlantTemplate();
        $expectedHarvestDays = $template?->getExpectedHarvestDays();
        if (!$expectedHarvestDays || $expectedHarvestDays <= 0) {
            return;
        }

        // Calculate expected harvest date
        $confirmed = DateTimeImmutable::createFromInterface($confirmedDate);
        $expectedHarvestDate = $confirmed->add(new DateInterval(sprintf('P%dD', $expectedHarvestDays)));

        // Calculate days until harvest
        $daysUntilHarvest = (int) $today->diff($expectedHarvestDate)->format('%r%a');

        // Send notification 7 days before harvest
        if ($daysUntilHarvest === 7 && !$this->notificationServiceAlreadySent($plantation, NotificationType::RECOLTE_PROCHE, $today)) {
            $this->notificationService->createNotification(
                $plantation->getUser(),
                NotificationType::RECOLTE_PROCHE,
                [
                    'plant_name' => $plantName,
                    'days_remaining' => 7,
                    'harvest_date' => $expectedHarvestDate,
                ],
                $plantation
            );
            $io->text(sprintf('🎉 Notification récolte proche pour plantation #%d.', $plantation->getId()));
        }
    }

    private function handleFertilizationRecommendation(
        UserPlantation $plantation,
        array $plantNames,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        // Only for confirmed plantations
        $confirmedDate = $plantation->getConfirmationPlantation();
        if (!$confirmedDate instanceof \DateTimeInterface) {
            return;
        }

        $template = $plantation->getPlantTemplate();
        $expectedHarvestDays = $template?->getExpectedHarvestDays();
        if (!$expectedHarvestDays || $expectedHarvestDays <= 0) {
            return;
        }

        // Calculate plant age in days
        $confirmed = DateTimeImmutable::createFromInterface($confirmedDate);
        $plantAgeDays = (int) $confirmed->diff($today)->format('%a');

        // Calculate growth percentage
        $growthPercentage = ($plantAgeDays / $expectedHarvestDays) * 100;

        // Determine current phase and if we should notify
        $phase = null;
        $shouldNotify = false;

        // Phase transitions: Végétative (~20%), Floraison (~40%), Fructification (~70%)
        if ($growthPercentage >= 18 && $growthPercentage <= 22) {
            $phase = 'végétative';
            $shouldNotify = true;
        } elseif ($growthPercentage >= 38 && $growthPercentage <= 42) {
            $phase = 'floraison';
            $shouldNotify = true;
        } elseif ($growthPercentage >= 68 && $growthPercentage <= 72) {
            $phase = 'fructification';
            $shouldNotify = true;
        }

        if ($shouldNotify && $phase && !$this->notificationServiceAlreadySent($plantation, NotificationType::FERTILISATION_RECOMMANDEE, $today->sub(new DateInterval('P7D')))) {
            $this->notificationService->createNotification(
                $plantation->getUser(),
                NotificationType::FERTILISATION_RECOMMANDEE,
                [
                    'plant_names' => $plantNames,
                    'phase' => $phase,
                    'growth_percentage' => $growthPercentage,
                ],
                $plantation
            );
            $io->text(sprintf('🌿 Notification fertilisation (%s) pour plantation #%d.', $phase, $plantation->getId()));
        }
    }

    private function notificationServiceAlreadySent(
        UserPlantation $plantation,
        NotificationType $type,
        DateTimeImmutable $since,
    ): bool {
        $sinceStart = $since->setTime(0, 0);

        return $this->notificationRepository->hasRecentNotificationForPlantation(
            $plantation->getId() ?? 0,
            $type->value,
            $sinceStart
        );
    }

    private function handlePlantationOverdue(
        UserPlantation $plantation,
        string $plantName,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        // Only for ATTENTE plantations that are not confirmed
        if ($plantation->getEtatActuel() !== UserPlantation::STATUS_PLANNED) {
            return;
        }

        $plannedDate = $plantation->getDatePlantation();
        if (!$plannedDate instanceof \DateTimeInterface || $plantation->getConfirmationPlantation() !== null) {
            return;
        }

        $plannedImmutable = DateTimeImmutable::createFromInterface($plannedDate);
        $delayDays = (int) $plannedImmutable->diff($today)->format('%r%a');

        // Only send notifications if the plantation is overdue (delay >= 2)
        if ($delayDays < 2) {
            return;
        }

        // Send notification at J+2, J+5, J+8, J+11 (every 3 days starting from J+2)
        // J+2: delayDays = 2
        // J+5: delayDays = 5
        // J+8: delayDays = 8
        // J+11: delayDays = 11
        // Pattern: delayDays = 2, 5, 8, 11 => (delayDays - 2) % 3 == 0
        if (($delayDays - 2) % 3 !== 0) {
            return;
        }

        // Avoid sending duplicate notifications (check if sent in last 2 days)
        if ($this->notificationServiceAlreadySent($plantation, NotificationType::PLANTATION_RETARD, $today->sub(new DateInterval('P2D')))) {
            return;
        }

        $this->notificationService->createNotification(
            $plantation->getUser(),
            NotificationType::PLANTATION_RETARD,
            [
                'plant_name' => $plantName,
                'delay_days' => $delayDays,
            ],
            $plantation
        );

        $io->text(sprintf('⚠️ Notification plantation en retard (J+%d) pour plantation #%d.', $delayDays, $plantation->getId()));
    }

    private function handlePlantationAutoDelete(
        UserPlantation $plantation,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
        // Only for ATTENTE plantations that are not confirmed
        if ($plantation->getEtatActuel() !== UserPlantation::STATUS_PLANNED) {
            return;
        }

        $plannedDate = $plantation->getDatePlantation();
        if (!$plannedDate instanceof \DateTimeInterface || $plantation->getConfirmationPlantation() !== null) {
            return;
        }

        $plannedImmutable = DateTimeImmutable::createFromInterface($plannedDate);
        $delayDays = (int) $plannedImmutable->diff($today)->format('%r%a');

        // Auto-delete after 13 days without confirmation
        if ($delayDays >= 13) {
            $plantationId = $plantation->getId();
            $plantName = $plantation->getPlantTemplate()?->getName() ?? 'plante inconnue';
            
            $this->entityManager->remove($plantation);
            $this->entityManager->flush();
            
            $io->text(sprintf('🗑️ Plantation #%d (%s) supprimée automatiquement après %d jours sans confirmation.', $plantationId, $plantName, $delayDays));
        }
    }
}


