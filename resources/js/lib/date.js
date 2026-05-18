const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

function parseDateValue(value) {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const normalized = DATE_ONLY_PATTERN.test(trimmed)
        ? `${trimmed}T00:00:00`
        : trimmed;

    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

export function formatDateDisplay(value, fallback = '-') {
    const parsed = parseDateValue(value);

    if (!parsed) {
        return fallback;
    }

    return dateFormatter.format(parsed);
}

export function formatDateTimeDisplay(value, fallback = '-') {
    const parsed = parseDateValue(value);

    if (!parsed) {
        return fallback;
    }

    return dateTimeFormatter.format(parsed);
}
