<?php

namespace App\Controller;

use Cloudinary\Cloudinary;
use Cloudinary\Api\Upload\UploadApi;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UploadController extends AbstractController
{
    private Cloudinary $cloudinary;

    public function __construct()
    {
        // Initialiser Cloudinary avec les credentials depuis .env
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'],
                'api_key' => $_ENV['CLOUDINARY_API_KEY'],
                'api_secret' => $_ENV['CLOUDINARY_API_SECRET'],
            ],
            'url' => [
                'secure' => true
            ]
        ]);
    }

    #[Route('/api/upload/plant-template-image', name: 'upload_plant_template_image', methods: ['POST'])]
    public function uploadPlantTemplateImage(Request $request): Response
    {
        $file = $request->files->get('file');
        $rawName = (string) $request->request->get('name', '');

        if (!$file) {
            return new JsonResponse(['error' => 'File is required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            // Normaliser le nom pour l'utiliser comme public_id
            $base = trim($rawName) !== '' ? $rawName : pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            // Nettoyer le nom : retirer caractères spéciaux, remplacer espaces par tirets
            $base = preg_replace('/[^A-Za-z0-9\- _]/', '', $base);
            $base = str_replace(['  ', ' '], [' ', '-'], $base);
            $base = str_replace('__', '_', str_replace('--', '-', $base));
            if ($base === '') {
                $base = 'image';
            }

            // Dossier d'upload depuis .env
            $folder = $_ENV['CLOUDINARY_UPLOAD_FOLDER'] ?? 'orientmada/plantes';

            // Upload vers Cloudinary
            $uploadResult = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                [
                    'folder' => $folder,
                    'public_id' => $base,
                    'overwrite' => true,
                    'resource_type' => 'image',
                    'format' => null, // Garder le format d'origine
                ]
            );

            // Récupérer l'URL sécurisée de l'image
            $imageUrl = $uploadResult['secure_url'] ?? null;

            if (!$imageUrl) {
                return new JsonResponse(['error' => 'Upload failed'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            return new JsonResponse(['imageSlug' => $imageUrl], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Cloudinary upload failed',
                'message' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
