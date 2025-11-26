<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Post as PostOp;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\OpenApi\Model\Operation as OpenApiOperation;
use ApiPlatform\OpenApi\Model\RequestBody;
use App\DataProcessor\UserPlantationProcessor;
use App\Repository\UserPlantationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserPlantationRepository::class)]
#[ORM\Table(name: 'user_plantation')]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    normalizationContext: ['groups' => ['user_plantation:read']],
    denormalizationContext: ['groups' => ['user_plantation:write']],
    operations: [
        new Get(
            uriTemplate: '/plantations/{id}',
            security: "object.getUser() == user"
        ),
        new GetCollection(
            uriTemplate: '/plantations',
            security: "is_granted('IS_AUTHENTICATED_FULLY')"
        ),
        new Post(
            uriTemplate: '/plantations',
            security: "is_granted('IS_AUTHENTICATED_FULLY')",
            processor: UserPlantationProcessor::class
        ),
        new Delete(
            uriTemplate: '/plantations/{id}',
            security: "object.getUser() == user"
        ),
    ]
)]
class UserPlantation
{
    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_HARVESTED = 'HARVESTED';
    public const STATUS_ARCHIVED = 'ARCHIVED';
    public const STATUS_PAUSED = 'PAUSED';
    public const STATUS_PLANNED = 'ATTENTE';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user_plantation:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'userPlantations')]
    #[ORM\JoinColumn(nullable: false)]
    #[ApiProperty(readable: true, writable: false)]
    #[Groups(['user_plantation:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'userPlantations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?PlantTemplate $plantTemplate = null;

    #[ORM\Column(type: 'datetime')]
    #[Assert\NotNull]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?\DateTimeInterface $datePlantation = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?\DateTimeInterface $confirmationPlantation = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 50)]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?string $localisation = null;

    #[ORM\Column(type: 'float')]
    #[Assert\NotNull]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?float $geolocalisationLat = null;

    #[ORM\Column(type: 'float')]
    #[Assert\NotNull]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?float $geolocalisationLon = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(callback: [self::class, 'getAllowedStatuses'])]
    #[Groups(['user_plantation:read', 'user_plantation:write'])]
    private ?string $etatActuel = self::STATUS_ACTIVE;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user_plantation:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user_plantation:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, SuiviSnapshot>
     */
    #[ORM\OneToMany(mappedBy: 'userPlantation', targetEntity: SuiviSnapshot::class, orphanRemoval: true, cascade: ['persist'])]
    #[ORM\OrderBy(['dateSnapshot' => 'DESC'])]
    #[ApiProperty(writable: false)]
    #[Groups(['user_plantation:read'])]
    private Collection $suiviSnapshots;

    public function __construct()
    {
        $this->suiviSnapshots = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public static function getAllowedStatuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_HARVESTED,
            self::STATUS_ARCHIVED,
            self::STATUS_PAUSED,
            self::STATUS_PLANNED,
        ];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getPlantTemplate(): ?PlantTemplate
    {
        return $this->plantTemplate;
    }

    public function setPlantTemplate(?PlantTemplate $plantTemplate): self
    {
        $this->plantTemplate = $plantTemplate;
        return $this;
    }

    public function getDatePlantation(): ?\DateTimeInterface
    {
        return $this->datePlantation;
    }

    public function setDatePlantation(\DateTimeInterface $datePlantation): self
    {
        $this->datePlantation = $datePlantation;
        return $this;
    }

    public function getConfirmationPlantation(): ?\DateTimeInterface
    {
        return $this->confirmationPlantation;
    }

    public function setConfirmationPlantation(?\DateTimeInterface $confirmationPlantation): self
    {
        $this->confirmationPlantation = $confirmationPlantation;
        return $this;
    }

    public function getLocalisation(): ?string
    {
        return $this->localisation;
    }

    public function setLocalisation(string $localisation): self
    {
        $this->localisation = $localisation;
        return $this;
    }

    public function getGeolocalisationLat(): ?float
    {
        return $this->geolocalisationLat;
    }

    public function setGeolocalisationLat(float $geolocalisationLat): self
    {
        $this->geolocalisationLat = $geolocalisationLat;
        return $this;
    }

    public function getGeolocalisationLon(): ?float
    {
        return $this->geolocalisationLon;
    }

    public function setGeolocalisationLon(float $geolocalisationLon): self
    {
        $this->geolocalisationLon = $geolocalisationLon;
        return $this;
    }

    public function getEtatActuel(): ?string
    {
        return $this->etatActuel;
    }

    public function setEtatActuel(string $etatActuel): self
    {
        $status = strtoupper($etatActuel);
        if (!in_array($status, self::getAllowedStatuses(), true)) {
            throw new \InvalidArgumentException(sprintf('Statut "%s" invalide pour UserPlantation.', $etatActuel));
        }
        $this->etatActuel = $status;
        $this->touch();
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    /**
     * @return Collection<int, SuiviSnapshot>
     */
    public function getSuiviSnapshots(): Collection
    {
        return $this->suiviSnapshots;
    }

    public function addSuiviSnapshot(SuiviSnapshot $suiviSnapshot): self
    {
        if (!$this->suiviSnapshots->contains($suiviSnapshot)) {
            $this->suiviSnapshots->add($suiviSnapshot);
            $suiviSnapshot->setUserPlantation($this);
            $this->touch();
        }

        return $this;
    }

    public function removeSuiviSnapshot(SuiviSnapshot $suiviSnapshot): self
    {
        if ($this->suiviSnapshots->removeElement($suiviSnapshot)) {
            if ($suiviSnapshot->getUserPlantation() === $this) {
                $suiviSnapshot->setUserPlantation(null);
            }
        }

        return $this;
    }
}


