<?php

namespace App\Controller;

use App\Entity\UserPlantation;
use App\Repository\UserPlantationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ConfirmPlantationController extends AbstractController
{
    public function __construct(
        private readonly UserPlantationRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/plantations/{id}/confirm', name: 'app_plantations_confirm', methods: ['POST'])]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        $plantation = $this->repository->find($id);
        if (!$plantation instanceof UserPlantation) {
            return $this->json(['detail' => 'Plantation introuvable.'], 404);
        }

        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        if ($plantation->getUser() !== $this->getUser()) {
            return $this->json(['detail' => 'Accès refusé.'], 403);
        }

        if ($plantation->getConfirmationPlantation() !== null) {
            return $this->json(['detail' => 'Plantation déjà confirmée.'], 400);
        }

        $plantation->setConfirmationPlantation(new \DateTimeImmutable());
        $plantation->setEtatActuel(UserPlantation::STATUS_ACTIVE);

        $this->entityManager->flush();

        return $this->json([
            'status' => 'ok',
            'confirmation_date' => $plantation->getConfirmationPlantation()->format('Y-m-d H:i:s'),
            'etat' => $plantation->getEtatActuel(),
        ]);
    }
}
