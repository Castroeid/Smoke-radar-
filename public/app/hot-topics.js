/* Topic labels describe explicit title mentions in the radar sample, not global trends. */
(function (root) {
  const definitions = [
    ['cut', 'picanha', 'פיקניה', 'Picanha', ['picanha', 'פיקניה', 'פיקניא']],
    ['cut', 'ribeye', 'אנטריקוט', 'Ribeye', ['ribeye', 'rib eye', 'entrecote', 'entrecôte', 'אנטריקוט']],
    ['cut', 'brisket', 'בריסקט', 'Brisket', ['brisket', 'בריסקט']],
    ['cut', 'short-ribs', 'שפונדרה / אסאדו', 'Short ribs', ['short ribs', 'short rib', 'beef ribs', 'asado de tira', 'שפונדרה', 'אסאדו']],
    ['cut', 'sirloin', 'סינטה', 'Sirloin', ['sirloin', 'striploin', 'סינטה']],
    ['cut', 'tenderloin', 'פילה', 'Tenderloin', ['tenderloin', 'filet mignon', 'פילה']],
    ['cut', 'chuck', 'אונטריב / כתף', 'Chuck', ['chuck', 'אונטריב', 'כתף']],
    ['cut', 'flank', 'פלנק', 'Flank', ['flank', 'פלנק', 'fraldinha']],
    ['style', 'smoking', 'עישון', 'Smoking', ['smoked', 'smoking', 'smoker', 'עישון', 'מעושן', 'מעושנת', 'מעשנה', 'defumado']],
    ['style', 'low-slow', 'בישול ארוך', 'Low and slow', ['low and slow', 'low & slow', 'slow cooked', 'slow cooking', 'בישול ארוך']],
    ['style', 'grilling', 'צלייה על האש', 'Grilling', ['grill', 'grilled', 'grilling', 'bbq', 'barbecue', 'churrasco', 'על האש', 'גריל']],
    ['style', 'open-fire', 'אש גלויה', 'Open fire', ['open fire', 'wood fire', 'אש גלויה']],
    ['style', 'braise', 'קדירה', 'Braising', ['braised', 'braising', 'stew', 'קדירה', 'קדרה']],
    ['style', 'sous-vide', 'סו ויד', 'Sous vide', ['sous vide', 'sous-vide', 'סו ויד']],
    ['style', 'reverse-sear', 'צריבה הפוכה', 'Reverse sear', ['reverse sear', 'צריבה הפוכה', 'ריברס סיר']],
    ['style', 'cast-iron', 'מחבת ברזל', 'Cast iron', ['cast iron', 'cast-iron', 'מחבת ברזל']],
    ['spice', 'paprika', 'פפריקה', 'Paprika', ['paprika', 'פפריקה']],
    ['spice', 'black-pepper', 'פלפל שחור', 'Black pepper', ['black pepper', 'פלפל שחור', 'pimenta do reino']],
    ['spice', 'garlic', 'שום', 'Garlic', ['garlic', 'שום', 'alho']],
    ['spice', 'cumin', 'כמון', 'Cumin', ['cumin', 'כמון', 'cominho']],
    ['spice', 'chili', 'צ׳ילי', 'Chili', ['chili', 'chilli', 'צילי', 'צ׳ילי', "צ'ילי"]],
    ['spice', 'cajun', 'קייג׳ון', 'Cajun', ['cajun', 'קייגון', 'קייג׳ון']],
    ['spice', 'zaatar', 'זעתר', 'Za’atar', ['zaatar', "za'atar", 'זעתר']],
    ['spice', 'rosemary', 'רוזמרין', 'Rosemary', ['rosemary', 'רוזמרין']],
    ['spice', 'coriander', 'כוסברה', 'Coriander', ['coriander', 'כוסברה']]
  ];
  function normalize(text) {
    return String(text || '').normalize('NFKC').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function mentions(title, alias) {
    const escaped = normalize(alias).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'u').test(normalize(title));
  }
  function videoId(video) {
    if (/^[\w-]{11}$/.test(String(video.id || ''))) return String(video.id);
    try {
      const url = new URL(video.url);
      if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return null;
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.match(/^\/shorts\/([\w-]{11})/)?.[1];
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  }
  function build(videos) {
    const unique = new Map();
    for (const video of Array.isArray(videos) ? videos : []) {
      if (!video || typeof video.title !== 'string') continue;
      const id = videoId(video);
      if (id && !unique.has(id)) unique.set(id, { ...video, id, url: `https://www.youtube.com/watch?v=${id}` });
    }
    const topics = definitions.map(([category, id, he, en, aliases]) => {
      const matches = [...unique.values()].filter(video => aliases.some(alias => mentions(video.title, alias)))
        .sort((a, b) => (Number(b.smokeScore) || 0) - (Number(a.smokeScore) || 0));
      return { category, id: `${category}-${id}`, labels: { he, en }, videos: matches, count: matches.length };
    }).filter(topic => topic.count > 0);
    return topics.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  }
  const api = { build, mentions, videoId };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HotTopics = api;
})(globalThis);
