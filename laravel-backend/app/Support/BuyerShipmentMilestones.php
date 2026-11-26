<?php

namespace App\Support;

use Illuminate\Support\Str;

final class BuyerShipmentMilestones
{
    public const FLOW = [
        'Awaiting Booking',
        'Booking Confirmed',
        'Gate-In at Port',
        'Vessel Loaded',
        'Departed Origin',
        'In Transit',
        'Arrived Destination',
        'Customs Cleared',
        'Final Delivery',
    ];

    /**
     * @return array{title: string, body: string}
     */
    public static function notification(string $milestone, string $orderReference, string $shipmentReference): array
    {
        $label = self::canonicalLabel($milestone) ?? trim(strip_tags($milestone));
        $shipmentSuffix = " Shipment reference: {$shipmentReference}.";
        $notification = match ($label) {
            'Awaiting Booking' => [
                'Awaiting Shipment Booking',
                "Your order {$orderReference} is awaiting shipment booking. We are coordinating the shipping arrangements for your consignment.",
            ],
            'Booking Confirmed' => [
                'Shipment Booking Confirmed',
                "The shipping booking for your order {$orderReference} has been successfully confirmed. Your shipment is scheduled for the next stage.",
            ],
            'Gate-In at Port' => [
                'Shipment Received at Port',
                "Your shipment for order {$orderReference} has successfully entered the port terminal and is awaiting vessel loading.",
            ],
            'Vessel Loaded' => [
                'Shipment Loaded on Vessel',
                "Your shipment for order {$orderReference} has been successfully loaded onto the designated vessel.",
            ],
            'Departed Origin' => [
                'Vessel Departed from Origin Port',
                "Your shipment for order {$orderReference} has departed from the origin port and is officially on its international journey.",
            ],
            'In Transit' => [
                'Shipment In Transit',
                "Your shipment for order {$orderReference} is currently in transit to the destination port. Track your shipment for the latest updates.",
            ],
            'Arrived Destination' => [
                'Vessel Arrived at Destination Port',
                "Your shipment for order {$orderReference} has arrived at the destination port and is awaiting the next clearance procedures.",
            ],
            'Customs Cleared' => [
                'Customs Clearance Completed',
                "Your shipment for order {$orderReference} has successfully cleared customs at the destination and is ready for the next delivery stage.",
            ],
            'Final Delivery' => [
                'Final Delivery Completed',
                "Your shipment for order {$orderReference} has successfully reached its final delivery destination. Thank you for choosing OG Exports.",
            ],
            default => [
                'Shipment Milestone: '.Str::limit($label, 44, ''),
                "Your shipment for order {$orderReference} has a new logistics milestone: {$label}.",
            ],
        };

        return [
            'title' => $notification[0],
            'body' => $notification[1].$shipmentSuffix,
        ];
    }

    public static function isSame(?string $current, string $next): bool
    {
        return $current !== null
            && self::normalized($current) !== ''
            && self::normalized($current) === self::normalized($next);
    }

    public static function canonicalLabel(string $label): ?string
    {
        $normalized = self::normalized($label);

        foreach (self::FLOW as $stage) {
            if ($normalized === self::normalized($stage)) {
                return $stage;
            }
        }

        return null;
    }

    private static function normalized(string $label): string
    {
        return strtolower(trim(preg_replace('/[^a-z0-9]+/i', ' ', $label) ?? ''));
    }
}
