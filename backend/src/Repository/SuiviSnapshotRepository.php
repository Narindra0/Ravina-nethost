<?php

namespace App\Repository;

use App\Entity\SuiviSnapshot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SuiviSnapshot>
 */
class SuiviSnapshotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SuiviSnapshot::class);
    }

    public function findLatestForPlantation(int $plantationId): ?SuiviSnapshot
    {
        return $this->createQueryBuilder('s')
            ->andWhere('IDENTITY(s.userPlantation) = :plantation')
            ->setParameter('plantation', $plantationId)
            ->orderBy('s.dateSnapshot', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}


