<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('unit_of_measure', 32)->default('MT')->after('currency');
            $table->decimal('discount_percentage', 5, 2)->default(0)->after('unit_of_measure');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('list_unit_price', 12, 2)->nullable()->after('unit_price');
            $table->decimal('discount_percentage', 5, 2)->default(0)->after('list_unit_price');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('discount_percentage');
            $table->string('unit_of_measure', 32)->default('MT')->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'list_unit_price',
                'discount_percentage',
                'discount_amount',
                'unit_of_measure',
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['unit_of_measure', 'discount_percentage']);
        });
    }
};
