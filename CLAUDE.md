# Flashcards

A flashcards study tool. Users create question/answer cards, flip them in review mode, and mark each as known or still learning.

## Core features

- Add a new card with a question and an answer
- Review mode: cards show the question first; click or press Space to flip to the answer
- Mark each card as **Known** or **Still learning**
- Edit or delete a card from the list
- The deck stays saved after the page is reloaded

## Tech stack

- HTML, CSS, JavaScript (no frameworks)
- `localStorage` for saving the deck
- Hosted on GitHub Pages

## How to run

Open `index.html` in a browser. There is no build step.

## Rules

- Keep everything in three files: `index.html`, `style.css`, `app.js`.
- Do not add any new libraries without asking first.
- Never put secrets (API keys, passwords, tokens) in the code, and never disclose them.
- Use relative paths (e.g. `style.css`, not `/style.css`) so the site works on GitHub Pages.
- Handle errors nicely. For example, if `localStorage` is full or unavailable, or the saved data is corrupted, show a friendly message instead of crashing.
