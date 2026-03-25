# Smoke Radar 🥩

Smoke Radar is a mobile-first trend intelligence dashboard focused on meat-related video content.

It was built as a product experiment that turns niche video discovery into a live-feeling signal dashboard. Instead of presenting content as a simple media feed, Smoke Radar frames it as a momentum-driven intelligence product.

## What Smoke Radar does

Smoke Radar monitors meat-related content signals and presents them through a structured dashboard experience.

The current product includes:
- a central **Smoke Index**
- **Hot** and **Rising** content views
- top-performing video tracking
- keyword clustering
- top channel comparison
- momentum-oriented ranking
- live, cached, and offline fallback modes

## Product concept

The main idea behind Smoke Radar is to treat meat content discovery as a signal problem, not just a browsing problem.

The product explores what happens when food content, especially BBQ, brisket, steak, smoking, and related creators, is presented in the language of dashboards, movement, and trend intelligence.

## Current modes

Because the project depends on the YouTube Data API, it can operate in multiple modes:

- **Live** — fresh data fetched successfully from the API
- **Cache** — previously saved data returned when live requests fail
- **Seed / Offline Snapshot** — fallback sample data used when live access and cache are unavailable

This makes the product more resilient and prevents a broken UI when API quota is exhausted.

## Tech stack

- HTML
- CSS
- JavaScript
- Node.js
- Express
- Chart.js
- YouTube Data API

## Design direction

The UI is designed to feel:
- mobile-first
- clean
- premium
- slightly playful
- dashboard-oriented rather than editorial

The visual language is inspired by live signal products, while being adapted into its own product identity around meat and food content.

## Why this project exists

Smoke Radar was built as:
- a product design exercise
- a frontend / backend prototype
- a branding concept
- an experiment in niche intelligence dashboards

It is intentionally focused on a specific vertical in order to explore what a highly opinionated media-tracking product could feel like.

## Roadmap

Planned or possible next steps include:
- country-level content breakdown
- stronger scoring logic
- better persistence for cached data
- embedded recipe generator
- meat product recommendations
- expert quote modules
- richer trend history
- additional signal views

## Recipe Generator (planned)

One of the planned product expansions is an embedded recipe generator.

The idea is to allow users to choose:
- meat type
- cut
- cooking style

and receive a structured recipe in return.

This feature is intended to connect the dashboard side of the product with practical cooking value, making Smoke Radar not only a content tracker, but also a useful meat-focused experience.

## Final note

Smoke Radar is an honest prototype with a strong concept behind it.

It is already functional, but still evolving. Its value is not only in its current features, but also in the product direction it explores: turning meat content discovery into a focused, visual, resilient intelligence tool.
