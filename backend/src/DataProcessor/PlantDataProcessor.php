<?php
namespace App\DataProcessor;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Plant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

final class PlantDataProcessor implements ProcessorInterface
{
    private EntityManagerInterface $entityManager;
    private SluggerInterface $slugger;
    private string $uploadPath;

    public function __construct(
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger,
        string $kernelProjectDir // Chemin de la racine de votre projet Symfony (backend)
    ) {
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
        
        // 🚀 MISE À JOUR DU CHEMIN D'UPLOAD 🚀
        // Le chemin pointe maintenant vers le répertoire public du frontend
        $this->uploadPath = $kernelProjectDir . '/../frontend/public/images/plantes';
    }

    /**
     * @param Plant $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Plant
    {
        if (!$data instanceof Plant) {
            throw new \RuntimeException("Unexpected data type.");
        }
        
        if ($data->getImageFile() instanceof UploadedFile) {
            /** @var UploadedFile $file */
            $file = $data->getImageFile();
            
            // 1. Nettoyer le nom de la plante (ex: "Tomate Cerise" -> "tomate-cerise")
            $safeFilename = $this->slugger->slug($data->getName())->lower();
            
            // S'assurer que le dossier d'upload existe
            if (!is_dir($this->uploadPath)) {
                @mkdir($this->uploadPath, 0775, true);
            }

            // 2. Déplacer le fichier uploadé sous un nom temporaire (conserve extension originale)
            $originalExtension = $file->guessExtension() ?: 'jpg';
            $tempFilename = sprintf('%s_tmp.%s', $safeFilename, $originalExtension);
            $file->move($this->uploadPath, $tempFilename);

            $tempPath = $this->uploadPath . DIRECTORY_SEPARATOR . $tempFilename;
            $rand = substr(bin2hex(random_bytes(3)), 0, 6);
            $targetFilename = sprintf('%s-%s.webp', $safeFilename, $rand);
            $targetPath = $this->uploadPath . DIRECTORY_SEPARATOR . $targetFilename;

            // 3. Conversion en WebP (qualité 80)
            $mimeType = mime_content_type($tempPath) ?: 'image/jpeg';
            $image = null;
            if (str_contains($mimeType, 'jpeg') || str_contains($mimeType, 'jpg')) {
                $image = @imagecreatefromjpeg($tempPath);
            } elseif (str_contains($mimeType, 'png')) {
                $image = @imagecreatefrompng($tempPath);
                if ($image) {
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                }
            } elseif (str_contains($mimeType, 'webp')) {
                $image = @imagecreatefromwebp($tempPath);
            }

            if ($image) {
                // Écrire le WebP
                imagewebp($image, $targetPath, 80);
                imagedestroy($image);
                // Supprimer le fichier temporaire original
                @unlink($tempPath);
                // 4. Enregistrer le slug avec extension .webp
                $data->setImageSlug($targetFilename);
            } else {
                // Fallback: conserver l'original si conversion échoue
                $fallbackFilename = sprintf('%s.%s', $safeFilename, $originalExtension);
                @rename($tempPath, $this->uploadPath . DIRECTORY_SEPARATOR . $fallbackFilename);
                $data->setImageSlug($fallbackFilename);
            }
            
            // 5. Nettoyer la propriété ImageFile
            $data->setImageFile(null); 
        }

        // Définir une date de plantation par défaut si absente
        if ($data->getPlantedAt() === null) {
            $data->setPlantedAt(new \DateTimeImmutable('today'));
        }

        // 6. Persister et enregistrer en base de données
        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    public function supports(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): bool
    {
        return $data instanceof Plant && $operation->getMethod() === 'POST';
    }
}