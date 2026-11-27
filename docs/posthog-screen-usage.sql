-- PostHog SQL insight. Each row is a screen in the public web app.
-- An anonymous visitor is a browser profile. A returning visit can open a screen repeatedly.
-- Only views with a duration sample contribute to the average foreground time.
SELECT
    screen,
    uniq(browser_id) AS visitors,
    uniqIf(session_id, session_id IS NOT NULL) AS visits,
    count() AS screen_views,
    countIf(samples > 0) AS timed_views,
    round(sum(visible_ms) / nullIf(countIf(samples > 0), 0) / 1000, 1) AS avg_visible_seconds
FROM (
    SELECT
        properties.screen AS screen,
        properties.screen_view_id AS view_id,
        anyIf(distinct_id, event = '$pageview') AS browser_id,
        anyIf(properties.$session_id, event = '$pageview') AS session_id,
        sumIf(toFloat(properties.visible_ms), event = 'app_screen_time') AS visible_ms,
        countIf(event = 'app_screen_time') AS samples
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND event IN ('$pageview', 'app_screen_time')
      AND properties.$host = 'smoke-radar.onrender.com'
      AND properties.screen_view_id IS NOT NULL
      AND coalesce(toString(properties.internal_user), '') != 'true'
      AND coalesce(toString(properties.tester), '') != 'true'
    GROUP BY screen, view_id
    HAVING countIf(event = '$pageview') > 0
)
GROUP BY screen
ORDER BY screen_views DESC
