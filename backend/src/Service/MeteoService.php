<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;

class MeteoService
{
    private HttpClientInterface $httpClient;
    private string $baseUrl;
    private LoggerInterface $logger;

    public function __construct(HttpClientInterface $httpClient, string $meteoBaseUrl, LoggerInterface $logger)
    {
        $this->httpClient = $httpClient;
        $this->baseUrl = rtrim($meteoBaseUrl, '/');
        $this->logger = $logger;
    }

    /**
     * @return array<string, mixed>
     */
    public function fetchDailyForecast(float $latitude, float $longitude, int $days = 3): array
    {
        $query = [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'daily' => 'precipitation_sum,temperature_2m_max,temperature_2m_min',
            'timezone' => 'UTC',
            'forecast_days' => max(1, min($days, 16)),
        ];

        $url = sprintf('%s/v1/forecast', $this->baseUrl);

        try {
            $response = $this->httpClient->request('GET', $url, ['query' => $query]);

            if ($response->getStatusCode() !== Response::HTTP_OK) {
                $this->logger->warning('Réponse inattendue de l\'API météo', [
                    'status' => $response->getStatusCode(),
                    'body' => $response->getContent(false),
                ]);

                return ['raw' => null, 'daily' => [], 'error' => 'unexpected_status'];
            }

            $payload = $response->toArray(false);

            return [
                'raw' => $payload,
                'daily' => $this->normalizeDailyData($payload),
            ];
        } catch (ClientExceptionInterface|RedirectionExceptionInterface|ServerExceptionInterface|TransportExceptionInterface $exception) {
            $this->logger->error('Erreur lors de l\'appel à l\'API météo', [
                'message' => $exception->getMessage(),
                'latitude' => $latitude,
                'longitude' => $longitude,
            ]);

            return ['raw' => null, 'daily' => [], 'error' => 'http_error'];
        }
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<int, array<string, mixed>>
     */
    private function normalizeDailyData(array $payload): array
    {
        if (!isset($payload['daily']['time'], $payload['daily']['precipitation_sum'])) {
            return [];
        }

        $dates = $payload['daily']['time'];
        $precip = $payload['daily']['precipitation_sum'];
        $tempMax = $payload['daily']['temperature_2m_max'] ?? [];
        $tempMin = $payload['daily']['temperature_2m_min'] ?? [];

        $normalized = [];
        foreach ($dates as $index => $date) {
            $normalized[] = [
                'date' => $date,
                'precipitation_sum' => isset($precip[$index]) ? (float) $precip[$index] : null,
                'temperature_max' => isset($tempMax[$index]) ? (float) $tempMax[$index] : null,
                'temperature_min' => isset($tempMin[$index]) ? (float) $tempMin[$index] : null,
            ];
        }

        return $normalized;
    }
}


