<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251121073713 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Check if column 'updated_at' exists in 'plant' table
        $schemaManager = $this->connection->createSchemaManager();
        $plantTable = $schemaManager->introspectTable('plant');
        
        if (!$plantTable->hasColumn('updated_at')) {
            // Ajout de la colonne en mode nullable pour éviter le défaut 0000-00-00 00:00:00 sur les données existantes
            $this->addSql('ALTER TABLE plant ADD updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        }

        // Always ensure other changes are applied if needed, or check them too.
        // The original migration had:
        // CHANGE image_slug image_slug VARCHAR(255) DEFAULT NULL, CHANGE Watering_Frequency watering_frequency VARCHAR(50) DEFAULT NULL
        
        // Let's split the ALTER TABLE to handle them separately to be safe
        $this->addSql('ALTER TABLE plant CHANGE image_slug image_slug VARCHAR(255) DEFAULT NULL');
        
        // Check if we need to rename Watering_Frequency
        if ($plantTable->hasColumn('Watering_Frequency')) {
             $this->addSql('ALTER TABLE plant CHANGE Watering_Frequency watering_frequency VARCHAR(50) DEFAULT NULL');
        } elseif ($plantTable->hasColumn('watering_frequency')) {
             $this->addSql('ALTER TABLE plant CHANGE watering_frequency watering_frequency VARCHAR(50) DEFAULT NULL');
        }

        // Backfill : on réutilise created_at si disponible, sinon on met NOW()
        $this->addSql('UPDATE plant SET updated_at = IFNULL(created_at, NOW()) WHERE updated_at IS NULL');

        // On verrouille ensuite la contrainte NOT NULL maintenant que les données sont cohérentes
        $this->addSql('ALTER TABLE plant CHANGE updated_at updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE plant DROP updated_at, CHANGE watering_frequency Watering_Frequency INT DEFAULT NULL, CHANGE image_slug image_slug VARCHAR(150) DEFAULT NULL');
    }
}
