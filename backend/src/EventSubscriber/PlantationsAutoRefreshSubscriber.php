<?php

namespace App\EventSubscriber;

use App\Service\PlantationsRefresher;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class PlantationsAutoRefreshSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly PlantationsRefresher $refresher,
        private readonly CacheInterface $cacheApp,
        private readonly LoggerInterface $logger,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => [['onKernelRequest', 5]],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!$this->shouldTriggerOn($request)) {
            return;
        }

        // Anti-boucle: au plus une exécution toutes les 10 minutes
        $cacheKey = 'plantations_auto_refresh_last_run';
        $ranRecently = $this->cacheApp->get($cacheKey, function (ItemInterface $item) {
            $item->expiresAfter(600); // 10 minutes
            return false;
        });

        if ($ranRecently === true) {
            return;
        }

        try {
            $processed = $this->refresher->refreshActivePlantationsForToday();
            // Marqueur de passage
            $this->cacheApp->delete($cacheKey);
            $this->cacheApp->get($cacheKey, function (ItemInterface $item) {
                $item->expiresAfter(600);
                return true;
            });

            if ($processed > 0) {
                $this->logger->info('[AutoRefresh] Snapshots rafraîchis', ['count' => $processed]);
            }
        } catch (\Throwable $e) {
            $this->logger->error('[AutoRefresh] échec du rafraîchissement', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function shouldTriggerOn(Request $request): bool
    {
        if ($request->getMethod() !== Request::METHOD_GET) {
            return false;
        }
        $path = $request->getPathInfo();
        // Déclenche sur la liste des plantations et la fiche d'une plantation
        return str_starts_with($path, '/api/plantations') || str_starts_with($path, '/plantations');
    }
}


