const STORAGE_KEY = 'flashcards.deck';
const THEME_KEY = 'flashcards.theme';

const themeToggle = document.getElementById('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

// The user's saved choice ('light' or 'dark'), or null to follow the system.
function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch (err) {
    console.warn('Could not load theme:', err);
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    // The switch still works for this visit; it just won't be remembered.
    console.warn('Could not save theme:', err);
  }
}

function applyTheme(theme) {
  if (theme) {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
  updateThemeToggle();
}

function currentTheme() {
  return document.documentElement.dataset.theme || (systemDark.matches ? 'dark' : 'light');
}

// The button offers the theme you would switch to.
function updateThemeToggle() {
  const isDark = currentTheme() === 'dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
  themeToggle.querySelector('.theme-label').textContent = isDark ? 'Light mode' : 'Dark mode';
}

themeToggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
});

// Keep the button label right if the system theme changes and no choice is saved.
systemDark.addEventListener('change', updateThemeToggle);

applyTheme(loadTheme());

const form = document.getElementById('card-form');
const questionInput = document.getElementById('question');
const answerInput = document.getElementById('answer');
const formMessage = document.getElementById('form-message');
const cardList = document.getElementById('card-list');
const cardCount = document.getElementById('card-count');
const emptyState = document.getElementById('empty-state');
const deckHeading = document.getElementById('deck-heading');
const deckMessage = document.getElementById('deck-message');

let deck = loadDeck();

// The id of the card currently asking "Delete this card?", or null.
let confirmingId = null;

// Read the deck from localStorage. Falls back to an empty deck if storage
// is unavailable or the saved data is corrupted.
function loadDeck() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Could not load deck:', err);
    showMessage('Your saved cards could not be loaded, so you are starting with an empty deck.', 'error');
    return [];
  }
}

// Returns true if the deck was saved, false otherwise. Errors are shown
// in messageEl so they appear next to what the user just did.
function saveDeck(messageEl = formMessage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    return true;
  } catch (err) {
    console.error('Could not save deck:', err);
    if (err.name === 'QuotaExceededError') {
      showMessage('Storage is full. Delete some cards and try again.', 'error', messageEl);
    } else {
      showMessage('Your changes could not be saved. Your browser may be blocking storage.', 'error', messageEl);
    }
    return false;
  }
}

function showMessage(text, type, messageEl = formMessage) {
  messageEl.textContent = text;
  messageEl.className = 'message' + (type ? ' ' + type : '');
}

function createButton(label, action, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function focusCardButton(id, action) {
  const item = [...cardList.children].find((el) => el.dataset.id === id);
  item?.querySelector(`[data-action="${action}"]`)?.focus();
}

function deleteCard(id) {
  const index = deck.findIndex((card) => card.id === id);
  if (index === -1) return;

  const [removed] = deck.splice(index, 1);
  confirmingId = null;

  if (!saveDeck(deckMessage)) {
    // Put the card back so the list matches what is actually saved.
    deck.splice(index, 0, removed);
    renderDeck();
    return;
  }

  renderDeck();
  showMessage('', '');
  showMessage('Card deleted.', 'success', deckMessage);
  deckHeading.focus();
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function renderDeck() {
  cardList.innerHTML = '';

  deck.forEach((card) => {
    const item = document.createElement('li');
    item.className = 'card-item';
    item.dataset.id = card.id;

    const front = document.createElement('p');
    front.className = 'card-side';
    front.innerHTML = '<span class="side-label">Q:</span> ';
    front.append(card.question);

    const back = document.createElement('p');
    back.className = 'card-side';
    back.innerHTML = '<span class="side-label">A:</span> ';
    back.append(card.answer);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    if (card.id === confirmingId) {
      const prompt = document.createElement('span');
      prompt.className = 'confirm-text';
      prompt.textContent = 'Delete this card?';
      actions.append(
        prompt,
        createButton('Delete', 'confirm-delete', 'btn-small btn-danger'),
        createButton('Cancel', 'cancel-delete', 'btn-small')
      );
    } else {
      const deleteButton = createButton('Delete', 'delete', 'btn-small');
      deleteButton.setAttribute('aria-label', `Delete card: ${card.question}`);
      actions.append(deleteButton);
    }

    item.append(front, back, actions);
    cardList.append(item);
  });

  emptyState.hidden = deck.length > 0;
  cardCount.textContent = deck.length ? `(${deck.length})` : '';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  questionInput.classList.toggle('invalid', !question);
  answerInput.classList.toggle('invalid', !answer);

  if (!question || !answer) {
    showMessage('Please fill in both the question and the answer.', 'error');
    (question ? answerInput : questionInput).focus();
    return;
  }

  const card = { id: createId(), question, answer, status: 'learning' };
  deck.push(card);

  if (!saveDeck()) {
    deck.pop();
    return;
  }

  form.reset();
  questionInput.focus();
  showMessage('Card added.', 'success');
  showMessage('', '', deckMessage);
  renderDeck();
});

// One listener handles the Delete / confirm / Cancel buttons on every card.
cardList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.closest('.card-item').dataset.id;

  if (button.dataset.action === 'delete') {
    confirmingId = id;
    renderDeck();
    focusCardButton(id, 'cancel-delete');
  } else if (button.dataset.action === 'cancel-delete') {
    confirmingId = null;
    renderDeck();
    focusCardButton(id, 'delete');
  } else if (button.dataset.action === 'confirm-delete') {
    deleteCard(id);
  }
});

// Escape cancels a pending delete.
cardList.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || confirmingId === null) return;
  const id = confirmingId;
  confirmingId = null;
  renderDeck();
  focusCardButton(id, 'delete');
});

// Clear the red border as soon as the user starts typing.
[questionInput, answerInput].forEach((input) => {
  input.addEventListener('input', () => input.classList.remove('invalid'));
});

renderDeck();
