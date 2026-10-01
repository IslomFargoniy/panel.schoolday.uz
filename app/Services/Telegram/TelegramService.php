<?php

namespace App\Services\Telegram;

use App\Models\Setting;
use App\Models\Student;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Api;
use Telegram\Bot\Keyboard\Keyboard;

class TelegramService
{
    protected ?Api $telegram = null;

    protected string $token = '';

    public function __construct(?string $token = null)
    {
        if ($token !== null) {
            $this->token = $token;
        } else {
            $bot = Setting::where('key', '=', 'telegram_bot_token')->first();
            $this->token = $bot ? (string) $bot->value : '';
        }

        if (! empty($this->token)) {
            try {
                $this->telegram = new Api($this->token);
            } catch (Exception $e) {
                Log::error('Telegram API init error: ' . $e->getMessage());
                $this->telegram = null;
            }
        }
    }

    public function hasToken(): bool
    {
        return ! empty($this->token) && $this->telegram !== null;
    }

    public function setWebhook(string $url): void
    {
        if (empty($this->token)) {
            return;
        }

        try {
            $params = ['url' => $url];
            $secret = config('services.telegram.webhook_secret');
            if (! empty($secret)) {
                $params['secret_token'] = $secret;
            }

            $this->telegram->setWebhook($params);
        } catch (Exception $e) {
            Log::error('Telegram setWebhook error: ' . $e->getMessage());
        }
    }

    /**
     * Handle incoming updates (commands, messages, contacts)
     */
    public function handleUpdate(array $update): void
    {
        $message = $update['message'] ?? null;
        if (! $message) {
            return;
        }

        $chatId = $message['chat']['id'];
        $fromId = $message['from']['id'] ?? null;
        $text = $message['text'] ?? null;
        $contact = $message['contact'] ?? null;
        $newChatMembers = $message['new_chat_members'] ?? null;

        // Agar xabar guruhdan kelgan bo'lsa (guruh ID si har doim manfiy bo'ladi)
        if ($chatId < 0) {
            if ($text === '/start' || $text === '/info' || str_starts_with((string) $text, '/start') || ! empty($newChatMembers)) {
                $this->sendGroupInfo($chatId);
            }

            return; // Guruhda boshqa narsalarga spam qilmaslik uchun to'xtatamiz
        }

        if ($text === '/start') {
            $this->askPhoneNumber($chatId);
        } elseif ($contact) {
            $this->savePhoneNumber($chatId, $contact, $fromId);
        } else {
            $this->sendUnknownCommand($chatId);
        }
    }

    /**
     * Send group info for linked classes
     */
    protected function sendGroupInfo(int|string $chatId): void
    {
        try {
            $schoolClass = \App\Models\SchoolClass::with(['shift.branch'])->withCount('students')->where('telegram_group_id', $chatId)->first();

            if ($schoolClass) {
                $className = e($schoolClass->name);
                $shiftName = e($schoolClass->shift?->name ?? '-');
                $branchName = e($schoolClass->shift?->branch?->name ?? '-');
                $studentsCount = (int) ($schoolClass->students_count ?? 0);

                $message = "🏫 <b>Sinf:</b> {$className}\n🕗 <b>Smena:</b> {$shiftName}\n🏢 <b>Filial:</b> {$branchName}\n👥 <b>O'quvchilar soni:</b> {$studentsCount} ta\n\n✅ <i>Ushbu guruh tizimga muvaffaqiyatli ulangan.</i>";
                $this->sendSafeMessage($chatId, $message);
            } else {
                $escapedChatId = e((string) $chatId);
                $message = "⚠️ Ushbu guruh tizimga ulanmagan.\n\nIltimos, ushbu ID ni admin panelda tegishli sinf sozlamalariga kiriting.\n👇 <b>Nusxalash uchun ID ustiga bosing:</b>\n\n<code>{$escapedChatId}</code>";
                $this->sendSafeMessage($chatId, $message);
            }
        } catch (Exception $e) {
            Log::error('Telegram sendGroupInfo error: ' . $e->getMessage());
        }
    }

    /**
     * Step 1 — Ask user to share phone number
     */
    protected function askPhoneNumber(int|string $chatId): void
    {
        $keyboard = Keyboard::make([
            'keyboard' => [
                [
                    Keyboard::button([
                        'text' => '📱 Share my phone number',
                        'request_contact' => true,
                    ]),
                ],
            ],
            'resize_keyboard' => true,
            'one_time_keyboard' => true,
        ]);

        $this->sendSafeMessage(
            $chatId,
            "👋 Xush kelibsiz. Tizimdan to'liq foydalanish uchun telefon raqamingizni yuboring (tugmani bosgan holda).",
            $keyboard
        );
    }

    /**
     * Step 2 — Save phone number to DB
     */
    protected function savePhoneNumber(int|string $chatId, array $contact, ?int $fromId = null): void
    {
        try {
            $contactUserId = $contact['user_id'] ?? null;
            if (! $contactUserId || (string) $contactUserId !== (string) $fromId) {
                $this->sendSafeMessage(
                    $chatId,
                    "❌ Iltimos, faqat o'z raqamingizni yuboring.",
                    Keyboard::remove()
                );

                return;
            }

            $rawContactPhone = (string) ($contact['phone_number'] ?? '');
            $normalizedPhone = preg_replace('/\D+/', '', $rawContactPhone);

            if (empty($normalizedPhone)) {
                $this->sendSafeMessage(
                    $chatId,
                    '❌ Telefon raqami yaroqsiz formatda.',
                    Keyboard::remove()
                );

                return;
            }

            $possiblePhones = [$normalizedPhone];
            if (str_starts_with($normalizedPhone, '998') && strlen($normalizedPhone) === 12) {
                $possiblePhones[] = substr($normalizedPhone, 3);
            }

            $cleanPhoneSql = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(phone, ''), '+', ''), ' ', ''), '-', ''), '(', ''), ')', '')";

            $userUpdated = User::whereIn(\Illuminate\Support\Facades\DB::raw($cleanPhoneSql), $possiblePhones)
                ->update(['telegram_id' => $chatId]);

            $studentUpdated = Student::whereIn(\Illuminate\Support\Facades\DB::raw($cleanPhoneSql), $possiblePhones)
                ->update(['telegram_id' => $chatId]);

            if ($userUpdated || $studentUpdated) {
                $linkedNames = collect();

                if ($userUpdated) {
                    $users = User::whereIn(\Illuminate\Support\Facades\DB::raw($cleanPhoneSql), $possiblePhones)->get();
                    foreach ($users as $u) {
                        $linkedNames->push('👤 <b>' . e($u->name) . "</b> (Xodim/O'qituvchi)");
                    }
                }

                if ($studentUpdated) {
                    $students = Student::whereIn(\Illuminate\Support\Facades\DB::raw($cleanPhoneSql), $possiblePhones)->get();
                    foreach ($students as $s) {
                        $linkedNames->push('🎓 <b>' . e($s->name) . "</b> (O'quvchi)");
                    }
                }

                $namesList = $linkedNames->join("\n");

                $message = "👋 <b>Tizimga ulanish yakunlandi!</b>\n\nQuyidagi hisoblar ushbu raqamga biriktirildi:\n\n{$namesList}\n\nEndi ularga oid bildirishnomalarni qabul qilib olasiz.";

                $this->sendSafeMessage($chatId, $message, Keyboard::remove());
            } else {
                $this->sendSafeMessage(
                    $chatId,
                    "❌ Sizning raqamingiz bazada o'quvchi yoki admin sifatida topilmadi. Iltimos, ma'muriyat bilan bog'laning.",
                    Keyboard::remove()
                );
            }

        } catch (Exception $e) {
            \Log::error('Error saving Telegram phone: ' . $e->getMessage());

            $this->sendSafeMessage(
                $chatId,
                "❌ Telefon raqamingizni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
                Keyboard::remove()
            );
        }
    }

    /**
     * Unknown command handler
     */
    protected function sendUnknownCommand(int|string $chatId): void
    {
        if (! $this->hasToken()) {
            return;
        }

        try {
            $this->telegram->sendMessage([
                'chat_id' => $chatId,
                'text' => "Nomalum buyruq. Iltimos, /start buyrug'ini yuboring.",
            ]);
        } catch (Exception $e) {
            Log::error('Telegram sendMessage error: ' . $e->getMessage());
        }
    }

    /**
     * Safe message sender
     */
    public function sendSafeMessage(int|string $chatId, string $text, ?Keyboard $keyboard = null): bool
    {
        if (! $this->hasToken()) {
            return false;
        }

        try {
            $params = [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
            ];

            if ($keyboard) {
                $params['reply_markup'] = $keyboard;
            }

            $this->telegram->sendMessage($params);

            return true;
        } catch (Exception $e) {
            Log::error('Telegram sendMessage error: ' . $e->getMessage());

            return false;
        }
    }

    /**
     * Send photo with fallback to standard message
     */
    public function sendPhotoWithFallback(int|string $chatId, string $photoPath, string $caption): bool
    {
        if (! $this->hasToken()) {
            return false;
        }

        try {
            // First check if photo exists
            $fullPath = storage_path('app/public/' . $photoPath);
            if (! file_exists($fullPath)) {
                return $this->sendSafeMessage($chatId, $caption);
            }

            $this->telegram->sendPhoto([
                'chat_id' => $chatId,
                'photo' => \Telegram\Bot\FileUpload\InputFile::create($fullPath, basename($photoPath)),
                'caption' => $caption,
                'parse_mode' => 'HTML',
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Telegram sendPhoto error: ' . $e->getMessage() . '. Falling back to text message.');

            // Fallback to regular text message
            return $this->sendSafeMessage($chatId, $caption);
        }
    }
}
