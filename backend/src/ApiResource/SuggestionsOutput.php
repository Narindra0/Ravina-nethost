<?php

namespace App\ApiResource;

use App\ApiResource\SuggestionPlantOutput;
use Symfony\Component\Serializer\Annotation\Groups; // 💡 Ajoutez cet import

class SuggestionsOutput
{
    // 💡 Le DTO conteneur a besoin d'un groupe pour sérialiser son contenu
    #[Groups(['suggestions'])] 
    public string $currentMonth;
    
    #[Groups(['suggestions'])]
    public string $currentSeason;
    
    /**
     * @var array<SuggestionPlantOutput>
     */
    #[Groups(['suggestions'])] // 💡 Appliquez le groupe au tableau
    public array $suggestions = [];
}