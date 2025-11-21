<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251120120019 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        
        // Update plant_template table: increase imageSlug length to accommodate Cloudinary URLs
        $this->addSql('ALTER TABLE plant_template CHANGE image_slug image_slug VARCHAR(255) DEFAULT NULL');
        
        // Update foreign key constraint on suivi_snapshot
        $this->addSql('ALTER TABLE suivi_snapshot DROP FOREIGN KEY FK_8A7485A6F76B2F3C');
        $this->addSql('ALTER TABLE suivi_snapshot ADD CONSTRAINT FK_8A7485A6F76B2F3C FOREIGN KEY (user_plantation_id) REFERENCES user_plantation (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE plant_template CHANGE image_slug image_slug VARCHAR(150) DEFAULT NULL');
        $this->addSql('ALTER TABLE suivi_snapshot DROP FOREIGN KEY FK_8A7485A6F76B2F3C');
        $this->addSql('ALTER TABLE suivi_snapshot ADD CONSTRAINT FK_8A7485A6F76B2F3C FOREIGN KEY (user_plantation_id) REFERENCES user_plantation (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
    }
}
