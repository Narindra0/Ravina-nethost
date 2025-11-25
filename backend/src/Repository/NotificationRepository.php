<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Notification>
 *
 * @method Notification|null find($id, $lockMode = null, $lockVersion = null)
 * @method Notification|null findOneBy(array $criteria, array $orderBy = null)
 * @method Notification[]    findAll()
 * @method Notification[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    public function hasRecentNotificationForPlantation(int $plantationId, string $type, \DateTimeInterface $since): bool
    {
        $count = $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->andWhere('n.userPlantation = :plantation')
            ->andWhere('n.type = :type')
            ->andWhere('n.createdAt >= :since')
            ->setParameter('plantation', $plantationId)
            ->setParameter('type', $type)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $count > 0;
    }

    public function countUnreadForUser(User $user): int
    {
        $count = $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->andWhere('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $count;
    }

    /**
     * @return array{items: Notification[], total: int}
     */
    public function findPaginatedForUser(User $user, int $page, int $limit, bool $onlyUnread = false): array
    {
        $page = max(1, $page);
        $limit = max(1, $limit);

        $baseQb = $this->createQueryBuilder('n')
            ->andWhere('n.user = :user')
            ->setParameter('user', $user);

        if ($onlyUnread) {
            $baseQb->andWhere('n.isRead = false');
        }

        $total = (int) (clone $baseQb)
            ->select('COUNT(n.id)')
            ->getQuery()
            ->getSingleScalarResult();

        $items = $baseQb
            ->orderBy('n.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return [
            'items' => $items,
            'total' => $total,
        ];
    }
}


