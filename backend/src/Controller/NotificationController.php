<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Service\NotificationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
#[IsGranted('ROLE_USER')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
    }

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->requireUser();
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(50, (int) $request->query->get('limit', 20)));
        $status = $request->query->get('status', 'all');
        $onlyUnread = $status === 'unread';

        $result = $this->notificationService->getNotificationsForUser($user, $page, $limit, $onlyUnread);

        return $this->json([
            'data' => array_map([$this, 'serializeNotification'], $result['items']),
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $result['total'],
            ],
        ]);
    }

    #[Route('/unread/count', name: 'api_notifications_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $user = $this->requireUser();

        return $this->json([
            'count' => $this->notificationService->countUnread($user),
        ]);
    }

    #[Route('/{id}/read', name: 'api_notifications_mark_read', methods: ['POST'])]
    public function markAsRead(Notification $notification): JsonResponse
    {
        $user = $this->requireUser();
        $this->denyAccessUnlessGrantedToUser($notification, $user);

        $this->notificationService->markAsRead($notification);

        return $this->json([
            'status' => 'ok',
        ]);
    }

    #[Route('/mark-all-read', name: 'api_notifications_mark_all_read', methods: ['POST'])]
    public function markAllAsRead(): JsonResponse
    {
        $user = $this->requireUser();
        $affected = $this->notificationService->markAllAsRead($user);

        return $this->json([
            'status' => 'ok',
            'updated' => $affected,
        ]);
    }

    private function serializeNotification(Notification $notification): array
    {
        return [
            'id' => $notification->getId(),
            'type' => $notification->getType()->value,
            'title' => $notification->getTitle(),
            'message' => $notification->getMessage(),
            'metadata' => $notification->getMetadata(),
            'isRead' => $notification->isRead(),
            'createdAt' => $notification->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function requireUser(): User
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Utilisateur non authentifié.');
        }

        return $user;
    }

    private function denyAccessUnlessGrantedToUser(Notification $notification, User $user): void
    {
        if ($notification->getUser()?->getId() !== $user->getId()) {
            throw $this->createAccessDeniedException('La notification ne vous appartient pas.');
        }
    }
}



