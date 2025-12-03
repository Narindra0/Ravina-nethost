<?php

namespace App\Command;

use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use App\Service\LifecycleService;
use App\Service\MeteoService;
use App\Service\WateringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:plantations:process', description: 'Met à jour quotidiennement les suivis de plantations actives.')]
class ProcessPlantationsCommand extends Command
{
    public function __construct(
        private readonly UserPlantationRepository $plantationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MeteoService $meteoService,
        private readonly LifecycleService $lifecycleService,
        private readonly WateringService $wateringService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $plantations = $this->plantationRepository->createQueryBuilder('p')
            ->where('p.etatActuel = :status')
            // On ne traite que les plantations confirmées
            ->andWhere('p.confirmationPlantation IS NOT NULL')
            ->setParameter('status', UserPlantation::STATUS_ACTIVE)
            ->getQuery()
            ->getResult();

        if ($plantations === []) {
            $io->success('Aucune plantation active à traiter.');
            return Command::SUCCESS;
        }

        $today = new \DateTimeImmutable('today');
        $processed = 0;

        foreach ($plantations as $plantation) {
            if (!$plantation instanceof UserPlantation) {
                continue;
            }

            $lastSnapshot = $plantation->getSuiviSnapshots()->first();
            if ($lastSnapshot instanceof SuiviSnapshot) {
                $lastDate = $lastSnapshot->getDateSnapshot();
                if ($lastDate instanceof \DateTimeInterface && $lastDate->format('Y-m-d') === $today->format('Y-m-d')) {
                    // Déjà calculé aujourd'hui
                    continue;
                }
            } else {
                $lastSnapshot = null;
            }

            $meteo = $this->meteoService->fetchDailyForecast(
                (float) $plantation->getGeolocalisationLat(),
                (float) $plantation->getGeolocalisationLon()
            );

            $lifecycle = $this->lifecycleService->compute($plantation);
            $watering = $this->wateringService->compute($plantation, $meteo, $lastSnapshot);

            $snapshot = new SuiviSnapshot();
            $snapshot->setUserPlantation($plantation);
            $snapshot->setDateSnapshot(new \DateTimeImmutable());
            $snapshot->setProgressionPourcentage(sprintf('%.2f', $lifecycle['progression']));
            $snapshot->setStadeActuel((string) $lifecycle['stage']);
            $snapshot->setArrosageRecoDate($watering['date']);
            $snapshot->setArrosageRecoQuantiteMl(sprintf('%.2f', $watering['quantity']));
            $snapshot->setDecisionDetailsJson([
                'lifecycle' => $lifecycle['details'] ?? [],
                'watering_notes' => $watering['notes'] ?? [],
                'frequency_days' => $watering['frequency_days'] ?? null,
                'last_watered_at' => $watering['last_watered_at'] instanceof \DateTimeInterface
                    ? $watering['last_watered_at']->format(\DateTimeInterface::ATOM)
                    : null,
            ]);
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

        $io->success(sprintf('%d plantation(s) traitée(s).', $processed));

        return Command::SUCCESS;
    }
}


