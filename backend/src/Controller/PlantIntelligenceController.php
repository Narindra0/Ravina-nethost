<?php

namespace App\Controller;

use App\Entity\UserPlantation;
use App\Entity\User;
use App\Service\HealthScoreService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
#[IsGranted('ROLE_USER')]
class PlantIntelligenceController extends AbstractController
{
    public function __construct(
        private readonly HealthScoreService $healthScoreService,
    ) {
    }

    #[Route('/plantations/{id}/health-score', name: 'api_plantation_health_score', methods: ['GET'])]
    public function getHealthScore(UserPlantation $plantation): JsonResponse
    {
        $user = $this->requireUser();
        $this->denyAccessUnlessOwner($plantation, $user);

        $scoreData = $this->healthScoreService->calculateScore($plantation);

        return $this->json($scoreData);
    }

    private function requireUser(): User
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException('Utilisateur non authentifié.');
        }

        return $user;
    }

    private function denyAccessUnlessOwner(UserPlantation $plantation, User $user): void
    {
        if ($plantation->getUser()?->getId() !== $user->getId()) {
            throw $this->createAccessDeniedException('Cette plantation ne vous appartient pas.');
        }
    }
}
