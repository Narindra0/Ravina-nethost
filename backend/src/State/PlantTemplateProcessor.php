<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\PlantTemplate;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class PlantTemplateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.state_processor.write')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): PlantTemplate
    {
        if (!$data instanceof PlantTemplate) {
            throw new \RuntimeException('PlantTemplateProcessor expects PlantTemplate entity.');
        }

        // Assigner l'utilisateur connecté lors d'une création
        if ($operation->getMethod() === 'POST') {
            $user = $this->security->getUser();
            if (!$user instanceof User) {
                throw new AccessDeniedException('Authentification requise.');
            }
            $data->setUser($user);
        }

        /** @var PlantTemplate $saved */
        $saved = $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        return $saved;
    }
}

