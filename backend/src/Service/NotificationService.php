<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\User;
use App\Entity\UserPlantation;
use App\Enum\NotificationType;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly NotificationRepository $notificationRepository,
        private readonly NotificationFormatter $formatter,
    ) {
    }

    public function createNotification(
        User $user,
        NotificationType $type,
        array $context = [],
        ?UserPlantation $plantation = null,
        bool $flush = true,
    ): Notification {
        $formatted = $this->formatter->format($type, $context);

        $notification = (new Notification())
            ->setUser($user)
            ->setType($type)
            ->setTitle($formatted['title'])
            ->setMessage($formatted['message'])
            ->setMetadata($this->normalizeContext($context))
            ->setUserPlantation($plantation);

        $this->entityManager->persist($notification);

        if ($flush) {
            $this->entityManager->flush();
        }

        return $notification;
    }

    /**
     * @return Notification[]
     */
    public function getUnreadNotifications(User $user, int $limit = 10): array
    {
        return $this->notificationRepository->findPaginatedForUser($user, 1, $limit, true)['items'];
    }

    /**
     * @return array{items: Notification[], total: int}
     */
    public function getNotificationsForUser(User $user, int $page = 1, int $limit = 20, bool $onlyUnread = false): array
    {
        return $this->notificationRepository->findPaginatedForUser($user, $page, $limit, $onlyUnread);
    }

    public function countUnread(User $user): int
    {
        return $this->notificationRepository->countUnreadForUser($user);
    }

    public function markAsRead(Notification $notification, bool $flush = true): void
    {
        if ($notification->isRead()) {
            return;
        }

        $notification->setIsRead(true);

        if ($flush) {
            $this->entityManager->flush();
        }
    }

    public function markAllAsRead(User $user): int
    {
        $qb = $this->notificationRepository->createQueryBuilder('n')
            ->update()
            ->set('n.isRead', ':true')
            ->where('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameters([
                'true' => true,
                'user' => $user,
            ]);

        $affected = $qb->getQuery()->execute();

        $this->entityManager->clear(Notification::class);

        return $affected;
    }

    private function normalizeContext(array $context): array
    {
        $normalized = [];
        foreach ($context as $key => $value) {
            $normalized[$key] = $this->normalizeContextValue($value);
        }

        return $normalized;
    }

    private function normalizeContextValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DateTimeInterface::ATOM);
        }

        if (is_array($value)) {
            return $this->normalizeContext($value);
        }

        return $value;
    }
}


