<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251107092916 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE plant_template (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, name VARCHAR(100) NOT NULL, type VARCHAR(50) NOT NULL, expected_harvest_days INT NOT NULL, location VARCHAR(255) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', best_season VARCHAR(20) DEFAULT NULL, watering_frequency VARCHAR(50) DEFAULT NULL, sun_exposure VARCHAR(50) DEFAULT NULL, cycle_phases_json JSON DEFAULT NULL, watering_quantity_ml INT DEFAULT NULL, image_slug VARCHAR(150) DEFAULT NULL, INDEX IDX_BEC35FD1A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE plant_template ADD CONSTRAINT FK_BEC35FD1A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE plant_template DROP FOREIGN KEY FK_BEC35FD1A76ED395');
        $this->addSql('DROP TABLE plant_template');
    }
}
