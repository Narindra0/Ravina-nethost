<?php

namespace App\Controller;

use App\Service\PremiumService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/account')]
class AccountController extends AbstractController
{
    public function __construct(
        private PremiumService $premiumService
    ) {
    }

    /**
     * Récupère le statut du compte de l'utilisateur connecté
     */
    #[Route('/status', name: 'api_account_status', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function status(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        $status = $this->premiumService->getUserStatus($user);

        return $this->json($status);
    }

    /**
     * Active un code premium pour l'utilisateur connecté
     */
    #[Route('/activate', name: 'api_account_activate', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function activate(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? '';

        if (empty($code)) {
            return $this->json([
                'success' => false,
                'message' => 'Veuillez fournir un code d\'activation',
            ], 400);
        }

        $result = $this->premiumService->activateCode($user, $code);

        $statusCode = $result['success'] ? 200 : 400;

        return $this->json($result, $statusCode);
    }
}
