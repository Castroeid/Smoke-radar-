# Radar video topics

The app groups actual title mentions from the radar sample. Cards open matching YouTube videos; counts are deduplicated by video ID. This is not a claim of daily growth or a comprehensive topic search.

Seasoning topics recognize Hebrew and English, including rubs, brine, dry brine, wet brine, marinades, vacuum marinating, meat drying and dry aging. Specific brine or vacuum-marination mentions are not repeated on a generic brine/marinade card. Dry rub, dry brine, drying and dry aging remain separate. A vacuum-storage or sous-vide title alone does not imply marination.

Each live refresh keeps the original 12-result radar search and adds one 20-result search containing cooking-related alternatives joined by YouTube's OR operator. Both searches share the existing radar cache and refresh window; opening a topic does not call YouTube. IDs are deduplicated before one details request. A failure of the supplemental search preserves the original results; existing cache/quota fallback handles a failed main search or details request. New topics appear only if matching titles exist in the sample, after its next refresh.

Search reference: https://developers.google.com/youtube/v3/docs/search/list#q

Checks: `node --test tests/hot-topics.cjs tests/radar-search.cjs`.
