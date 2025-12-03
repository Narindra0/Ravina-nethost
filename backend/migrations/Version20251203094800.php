<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour ajouter les fonctionnalités premium
 */
final class Version20251203094800 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la table activation_code et du champ premium_expiry_date à la table user';
    }

    public function up(Schema $schema): void
    {
        // Ajout du champ premium_expiry_date à la table user
        $this->addSql('ALTER TABLE user ADD premium_expiry_date DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        
        // Création de la table activation_code
        $this->addSql('CREATE TABLE activation_code (
            id INT AUTO_INCREMENT NOT NULL, 
            code VARCHAR(50) NOT NULL, 
            duration_days INT NOT NULL, 
            is_active TINYINT(1) DEFAULT 1 NOT NULL, 
            max_uses INT DEFAULT NULL, 
            current_uses INT DEFAULT 0 NOT NULL, 
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', 
            UNIQUE INDEX UNIQ_7D78F62577153098 (code), 
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        // Suppression de la table activation_code
        $this->addSql('DROP TABLE activation_code');
        
        // Suppression du champ premium_expiry_date de la table user
        $this->addSql('ALTER TABLE user DROP premium_expiry_date');
    }
}
