<?php

namespace App\Repository;

use App\Entity\ActivationCode;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ActivationCode>
 */
class ActivationCodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ActivationCode::class);
    }

    /**
     * Trouve un code d'activation valide par son code
     */
    public function findValidCode(string $code): ?ActivationCode
    {
        return $this->createQueryBuilder('ac')
            ->andWhere('ac.code = :code')
            ->andWhere('ac.isActive = :active')
            ->setParameter('code', strtoupper($code))
            ->setParameter('active', true)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
