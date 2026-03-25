# Smoke Radar 🥩

Smoke Radar is a mobile-first trend intelligence dashboard focused on meat-related video content.

The project tracks and presents video momentum in a clean, signal-driven interface inspired by modern live-data products. It was built as an experimental product concept that combines content discovery, lightweight analytics, and a strong visual identity.

## What the project does

Smoke Radar is designed to surface meat-related content signals from YouTube and present them as a structured dashboard instead of a simple list of videos.

The interface includes:
- a central **Smoke Index**
- a **Hot / Rising** content view
- momentum-oriented video cards
- top channel comparison
- keyword clustering
- fallback handling for quota limits and unavailable live data

## Product idea

The goal of Smoke Radar is not just to show videos, but to translate content activity into something that feels closer to a live intelligence product.

Instead of treating the feed like a standard media page, the project frames video discovery through:
- momentum
- trend signals
- visual hierarchy
- fast mobile readability

## Current state

This project is currently an MVP / prototype.

It already includes:
- a deployed frontend and backend
- YouTube API integration
- low-quota handling
- cached / fallback modes
- a responsive UI with a custom dashboard look

At the same time, it is still intentionally lightweight and evolving.

## Important note about live data

Smoke Radar depends on the YouTube Data API, which has daily quota limits.

Because of that, the project currently supports different data states:
- **Live** — fresh data fetched successfully
- **Cached** — previously saved results shown when live requests fail
- **Offline Snapshot** — fallback content shown when no live data is available

This makes the UI more stable and avoids a broken experience when API limits are reached.

## Why this project exists

Smoke Radar was built as a creative product experiment:
- part content analytics concept
- part dashboard design exercise
- part branding / interface prototype

It explores what a niche “trend radar” product could look like if it focused on a very specific vertical: meat, BBQ, smoking, steak, brisket, and related food creators.

## Tech stack

- HTML / CSS / JavaScript
- Node.js
- Express
- Chart.js
- YouTube Data API

## Design direction

The design aims to feel:
- clean
- premium
- mobile-first
- slightly playful, but still professional

The visual direction is inspired by live signal dashboards, while being adapted into its own product language around food and meat content.

## Planned improvements

Possible next steps for the project:
- country-level content breakdown
- smarter scoring logic
- longer-term caching or database persistence
- product recommendations
- expert quote modules
- richer trend history
- more advanced content categories

## Final note

Smoke Radar is an honest prototype with a strong concept behind it.

It is already functional, but it is also still in progress. The value of the project is not only in the current feature set, but in the product direction it demonstrates: turning niche video discovery into a focused, visual, live-feeling intelligence tool.
