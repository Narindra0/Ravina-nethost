<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251121112425 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la colonne metadata sur notification pour stocker des informations contextuelles.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification ADD metadata JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification DROP metadata');
    }
}
