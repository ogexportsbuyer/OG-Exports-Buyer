<?php

namespace App\Http\Controllers\Api\Buyer;

use App\Http\Controllers\Controller;
use App\Support\BuyerRewardProgramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardProgramController extends Controller
{
    public function __invoke(Request $request, BuyerRewardProgramService $program): JsonResponse
    {
        return response()->json(['data' => $program->summaryFor($request->user())]);
    }
}
