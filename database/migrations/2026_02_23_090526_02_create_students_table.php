<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->text('comment')->nullable();
            $table->string('employeeNoString')->unique()->nullable()->comment('Hikvision ID');
            $table->string('status')->default('active');
            $table->string('face_image')->nullable();
            $table->string('gender')->default('unknown')->comment('male, female, unknown');
            $table->string('user_verify_mode')->default('face')->comment('face, cardAndPw, card, faceAndPw, faceAndCard, cardOrfaceOrPw, cardOrFace, faceOrPw');
            $table->boolean('local_ui_right')->default(false)->comment('false = Attendance Check Only');
            $table->string('door_right')->default('1')->comment('Door number(s), e.g. 1');
            $table->string('plan_template_no')->default('1')->comment('Access schedule template number');
            $table->boolean('valid_enabled')->default(false)->comment('false = Long-Term Effective User');
            $table->dateTime('valid_begin')->nullable();
            $table->dateTime('valid_end')->nullable();
            $table->unsignedBigInteger('telegram_id')->nullable();
            $table->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
