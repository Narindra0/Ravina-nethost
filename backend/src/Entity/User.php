<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'user')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    // --------------------------
    // 🔑 Identifiant principal
    // --------------------------
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['plant:read', 'user_plantation:read'])]
    private ?int $id = null;

    // --------------------------
    // ✉️ Email unique de l'utilisateur
    // --------------------------
    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['plant:read', 'user_plantation:read'])]
    private ?string $email = null;

    // --------------------------
    // 🔒 Rôles utilisateur
    // --------------------------
    #[ORM\Column]
    private array $roles = [];

    // --------------------------
    // 🔐 Mot de passe hashé
    // --------------------------
    #[ORM\Column]
    private ?string $password = null;

    // --------------------------
    // 🌱 Relation avec Plant
    // --------------------------
    /**
     * @var Collection<int, Plant>
     */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Plant::class, orphanRemoval: true)]
    private Collection $plants;

    /**
     * @var Collection<int, UserPlantation>
     */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserPlantation::class, orphanRemoval: true)]
    private Collection $userPlantations;

    /**
     * @var Collection<int, Notification>
     */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Notification::class, orphanRemoval: true, cascade: ['remove'])]
    private Collection $notifications;

    public function __construct()
    {
        $this->plants = new ArrayCollection();
        $this->userPlantations = new ArrayCollection();
        $this->notifications = new ArrayCollection();
    }

    // --------------------------
    // 🧩 Getters / Setters
    // --------------------------
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    /**
     * @return Collection<int, Notification>
     */
    public function getNotifications(): Collection
    {
        return $this->notifications;
    }

    public function addNotification(Notification $notification): static
    {
        if (!$this->notifications->contains($notification)) {
            $this->notifications->add($notification);
            $notification->setUser($this);
        }

        return $this;
    }

    public function removeNotification(Notification $notification): static
    {
        if ($this->notifications->removeElement($notification)) {
            if ($notification->getUser() === $this) {
                $notification->setUser(null);
            }
        }

        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    // --------------------------
    // 👥 Gestion des rôles
    // --------------------------
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER'; // tous les utilisateurs ont au moins ce rôle
        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    // --------------------------
    // 🔐 Gestion du mot de passe
    // --------------------------
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function eraseCredentials(): void
    {
        // Si tu avais des données sensibles (ex: mot de passe en clair), on les nettoierait ici.
    }

    // --------------------------
    // 🌿 Gestion des plantes
    // --------------------------
    /**
     * @return Collection<int, Plant>
     */
    public function getPlants(): Collection
    {
        return $this->plants;
    }

    public function addPlant(Plant $plant): static
    {
        if (!$this->plants->contains($plant)) {
            $this->plants->add($plant);
            $plant->setUser($this);
        }

        return $this;
    }

    public function removePlant(Plant $plant): static
    {
        if ($this->plants->removeElement($plant)) {
            if ($plant->getUser() === $this) {
                $plant->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, UserPlantation>
     */
    public function getUserPlantations(): Collection
    {
        return $this->userPlantations;
    }

    public function addUserPlantation(UserPlantation $userPlantation): static
    {
        if (!$this->userPlantations->contains($userPlantation)) {
            $this->userPlantations->add($userPlantation);
            $userPlantation->setUser($this);
        }

        return $this;
    }

    public function removeUserPlantation(UserPlantation $userPlantation): static
    {
        if ($this->userPlantations->removeElement($userPlantation)) {
            if ($userPlantation->getUser() === $this) {
                $userPlantation->setUser(null);
            }
        }

        return $this;
    }

    // --------------------------
    // 🧠 Sérialisation sécurisée
    // --------------------------
    public function __serialize(): array
    {
        // Empêche de stocker le mot de passe réel dans la session
        $data = (array) $this;
        $data["\0" . self::class . "\0password"] = hash('crc32c', $this->password);
        return $data;
    }
}
