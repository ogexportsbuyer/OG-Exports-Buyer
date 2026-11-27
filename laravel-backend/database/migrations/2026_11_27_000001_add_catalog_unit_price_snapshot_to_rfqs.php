<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('rfqs', 'catalog_unit_price_snapshot')) {
            Schema::table('rfqs', function (Blueprint $table) {
                $table->decimal('catalog_unit_price_snapshot', 12, 2)
                    ->nullable()
                    ->after('product_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('rfqs', 'catalog_unit_price_snapshot')) {
            Schema::table('rfqs', function (Blueprint $table) {
                $table->dropColumn('catalog_unit_price_snapshot');
            });
        }
    }
};
