<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\ActivationCode;
use App\Repository\ActivationCodeRepository;
use Doctrine\ORM\EntityManagerInterface;

class PremiumService
{
    public function __construct(
        private ActivationCodeRepository $activationCodeRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Active un code premium pour un utilisateur
     * 
     * @return array{success: bool, message: string, expiryDate: ?string}
     */
    public function activateCode(User $user, string $code): array
    {
        // Recherche du code d'activation
        $activationCode = $this->activationCodeRepository->findValidCode($code);

        if (!$activationCode) {
            return [
                'success' => false,
                'message' => 'Code d\'activation invalide ou inexistant',
                'expiryDate' => null,
            ];
        }

        // Vérification que le code peut être utilisé
        if (!$activationCode->canBeUsed()) {
            return [
                'success' => false,
                'message' => 'Ce code a atteint sa limite d\'utilisation',
                'expiryDate' => null,
            ];
        }

        // Extension de la période premium
        $user->extendPremium($activationCode->getDurationDays());

        // Incrémentation du compteur d'utilisation
        $activationCode->incrementUses();

        // Sauvegarde en base de données
        $this->entityManager->persist($user);
        $this->entityManager->persist($activationCode);
        $this->entityManager->flush();

        return [
            'success' => true,
            'message' => sprintf(
                'Accès Premium activé pour %d jours !',
                $activationCode->getDurationDays()
            ),
            'expiryDate' => $user->getPremiumExpiryDate()?->format('Y-m-d'),
        ];
    }

    /**
     * Récupère le statut premium d'un utilisateur
     * 
     * @return array{status: string, isPremium: bool, expiryDate: ?string}
     */
    public function getUserStatus(User $user): array
    {
        $isPremium = $user->isPremium();

        return [
            'status' => $isPremium ? 'PREMIUM' : 'FREE',
            'isPremium' => $isPremium,
            'expiryDate' => $user->getPremiumExpiryDate()?->format('Y-m-d H:i:s'),
        ];
    }
}
