<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') — SchoolDay</title>
    <link rel="icon" href="/favicon.ico">
    <style>
        :root { --bg: #f7f8fa; --card: #fff; --text: #1d2330; --muted: #5d6677; --line: #e3e6ec; --accent: #2563eb; }
        @media (prefers-color-scheme: dark) {
            :root { --bg: #0f1218; --card: #171b23; --text: #e6e9ef; --muted: #9aa3b2; --line: #2a303b; --accent: #60a5fa; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
        nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        nav a { padding: 4px 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); text-decoration: none; font-size: 14px; }
        section { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        h1 { font-size: 26px; margin: 0 0 4px; }
        h2 { font-size: 18px; margin: 24px 0 8px; }
        p, li { color: var(--text); }
        .muted { color: var(--muted); font-size: 14px; }
        a { color: var(--accent); }
    </style>
</head>
<body>
<main>
    <nav><a href="#en">English</a><a href="#uz">O‘zbekcha</a><a href="#ru">Русский</a></nav>
    @yield('content')
    <p class="muted">SchoolDay · <a href="https://schoolday.uz">schoolday.uz</a> · <a href="mailto:{{ $email }}">{{ $email }}</a></p>
</main>
</body>
</html>
