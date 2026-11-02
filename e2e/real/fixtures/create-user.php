<?php
/**
 * TEST FIXTURE (real-backend E2E only): creates a verified, disposable user directly in the API's
 * database so suites don't hit the registration rate limit (10/hour/IP). Registration itself is
 * covered through the UI by auth.spec.ts. Refuses to run unless APP_ENV=local and the e-mail is in
 * the reserved e2e.example.com domain.
 *
 * Usage: php create-user.php <laravel-dir> <email> <username> <name> <password> [USER|ADMIN]
 */
[$script, $dir, $email, $username, $name, $password, $role] = $argv + [null, null, null, null, null, null, 'USER'];
if (! in_array($role, ['USER', 'ADMIN'], true)) {
    fwrite(STDERR, "refusing: role must be USER or ADMIN\n");
    exit(2);
}
if (! $dir || ! $email || ! str_ends_with($email, '@e2e.example.com')) {
    fwrite(STDERR, "refusing: e-mail must end with @e2e.example.com\n");
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
$user = App\Models\User::query()->firstOrNew(['email' => mb_strtolower($email)]);
$user->forceFill([
    'name' => $name,
    'username' => $username,
    'password' => $password,
    'email_verified_at' => now(),
    'role' => $role,
    'status' => 'ACTIVE',
    'profile_public' => true,
    'locale' => 'en',
])->save();
echo $user->public_id, "\n";
