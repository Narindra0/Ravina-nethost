<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251107114347 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE suivi_snapshot (id INT AUTO_INCREMENT NOT NULL, user_plantation_id INT NOT NULL, date_snapshot DATETIME NOT NULL, progression_pourcentage NUMERIC(5, 2) NOT NULL, stade_actuel VARCHAR(100) NOT NULL, arrosage_reco_date DATETIME DEFAULT NULL, arrosage_reco_quantite_ml NUMERIC(6, 2) DEFAULT NULL, decision_details_json JSON DEFAULT NULL, meteo_data_json JSON DEFAULT NULL, INDEX IDX_8A7485A6F76B2F3C (user_plantation_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE user_plantation (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, plant_template_id INT NOT NULL, date_plantation DATETIME NOT NULL, localisation VARCHAR(50) NOT NULL, geolocalisation_lat NUMERIC(10, 8) NOT NULL, geolocalisation_lon NUMERIC(11, 8) NOT NULL, etat_actuel VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_10EE2356A76ED395 (user_id), INDEX IDX_10EE2356D5444818 (plant_template_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE suivi_snapshot ADD CONSTRAINT FK_8A7485A6F76B2F3C FOREIGN KEY (user_plantation_id) REFERENCES user_plantation (id)');
        $this->addSql('ALTER TABLE user_plantation ADD CONSTRAINT FK_10EE2356A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE user_plantation ADD CONSTRAINT FK_10EE2356D5444818 FOREIGN KEY (plant_template_id) REFERENCES plant_template (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE suivi_snapshot DROP FOREIGN KEY FK_8A7485A6F76B2F3C');
        $this->addSql('ALTER TABLE user_plantation DROP FOREIGN KEY FK_10EE2356A76ED395');
        $this->addSql('ALTER TABLE user_plantation DROP FOREIGN KEY FK_10EE2356D5444818');
        $this->addSql('DROP TABLE suivi_snapshot');
        $this->addSql('DROP TABLE user_plantation');
    }
}
