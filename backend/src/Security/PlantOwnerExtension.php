<?php
namespace App\Security;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;
use App\Entity\Plant;
use App\Entity\SuiviSnapshot;
use App\Entity\UserPlantation;

final class PlantOwnerExtension implements QueryCollectionExtensionInterface
{
    public function __construct(private readonly Security $security) {}

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = []
    ): void {
        $user = $this->security->getUser();
        if (!$user) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0] ?? 'o';

        if ($resourceClass === Plant::class || $resourceClass === UserPlantation::class) {
            $queryBuilder
                ->andWhere(sprintf('%s.user = :currentUser', $rootAlias))
                ->setParameter('currentUser', $user);
            return;
        }

        if ($resourceClass === SuiviSnapshot::class) {
            $queryBuilder
                ->join(sprintf('%s.userPlantation', $rootAlias), 'up')
                ->andWhere('up.user = :currentUser')
                ->setParameter('currentUser', $user);
        }
    }
}