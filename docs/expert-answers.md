# Ask the expert

The app previously selected one of three canned answers using local keyword rules. Unmatched questions (including roast beef and bare cut names) always suggested picanha. The screen now posts the actual question to `/api/ask-expert`, using the existing server-side OpenAI client and `gpt-4o-mini` structured output.

- `answer`: relevant cooking guidance; no default cut or equipment.
- `clarification`: no discernible question, such as a bare cut/dish name. A single word does not call the model unless it answers a preceding clarification.
- `out_of_scope`: a short explanation of the supported meat, cooking, smoking and grilling topics.
- HTTP 503: an unavailable/invalid provider response. The app keeps the question for retry; it does not invent a replacement answer.

The provider classifies complete questions semantically. Short context (up to four prior messages) supports follow-ups and is supplied as user data, not system instructions. “Ask about a new topic” clears it. Questions and responses stay in page memory; this change adds no database or transcript logging. The existing AI provider receives the question and the bounded context.

Requests are capped at 600 question characters, provider calls at 25 seconds and 1,800 output tokens. The UI has a 30-second timeout, blocks duplicate submission, escapes both question and answer text, and never navigates back to the expert screen after the user has left it. Responses are not cached. No new client key or dependency is needed.

The recipe action appears only for an actual answer with a recognized cut and a method supported by the current equipment mode. Clarifications, unrelated questions and failures cannot alter recipe preferences. The model is instructed not to recommend whole-cut recipes for ground-meat questions.

The assistant is not a searched or kitchen-tested recipe source. The prompt requires honest uncertainty and details before precise schedules. Conservative ordinary-cooking temperature guidance follows [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures), checked 2026-11-24. It must not invent curing/nitrite or sous-vide pasteurisation schedules.

Regression checks cover the user's shaitel and roast-beef examples, response categories, context, failure handling, duplicate submissions, escaped text and navigation. Live preview QA additionally checks the provider's actual responses; mocked tests alone do not establish semantic answer quality.
