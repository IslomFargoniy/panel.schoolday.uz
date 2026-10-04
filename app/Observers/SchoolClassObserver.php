<?php

namespace App\Observers;

use App\Jobs\SendClassGroupLinkedNotificationJob;
use App\Models\SchoolClass;

class SchoolClassObserver
{
    /**
     * Handle the SchoolClass "created" event.
     */
    public function created(SchoolClass $schoolClass): void
    {
        if (! empty($schoolClass->telegram_group_id)) {
            SendClassGroupLinkedNotificationJob::dispatch($schoolClass->id)->afterCommit();
        }
    }

    /**
     * Handle the SchoolClass "updated" event.
     */
    public function updated(SchoolClass $schoolClass): void
    {
        if ($schoolClass->wasChanged('telegram_group_id') && ! empty($schoolClass->telegram_group_id)) {
            SendClassGroupLinkedNotificationJob::dispatch($schoolClass->id)->afterCommit();
        }
    }
}
