<?php

namespace App\EventSubscriber;

use App\Entity\PlantTemplate;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Symfony\Bundle\SecurityBundle\Security;

#[AsDoctrineListener(event: Events::prePersist)]
class PlantTemplateSubscriber
{
    public function __construct(private readonly Security $security) {}

    public function prePersist(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof PlantTemplate) {
            return;
        }

        if (null === $entity->getUser()) {
            $user = $this->security->getUser();
            if ($user instanceof User) {
                $entity->setUser($user);
            }
        }
    }
}

