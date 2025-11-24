<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/cron')]
class CronController extends AbstractController
{
    public function __construct(
        private readonly KernelInterface $kernel
    ) {
    }

    #[Route('/notifications', name: 'cron_notifications', methods: ['GET'])]
    public function processNotifications(Request $request): JsonResponse
    {
        return $this->runCommand($request, 'app:notifications:process');
    }

    #[Route('/plantations', name: 'cron_plantations', methods: ['GET'])]
    public function processPlantations(Request $request): JsonResponse
    {
        return $this->runCommand($request, 'app:plantations:process');
    }

    private function runCommand(Request $request, string $commandName): JsonResponse
    {
        // Simple security check
        $cronSecret = $_ENV['CRON_SECRET'] ?? null;
        $authHeader = $request->headers->get('X-Cron-Auth');

        if ($cronSecret && $authHeader !== $cronSecret) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $application = new Application($this->kernel);
        $application->setAutoExit(false);

        $input = new ArrayInput([
            'command' => $commandName,
        ]);

        $output = new BufferedOutput();
        
        try {
            $application->run($input, $output);
            $content = $output->fetch();
            
            return new JsonResponse([
                'status' => 'success',
                'command' => $commandName,
                'output' => $content,
            ]);
        } catch (\Throwable $e) {
            // Log the error explicitly for Render logs
            error_log('CRON ERROR: ' . $e->getMessage());
            error_log($e->getTraceAsString());
            
            return new JsonResponse([
                'status' => 'error',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // Optional: be careful exposing trace in prod, but useful for debug now
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
