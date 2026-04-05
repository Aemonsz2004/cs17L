<?php

namespace App\Support;

class MailConfigurationGuard
{
    public function assertConfigured(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $defaultMailer = (string) config('mail.default', 'log');

        if (in_array($defaultMailer, ['log', 'array'], true)) {
            throw new \RuntimeException('Email delivery is disabled. Set MAIL_MAILER=smtp in .env.');
        }

        if ($defaultMailer !== 'smtp') {
            return;
        }

        $smtpScheme = (string) config('mail.mailers.smtp.scheme', '');
        if ($smtpScheme !== '' && ! in_array($smtpScheme, ['smtp', 'smtps'], true)) {
            throw new \RuntimeException('Invalid MAIL_SCHEME. Use MAIL_SCHEME=smtp (port 587) or MAIL_SCHEME=smtps (port 465).');
        }

        $smtpHost = (string) config('mail.mailers.smtp.host', '');
        $smtpPort = (int) config('mail.mailers.smtp.port', 0);
        $smtpUsername = trim((string) config('mail.mailers.smtp.username', ''));
        $smtpPassword = trim((string) config('mail.mailers.smtp.password', ''));

        if ($smtpHost === '' || $smtpPort === 0 || $smtpUsername === '' || $smtpPassword === '') {
            throw new \RuntimeException('SMTP settings are incomplete. Set MAIL_HOST, MAIL_PORT, MAIL_USERNAME, and MAIL_PASSWORD in .env.');
        }
    }

    public function toUserMessage(\Throwable $exception): string
    {
        $message = strtolower($exception->getMessage());

        if (str_contains($message, 'unsupported scheme')) {
            return 'Invalid mail scheme. Use MAIL_SCHEME=smtp (port 587) or MAIL_SCHEME=smtps (port 465), then retry.';
        }

        if (str_contains($message, 'badcredentials') || str_contains($message, 'code "535"') || str_contains($message, 'failed to authenticate on smtp server')) {
            return 'Gmail rejected the login. Use your Gmail address as MAIL_USERNAME and a Google App Password as MAIL_PASSWORD (your normal Gmail password will not work).';
        }

        if (str_contains($message, 'connection could not be established') || str_contains($message, 'timed out')) {
            return 'Cannot connect to Gmail SMTP. Check internet/firewall and verify MAIL_HOST=smtp.gmail.com, MAIL_PORT=587, MAIL_SCHEME=smtp.';
        }

        return 'Unable to send email right now. Please check mail settings and try again.';
    }
}