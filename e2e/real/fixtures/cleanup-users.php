<?php
/**
 * TEST FIXTURE (real-backend E2E only): deletes leftover disposable E2E accounts (…@e2e.example.com)
 * through the normal account-deletion service (same path as DELETE /me), e.g. after an aborted run.
 * Refuses unless APP_ENV=local. Never touches any other account.
 *
 * Usage: php cleanup-users.php <laravel-dir>
 */
$dir = $argv[1] ?? null;
if (! $dir) {
    fwrite(STDERR, "usage: php cleanup-users.php <laravel-dir>\n");
    exit(2);
}
chdir($dir);
require $dir.'/vendor/autoload.php';
$app = require $dir.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! $app->environment('local')) {
    fwrite(STDERR, "refusing: APP_ENV must be local\n");
    exit(2);
}
$service = $app->make(App\Services\Account\AccountService::class);
$count = 0;
$emails = [];
foreach (App\Models\User::query()->where('email', 'like', '%@e2e.example.com')->get() as $user) {
    // deleteAccount() re-checks the password; fixtures share one known password, others are reset first.
    $user->forceFill(['password' => 'E2e-Passw0rd-2026'])->save();
    $service->deleteAccount($user->fresh(), 'E2e-Passw0rd-2026');
    $count++;
    $emails[] = $user->email;
}
echo "{$count} disposable e2e account(s) deleted".($emails ? ': '.implode(', ', $emails) : '')."\n";
