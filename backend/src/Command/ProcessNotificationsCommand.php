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
            ->andWhere('p.etatActuel = :status')
            ->setParameter('status', UserPlantation::STATUS_ACTIVE)
            ->getQuery()
            ->getResult();

        $io->text(sprintf('%d plantations actives à analyser.', count($plantations)));

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

        $this->handleRainCancellation($plantation, $forecast, $nextWateringDate, $plantNames, $today, $io);
        $this->handlePlantationReminders($plantation, $plantName, $today, $io);
        $this->handleWateringReminder($plantation, $nextWateringDate, $forecast, $plantNames, $today, $now, $io);
        $this->handleWateringOverdue($plantation, $nextWateringDate, $plantNames, $now, $io);
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
        array $plantNames,
        DateTimeImmutable $today,
        SymfonyStyle $io,
    ): void {
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
}


