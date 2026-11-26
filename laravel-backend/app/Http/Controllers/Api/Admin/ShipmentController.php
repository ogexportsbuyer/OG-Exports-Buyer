<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\PaginatesQueries;
use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentMilestone;
use App\Services\BuyerTradeNotifier;
use App\Support\AuditsActions;
use App\Support\BuyerShipmentMilestones;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentController extends Controller
{
    use PaginatesQueries;

    public function index(Request $request): JsonResponse
    {
        $query = Shipment::query()->with(['buyer:id,name,email', 'order', 'milestones', 'tradeDocuments']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('container', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhere('destination', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->paginate($this->perPage($request)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['nullable', 'exists:orders,id'],
            'buyer_id' => ['required', 'exists:users,id'],
            'product_snapshot' => ['nullable', 'string'],
            'vessel' => ['nullable', 'string', 'max:255'],
            'container' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'destination' => ['nullable', 'string', 'max:255'],
            'shipping_line' => ['nullable', 'string', 'max:255'],
            'etd' => ['nullable', 'date'],
            'eta' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'current_milestone' => ['nullable', 'string', 'max:255'],
        ]);

        $initialMilestone = trim((string) ($data['current_milestone'] ?? ''));
        if ($initialMilestone === '') {
            $initialMilestone = 'Awaiting Booking';
        }
        $initialMilestone = BuyerShipmentMilestones::canonicalLabel($initialMilestone) ?? $initialMilestone;

        $shipment = Shipment::create([
            ...$data,
            'status' => $data['status'] ?? 'pending',
            'current_milestone' => $initialMilestone,
        ]);
        ShipmentMilestone::create([
            'shipment_id' => $shipment->id,
            'label' => $initialMilestone,
            'occurred_at' => now(),
        ]);

        AuditsActions::log('shipment.created', 'shipments', $request->user(), [
            'shipment_id' => $shipment->id,
        ]);

        $shipment->load('buyer');
        BuyerTradeNotifier::shipmentCreated($shipment);

        return response()->json(['data' => $shipment->load('milestones')], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'data' => Shipment::query()
                ->with(['buyer:id,name,email', 'order', 'milestones', 'tradeDocuments'])
                ->findOrFail($id),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $shipment = Shipment::query()->findOrFail($id);
        $previous = $shipment->only([
            'status',
            'current_milestone',
            'vessel',
            'eta',
            'etd',
            'container',
            'destination',
        ]);
        $previousMilestone = $shipment->current_milestone;

        $data = $request->validate([
            'order_id' => ['nullable', 'exists:orders,id'],
            'buyer_id' => ['sometimes', 'exists:users,id'],
            'product_snapshot' => ['nullable', 'string'],
            'vessel' => ['nullable', 'string', 'max:255'],
            'container' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'destination' => ['nullable', 'string', 'max:255'],
            'shipping_line' => ['nullable', 'string', 'max:255'],
            'etd' => ['nullable', 'date'],
            'eta' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'current_milestone' => ['nullable', 'string', 'max:255'],
        ]);

        if (isset($data['current_milestone']) && is_string($data['current_milestone'])) {
            $data['current_milestone'] = trim($data['current_milestone']);
            $data['current_milestone'] = BuyerShipmentMilestones::canonicalLabel($data['current_milestone'])
                ?? $data['current_milestone'];
        }

        $shipment->update($data);

        $newMilestone = $data['current_milestone'] ?? null;
        if (
            is_string($newMilestone)
            && $newMilestone !== ''
            && ! BuyerShipmentMilestones::isSame($previousMilestone, $newMilestone)
        ) {
            ShipmentMilestone::create([
                'shipment_id' => $shipment->id,
                'label' => $newMilestone,
                'occurred_at' => now(),
            ]);
        }

        $shipment = $shipment->fresh()->load(['milestones', 'buyer']);
        $tracked = ['status', 'current_milestone', 'vessel', 'eta', 'etd'];
        $changes = [];
        foreach ($tracked as $field) {
            $old = $previous[$field] ?? null;
            $new = $shipment->{$field};
            if (
                $field === 'current_milestone'
                && BuyerShipmentMilestones::isSame(is_string($old) ? $old : null, (string) $new)
            ) {
                continue;
            }
            $oldStr = $old instanceof \DateTimeInterface ? $old->format('Y-m-d') : (string) $old;
            $newStr = $new instanceof \DateTimeInterface ? $new->format('Y-m-d') : (string) $new;
            if ($oldStr !== $newStr && filled($new)) {
                $changes[$field] = $newStr;
            }
        }
        BuyerTradeNotifier::shipmentUpdated($shipment, $changes);

        return response()->json(['data' => $shipment]);
    }

    public function destroy(int $id): JsonResponse
    {
        Shipment::query()->findOrFail($id)->delete();

        return response()->json(['message' => 'Shipment deleted.']);
    }

    public function storeMilestone(Request $request, int $id): JsonResponse
    {
        $shipment = Shipment::query()->findOrFail($id);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'occurred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $label = trim($data['label']);
        $label = BuyerShipmentMilestones::canonicalLabel($label) ?? $label;
        if (BuyerShipmentMilestones::isSame($shipment->current_milestone, $label)) {
            $existing = $shipment->milestones
                ->first(fn (ShipmentMilestone $entry): bool => BuyerShipmentMilestones::isSame($entry->label, $label));

            $milestone = $existing ?? ShipmentMilestone::create([
                'shipment_id' => $shipment->id,
                'label' => $label,
                'occurred_at' => $data['occurred_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);

            return response()->json(['data' => $milestone, 'unchanged' => true]);
        }

        $milestone = ShipmentMilestone::create([
            'shipment_id' => $shipment->id,
            'label' => $label,
            'occurred_at' => $data['occurred_at'] ?? now(),
            'notes' => $data['notes'] ?? null,
        ]);

        $shipment->update([
            'current_milestone' => $milestone->label,
        ]);

        $shipment->load('buyer');
        BuyerTradeNotifier::shipmentUpdated($shipment, [
            'current_milestone' => $milestone->label,
        ]);

        return response()->json(['data' => $milestone], 201);
    }

    public function updateMilestone(Request $request, int $id, int $milestoneId): JsonResponse
    {
        $shipment = Shipment::query()->with('buyer')->findOrFail($id);
        $milestone = ShipmentMilestone::query()
            ->where('shipment_id', $id)
            ->findOrFail($milestoneId);
        $previousLabel = $milestone->label;

        $changes = $request->validate([
            'label' => ['sometimes', 'string', 'min:1', 'max:255'],
            'occurred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
        if (isset($changes['label'])) {
            $changes['label'] = trim($changes['label']);
            $changes['label'] = BuyerShipmentMilestones::canonicalLabel($changes['label']) ?? $changes['label'];
        }
        $milestone->update($changes);

        if ($milestone->wasChanged('label')) {
            if (
                BuyerShipmentMilestones::isSame($shipment->current_milestone, $previousLabel)
                && ! BuyerShipmentMilestones::isSame($previousLabel, $milestone->label)
            ) {
                $shipment->update(['current_milestone' => $milestone->label]);
                BuyerTradeNotifier::shipmentUpdated(
                    $shipment->fresh()->load('buyer'),
                    ['current_milestone' => $milestone->label],
                );
            }
        }

        return response()->json(['data' => $milestone->fresh()]);
    }
}
