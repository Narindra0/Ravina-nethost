<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251107121910 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user_plantation CHANGE geolocalisation_lat geolocalisation_lat DOUBLE PRECISION NOT NULL, CHANGE geolocalisation_lon geolocalisation_lon DOUBLE PRECISION NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user_plantation CHANGE geolocalisation_lat geolocalisation_lat NUMERIC(10, 8) NOT NULL, CHANGE geolocalisation_lon geolocalisation_lon NUMERIC(11, 8) NOT NULL');
    }
}
