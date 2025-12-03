<?php

namespace App\Entity;

use App\Repository\ActivationCodeRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ActivationCodeRepository::class)]
#[ORM\Table(name: 'activation_code')]
#[ORM\HasLifecycleCallbacks]
class ActivationCode
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    #[Assert\NotBlank]
    private ?string $code = null;

    #[ORM\Column]
    #[Assert\Positive]
    private ?int $durationDays = null;

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\Column(nullable: true)]
    #[Assert\Positive]
    private ?int $maxUses = null;

    #[ORM\Column]
    private int $currentUses = 0;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = strtoupper($code);
        return $this;
    }

    public function getDurationDays(): ?int
    {
        return $this->durationDays;
    }

    public function setDurationDays(int $durationDays): self
    {
        $this->durationDays = $durationDays;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function getMaxUses(): ?int
    {
        return $this->maxUses;
    }

    public function setMaxUses(?int $maxUses): self
    {
        $this->maxUses = $maxUses;
        return $this;
    }

    public function getCurrentUses(): int
    {
        return $this->currentUses;
    }

    public function setCurrentUses(int $currentUses): self
    {
        $this->currentUses = $currentUses;
        return $this;
    }

    public function incrementUses(): self
    {
        $this->currentUses++;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * Vérifie si le code peut être utilisé
     */
    public function canBeUsed(): bool
    {
        if (!$this->isActive) {
            return false;
        }

        if ($this->maxUses !== null && $this->currentUses >= $this->maxUses) {
            return false;
        }

        return true;
    }
}
