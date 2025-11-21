<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajout de la colonne de confirmation de plantation sur user_plantation.
 */
final class Version20251121120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout du champ confirmation_plantation sur la table user_plantation.';
    }

    public function up(Schema $schema): void
    {
        $schemaManager = $this->connection->createSchemaManager();
        $table = $schemaManager->introspectTable('user_plantation');

        if (!$table->hasColumn('confirmation_plantation')) {
            // Ajout de la colonne de confirmation de plantation (nullable)
            $this->addSql('ALTER TABLE user_plantation ADD confirmation_plantation DATETIME DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        $schemaManager = $this->connection->createSchemaManager();
        $table = $schemaManager->introspectTable('user_plantation');

        if ($table->hasColumn('confirmation_plantation')) {
            // Suppression de la colonne lors du rollback
            $this->addSql('ALTER TABLE user_plantation DROP confirmation_plantation');
        }
    }
}


