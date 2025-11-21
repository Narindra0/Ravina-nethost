<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\Repository\SuiviSnapshotRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SuiviSnapshotRepository::class)]
#[ORM\Table(name: 'suivi_snapshot')]
#[ApiResource(
    normalizationContext: ['groups' => ['suivi_snapshot:read']],
    denormalizationContext: ['groups' => ['suivi_snapshot:write']],
    operations: [
        new Get(security: "object.getUserPlantation().getUser() == user")
    ]
)]
class SuiviSnapshot
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'suiviSnapshots')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['suivi_snapshot:read'])]
    private ?UserPlantation $userPlantation = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?\DateTimeInterface $dateSnapshot = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2)]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?string $progressionPourcentage = null;

    #[ORM\Column(length: 100)]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?string $stadeActuel = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?\DateTimeInterface $arrosageRecoDate = null;

    #[ORM\Column(type: 'decimal', precision: 6, scale: 2, nullable: true)]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?string $arrosageRecoQuantiteMl = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?array $decisionDetailsJson = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['suivi_snapshot:read', 'user_plantation:read'])]
    private ?array $meteoDataJson = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserPlantation(): ?UserPlantation
    {
        return $this->userPlantation;
    }

    public function setUserPlantation(?UserPlantation $userPlantation): self
    {
        $this->userPlantation = $userPlantation;
        return $this;
    }

    public function getDateSnapshot(): ?\DateTimeInterface
    {
        return $this->dateSnapshot;
    }

    public function setDateSnapshot(\DateTimeInterface $dateSnapshot): self
    {
        $this->dateSnapshot = $dateSnapshot;
        return $this;
    }

    public function getProgressionPourcentage(): ?string
    {
        return $this->progressionPourcentage;
    }

    public function setProgressionPourcentage(string $progressionPourcentage): self
    {
        $this->progressionPourcentage = $progressionPourcentage;
        return $this;
    }

    public function getStadeActuel(): ?string
    {
        return $this->stadeActuel;
    }

    public function setStadeActuel(string $stadeActuel): self
    {
        $this->stadeActuel = $stadeActuel;
        return $this;
    }

    public function getArrosageRecoDate(): ?\DateTimeInterface
    {
        return $this->arrosageRecoDate;
    }

    public function setArrosageRecoDate(?\DateTimeInterface $arrosageRecoDate): self
    {
        $this->arrosageRecoDate = $arrosageRecoDate;
        return $this;
    }

    public function getArrosageRecoQuantiteMl(): ?string
    {
        return $this->arrosageRecoQuantiteMl;
    }

    public function setArrosageRecoQuantiteMl(?string $arrosageRecoQuantiteMl): self
    {
        $this->arrosageRecoQuantiteMl = $arrosageRecoQuantiteMl;
        return $this;
    }

    public function getDecisionDetailsJson(): ?array
    {
        return $this->decisionDetailsJson;
    }

    public function setDecisionDetailsJson(?array $decisionDetailsJson): self
    {
        $this->decisionDetailsJson = $decisionDetailsJson;
        return $this;
    }

    public function getMeteoDataJson(): ?array
    {
        return $this->meteoDataJson;
    }

    public function setMeteoDataJson(?array $meteoDataJson): self
    {
        $this->meteoDataJson = $meteoDataJson;
        return $this;
    }
}


