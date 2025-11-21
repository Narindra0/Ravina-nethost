<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Plant; // Assurez-vous que c'est le bon chemin
use App\Entity\User;  // Assurez-vous que c'est le bon chemin
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Ce Processor décore le processor de base d'API Platform
 * pour ajouter l'utilisateur connecté avant la persistance.
 */
final class PlantUserProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface $persistProcessor Le service de base qui sauvegarde (ex: Doctrine)
     * @param Security $security Le service pour obtenir l'utilisateur
     */
    public function __construct(
        private readonly ProcessorInterface $persistProcessor, 
        private readonly Security $security
    ) {}

    /**
     * @param $data L'objet Plant qui vient d'être créé
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        // Si ce n'est pas une Plant, ou si on n'est pas en train de créer (POST),
        // on ne fait rien et on passe la main.
        if ($data instanceof Plant && $operation->getMethod() === 'POST') {
            
            $user = $this->security->getUser();

            if (!$user instanceof User) {
                // (Normalement, le security.yaml empêche d'arriver ici)
                throw new \LogicException('Utilisateur non trouvé. L\'authentification a échoué.');
            }
            
            // LA CORRECTION : On assigne l'utilisateur
            $data->setUser($user);
        }

        // On appelle le processor de base (Doctrine) pour qu'il fasse l'enregistrement
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}