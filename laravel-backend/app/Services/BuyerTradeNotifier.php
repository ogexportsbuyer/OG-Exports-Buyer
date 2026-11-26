<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Quotation;
use App\Models\Shipment;
use App\Models\TradeDocument;
use App\Models\User;
use App\Support\DepositReviewStatuses;
use App\Support\NotifiesUsers;
use App\Support\OrderStatuses;
use App\Support\PortalNotificationTypes;
use Illuminate\Support\Str;

class BuyerTradeNotifier
{
    public static function orderStatusUpdated(Order $order, ?string $previousStatus = null, ?string $previousPaymentStatus = null): void
    {
        $buyer = self::buyerFromOrder($order);
        if (! $buyer) {
            return;
        }

        $orderNumber = $order->order_number ?: '#'.$order->id;
        $statusLabel = OrderStatuses::LABELS[$order->status]
            ?? ucfirst(str_replace('_', ' ', (string) $order->status));
        $orderStatusChanged = $previousStatus === null
            || (string) $order->status !== (string) $previousStatus;
        $paymentStatusChanged = $previousPaymentStatus !== null
            && (string) $order->payment_status !== (string) $previousPaymentStatus
            && filled($order->payment_status);
        $paymentStatusLabel = DepositReviewStatuses::label($order->payment_status);

        $parts = [];
        if ($orderStatusChanged) {
            $parts[] = "Order status is now {$statusLabel}.";
        }
        if ($paymentStatusChanged) {
            $parts[] = "Payment status is now {$paymentStatusLabel}.";
        }
        if (filled($order->notes)) {
            $parts[] = 'Note: '.Str::limit((string) $order->notes, 120);
        }
        if ($parts === []) {
            return;
        }

        $title = $paymentStatusChanged && ! $orderStatusChanged
            ? "Payment {$paymentStatusLabel} — {$orderNumber}"
            : self::orderStatusTitle((string) $order->status).' — '.$orderNumber;

        $href = '/buyer/orders';
        $portalUrl = self::portalUrl($href);

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::ORDER_STATUS,
            $title,
            implode(' ', $parts),
            [
                'order_id' => $order->id,
                'order_number' => $orderNumber,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'notification_event' => $paymentStatusChanged && ! $orderStatusChanged
                    ? 'payment_status'
                    : ($paymentStatusChanged ? 'order_and_payment_status' : 'order_status'),
                'href' => $href,
            ],
            'buyer_order_status_update',
            [
                'order_number' => $orderNumber,
                'status' => $statusLabel,
                'payment_status' => DepositReviewStatuses::label($order->payment_status),
                'notes' => (string) ($order->notes ?? ''),
                'portal_url' => $portalUrl,
            ]
        );
    }

    public static function quotationReply(Quotation $quotation, string $messageBody): void
    {
        $buyer = $quotation->buyer;
        if (! $buyer) {
            $quotation->loadMissing('buyer');
            $buyer = $quotation->buyer;
        }
        if (! $buyer) {
            return;
        }

        $ref = 'QT-'.$quotation->id;
        $preview = Str::limit(strip_tags($messageBody), 200);
        $href = '/buyer/quotations';
        $portalUrl = self::portalUrl($href);

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::QUOTATION_REPLY,
            "Reply on quotation — {$ref}",
            $preview,
            [
                'quotation_id' => $quotation->id,
                'rfq_id' => $quotation->rfq_id,
                'href' => $href,
            ],
            'quotation_reply',
            [
                'quotation_ref' => $ref,
                'message_preview' => $preview,
                'portal_url' => $portalUrl,
            ]
        );
    }

    public static function shipmentCreated(Shipment $shipment): void
    {
        $buyer = self::buyerFromShipment($shipment);
        if (! $buyer) {
            return;
        }

        $label = $shipment->container ?: ($shipment->product_snapshot ?: 'Shipment #'.$shipment->id);
        $href = '/buyer/shipments';

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::SHIPMENT_UPDATE,
            "Shipment Tracking Created — {$label}",
            'A shipment has been created for your order. Track progress in your portal.',
            [
                'shipment_id' => $shipment->id,
                'order_id' => $shipment->order_id,
                'order_number' => self::orderNumberForShipment($shipment),
                'status' => $shipment->status,
                'current_milestone' => $shipment->current_milestone,
                'href' => $href,
            ],
            'buyer_shipment_update',
            [
                'container' => (string) ($shipment->container ?: $label),
                'milestone' => (string) ($shipment->current_milestone ?: 'Created'),
                'vessel' => (string) ($shipment->vessel ?: '—'),
                'portal_url' => self::portalUrl($href),
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $changes
     */
    public static function shipmentUpdated(Shipment $shipment, array $changes): void
    {
        if ($changes === []) {
            return;
        }

        $buyer = self::buyerFromShipment($shipment);
        if (! $buyer) {
            return;
        }

        $label = $shipment->container ?: ($shipment->product_snapshot ?: 'Shipment #'.$shipment->id);
        $parts = [];
        if (isset($changes['current_milestone'])) {
            $parts[] = 'Milestone: '.$changes['current_milestone'];
        }
        if (isset($changes['status'])) {
            $parts[] = 'Status: '.ucfirst(str_replace('_', ' ', (string) $changes['status']));
        }
        if (isset($changes['vessel'])) {
            $parts[] = 'Vessel: '.$changes['vessel'];
        }
        if (isset($changes['eta'])) {
            $parts[] = 'ETA: '.$changes['eta'];
        }
        if (isset($changes['etd'])) {
            $parts[] = 'ETD: '.$changes['etd'];
        }
        if ($parts === []) {
            $parts[] = 'Shipment details were updated.';
        }

        $milestone = trim((string) ($changes['current_milestone'] ?? ''));
        $status = trim((string) ($changes['status'] ?? ''));
        $title = $milestone !== ''
            ? "Shipment Milestone: {$milestone} — {$label}"
            : ($status !== ''
                ? 'Shipment Status: '.ucfirst(str_replace('_', ' ', $status))." — {$label}"
                : "Shipment Details Updated — {$label}");
        $href = '/buyer/shipments';
        $body = implode('. ', $parts).'.';

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::SHIPMENT_UPDATE,
            $title,
            $body,
            [
                'shipment_id' => $shipment->id,
                'order_id' => $shipment->order_id,
                'order_number' => self::orderNumberForShipment($shipment),
                'status' => $shipment->status,
                'current_milestone' => $shipment->current_milestone,
                'href' => $href,
            ],
            'buyer_shipment_update',
            [
                'container' => (string) ($shipment->container ?: $label),
                'milestone' => (string) ($shipment->current_milestone ?: ($changes['current_milestone'] ?? 'Updated')),
                'vessel' => (string) ($shipment->vessel ?: ($changes['vessel'] ?? '—')),
                'portal_url' => self::portalUrl($href),
            ]
        );
    }

    public static function tradeDocumentUploaded(Order $order, TradeDocument $doc): void
    {
        $buyer = self::buyerFromOrder($order);
        if (! $buyer) {
            return;
        }

        $orderNumber = $order->order_number ?: '#'.$order->id;
        $docType = $doc->title ?: $doc->type ?: 'Document';
        $href = '/buyer/documents';

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::TRADE_DOCUMENT,
            "Document uploaded — {$orderNumber}",
            "{$docType} is available for order {$orderNumber}.",
            [
                'order_id' => $order->id,
                'document_id' => $doc->id,
                'href' => $href,
            ],
            'buyer_trade_document',
            [
                'order_number' => $orderNumber,
                'document_type' => $docType,
                'portal_url' => self::portalUrl($href),
            ]
        );
    }

    public static function paymentApproved(Order $order): void
    {
        $buyer = self::buyerFromOrder($order);
        if (! $buyer) {
            return;
        }

        $orderNumber = $order->order_number ?: '#'.$order->id;
        $href = '/buyer/payments';

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::BUYER_PAYMENT_APPROVED,
            "Payment Verified — {$orderNumber}",
            "Your payment for order {$orderNumber} has been verified.",
            ['order_id' => $order->id, 'order_number' => $orderNumber, 'status' => 'verified', 'href' => $href],
            'buyer_payment_approved',
            [
                'order_number' => $orderNumber,
                'portal_url' => self::portalUrl($href),
            ]
        );
    }

    public static function paymentRejected(Order $order): void
    {
        $buyer = self::buyerFromOrder($order);
        if (! $buyer) {
            return;
        }

        $orderNumber = $order->order_number ?: '#'.$order->id;
        $href = '/buyer/payments';

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::BUYER_PAYMENT_REJECTED,
            "Payment Rejected — {$orderNumber}",
            "Your payment for order {$orderNumber} was rejected. Please resubmit or contact support.",
            ['order_id' => $order->id, 'order_number' => $orderNumber, 'status' => 'rejected', 'href' => $href],
            'buyer_payment_rejected',
            [
                'order_number' => $orderNumber,
                'portal_url' => self::portalUrl($href),
            ]
        );
    }

    public static function paymentCancelled(Order $order): void
    {
        $buyer = self::buyerFromOrder($order);
        if (! $buyer) {
            return;
        }

        $orderNumber = $order->order_number ?: '#'.$order->id;
        $href = '/buyer/payments';

        NotifiesUsers::notifyAndEmail(
            $buyer,
            PortalNotificationTypes::BUYER_PAYMENT_CANCELLED,
            "Payment Request Cancelled — {$orderNumber}",
            "Your pending payment for order {$orderNumber} has been cancelled.",
            ['order_id' => $order->id, 'order_number' => $orderNumber, 'status' => 'cancelled', 'href' => $href],
            'buyer_payment_cancelled',
            [
                'order_number' => $orderNumber,
                'portal_url' => self::portalUrl($href),
            ]
        );
    }

    public static function supportReply(User $user, string $ticketNumber, int $ticketId, string $messageBody): void
    {
        $isBuyer = $user->hasRole('buyer');
        $href = $isBuyer ? '/buyer/messages' : '/invest/messages';
        $preview = Str::limit(strip_tags($messageBody), 200);

        // Buyers get email on every admin reply; investors get in-app only for replies.
        if ($isBuyer) {
            NotifiesUsers::notifyAndEmail(
                $user,
                PortalNotificationTypes::SUPPORT_TICKET,
                "Reply on ticket {$ticketNumber}",
                $preview,
                ['ticket_id' => $ticketId, 'ticket_number' => $ticketNumber, 'support_event' => 'reply', 'href' => $href],
                'support_ticket_update',
                [
                    'ticket_number' => $ticketNumber,
                    'status' => 'Answered',
                    'message_preview' => $preview,
                    'portal_url' => self::portalUrl($href),
                ]
            );

            return;
        }

        NotifiesUsers::notify(
            $user,
            PortalNotificationTypes::SUPPORT_TICKET,
            "Reply on ticket {$ticketNumber}",
            $preview,
            ['ticket_id' => $ticketId, 'ticket_number' => $ticketNumber, 'support_event' => 'reply', 'href' => $href]
        );
    }

    public static function supportStatusChanged(User $user, string $ticketNumber, int $ticketId, string $status): void
    {
        $isBuyer = $user->hasRole('buyer');
        $href = $isBuyer ? '/buyer/messages' : '/invest/messages';
        $statusLabel = ucfirst(str_replace('_', ' ', $status));
        $title = "Ticket {$ticketNumber} — {$statusLabel}";
        $body = "Your support ticket status is now {$statusLabel}.";
        $isMajor = in_array(strtolower($status), ['resolved', 'closed'], true);

        // Email for buyers always; for investors only on resolved/closed (major events).
        if ($isBuyer || $isMajor) {
            NotifiesUsers::notifyAndEmail(
                $user,
                PortalNotificationTypes::SUPPORT_TICKET,
                $title,
                $body,
                ['ticket_id' => $ticketId, 'ticket_number' => $ticketNumber, 'status' => $status, 'support_event' => 'status_changed', 'href' => $href],
                'support_ticket_update',
                [
                    'ticket_number' => $ticketNumber,
                    'status' => $statusLabel,
                    'message_preview' => $body,
                    'portal_url' => self::portalUrl($href),
                ]
            );

            return;
        }

        NotifiesUsers::notify(
            $user,
            PortalNotificationTypes::SUPPORT_TICKET,
            $title,
            $body,
            ['ticket_id' => $ticketId, 'ticket_number' => $ticketNumber, 'status' => $status, 'support_event' => 'status_changed', 'href' => $href]
        );
    }

    private static function buyerFromOrder(Order $order): ?User
    {
        $order->loadMissing('buyer');

        return $order->buyer;
    }

    private static function buyerFromShipment(Shipment $shipment): ?User
    {
        $shipment->loadMissing(['buyer', 'order']);

        return $shipment->buyer;
    }

    private static function orderNumberForShipment(Shipment $shipment): string
    {
        $shipment->loadMissing('order');

        return $shipment->order?->order_number
            ?: ($shipment->order_id ? '#'.$shipment->order_id : 'Shipment #'.$shipment->id);
    }

    private static function orderStatusTitle(string $status): string
    {
        return match ($status) {
            OrderStatuses::ORDER_CONFIRMED => 'Order Confirmed Successfully',
            OrderStatuses::PAYMENT => 'Order Payment Stage Started',
            OrderStatuses::PRODUCTION => 'Production & Procurement Started',
            OrderStatuses::QUALITY_INSPECTION => 'Quality Inspection in Progress',
            OrderStatuses::LOADED_AT_PORT => 'Shipment Loaded at Port',
            OrderStatuses::IN_TRANSIT => 'Shipment Dispatched — In Transit',
            OrderStatuses::DELIVERED => 'Order Delivered Successfully',
            OrderStatuses::CANCELLED => 'Order Cancelled',
            default => 'Order Status: '.(OrderStatuses::LABELS[$status] ?? ucfirst(str_replace('_', ' ', $status))),
        };
    }

    private static function portalUrl(string $path): string
    {
        return rtrim((string) config('app.frontend_url', config('app.url')), '/').$path;
    }
}
