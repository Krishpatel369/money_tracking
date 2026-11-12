<div align="center">

# 🪙 Paisa Tracker

### *Every rupee has a story. Track yours.*

A tiny, zero-dependency money tracker that lives in your browser: log expenses, split bank vs cash, and export clean PDF reports. 💸

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![No Backend](https://img.shields.io/badge/backend-none-brightgreen)
![Privacy](https://img.shields.io/badge/data-stays%20on%20your%20device-blue)

</div>

---

## ✨ Why Paisa Tracker?

Most expense apps want a login, a subscription and your data on someone else's server. **Paisa Tracker wants none of that.** Open the page, add a transaction, done. Everything is stored locally in your browser. 🔒

| | Feature | What it does |
|---|---|---|
| ➕ | **Quick add** | Log an expense or income with amount, date, category, bank/cash and an optional note |
| 📅 | **Monthly view** | Pick any month and see income, spending and balance instantly |
| 🏦 | **Bank vs Cash split** | Know exactly how much sits in your account and how much in your wallet |
| 📊 | **Category bars** | See where the money goes, sorted from biggest to smallest |
| 🧾 | **PDF reports** | Preview and download a **daily** or **monthly** report as a styled PDF |
| 🌗 | **Dark mode** | Follows your device theme automatically |
| 📱 | **Mobile friendly** | Responsive layout with safe-area support for phones |
| 🇮🇳 | **Indian formatting** | Amounts shown in ₹ with Indian digit grouping (e.g. ₹1,23,456) |

---

## 🖼️ Screenshots

> 📸 *Add your screenshots here, for example:*
>
> `![Dashboard](screenshots/dashboard.png)`

---

## 🚀 How to Run

There is **no build step, no npm install, no server needed.** 🎉

### Option 1: Just open it (easiest) 👆

1. Download or clone this repo
2. Double-click **`index.html`**
3. Start tracking!

### Option 2: Clone with Git 🧑‍💻

```bash
git clone https://github.com/<your-username>/paisa-tracker.git
cd paisa-tracker
```

Then open `index.html` in any modern browser.

### Option 3: Run on a local server 🌐

Handy if you want to test on your phone over Wi-Fi.

```bash
# Python 3
python -m http.server 8000

# or Node.js
npx serve .
```

Visit **http://localhost:8000** 🎯

### Option 4: Host it free on GitHub Pages ☁️

1. Push the project to GitHub
2. Go to **Settings → Pages**
3. Under *Source*, choose your `main` branch and the `/ (root)` folder
4. Save, and your tracker is live at `https://<your-username>.github.io/paisa-tracker/`

> ⚠️ **Note:** PDF export loads the [jsPDF](https://github.com/parallax/jsPDF) library from a CDN, so you need an internet connection the first time you generate a report. Everything else works offline.

---

## 🧭 How to Use

1. **Pick a type**: tap **Expense** or **Income** 🔁
2. **Fill in the details**: amount, date, category, Bank or Cash, and an optional note 📝
3. **Tap "Save transaction"** 💾
4. **Watch the dashboard update**: balance, income, spent, in bank, in cash 📈
5. **Switch months** using the month picker at the top 🗓️
6. **Generate a report**:
   - Choose a date under *Download reports*
   - Click **Preview daily report** or **Preview monthly report** (the monthly one uses the month selected at the top)
   - Review the preview, then click **Download PDF** 📥
7. **Made a mistake?** Tap the **×** next to any transaction to delete it 🗑️

### 🏷️ Built-in categories

| 💸 Expense | 💰 Income |
|---|---|
| Food · Travel · Rent · Bills · Shopping · Health · Study · Other | Salary · Freelance · Gift · Other |

Want your own? Edit the `CATS` object at the top of `script.js`. ✏️

---

## 📁 File Structure

```text
paisa-tracker/
├── 📄 index.html   → Page structure and layout
├── 🎨 style.css    → All styling, including dark mode
└── ⚙️ script.js    → App logic, storage and PDF generation
```

### 📄 `index.html`: the skeleton
Defines every section of the app: the balance card, the *Add a transaction* form, the *Spending by category* panel, the *Download reports* area and the *Transactions* list. It also loads jsPDF from the cdnjs CDN and then your `script.js`.

### 🎨 `style.css`: the look
- **CSS variables** (`--bg`, `--ink`, `--in`, `--out`, `--acc`…) control the whole colour palette in one place 🎨
- A `prefers-color-scheme: dark` block gives automatic dark mode 🌙
- Flexbox and grid keep it responsive on every screen size 📱
- Visible `:focus-visible` outlines keep it keyboard accessible ♿

### ⚙️ `script.js`: the brain
| Part | Responsibility |
|---|---|
| `CATS` | Category lists for expenses and income |
| `fmt()` / `rs()` | Currency formatting (`₹` on screen, `Rs.` inside PDFs) |
| `save()` + `localStorage` | Persists all transactions under the key `paisa` |
| `render()` | Recalculates and redraws the balance, category bars and transaction list |
| `calc()` | Totals income, spending and the bank/cash split |
| `catTotals()` | Groups and sorts spending by category |
| `preview()` | Builds the on-screen daily or monthly report preview |
| `makePdf()` | Draws the styled PDF with jsPDF and triggers the download |
| `esc()` | Escapes user notes so they can't inject HTML 🛡️ |

---

## 🧠 How It Works Under the Hood

```text
  ┌──────────────┐    save()     ┌──────────────────┐
  │  Add form    │ ────────────▶ │   localStorage   │
  └──────────────┘               │   key: "paisa"   │
         ▲                       └────────┬─────────┘
         │ render()                       │ load on start
  ┌──────┴───────┐                        ▼
  │  Dashboard   │ ◀──────────── tx[] (array in memory)
  └──────┬───────┘
         │ preview() → makePdf()
         ▼
  ┌──────────────┐
  │  PDF report  │ 📥
  └──────────────┘
```

Each transaction is saved as a small object:

```js
{
  id: 1731417600000,   // timestamp, used for deleting and sorting
  type: "out",         // "out" = expense, "in" = income
  a: 250,              // amount in ₹
  cat: "Food",
  mode: "Bank",        // "Bank" or "Cash"
  note: "Lunch",
  date: "2026-11-12"
}
```

---

## 🔐 Privacy

- 🚫 No accounts, no tracking, no analytics
- 💾 Data is stored **only in your browser's `localStorage`**
- ⚠️ Clearing site data or switching browsers/devices means your data won't follow you, so download your monthly PDFs as backups

---

## 🛠️ Tech Stack

- **HTML5**, **CSS3**, **Vanilla JavaScript** (no frameworks)
- [**jsPDF 2.5.1**](https://github.com/parallax/jsPDF) for PDF export

---

## 🗺️ Ideas for the Future

- [ ] 📤 Export / import data as JSON or CSV
- [ ] 🎯 Monthly budgets per category
- [ ] 🥧 Charts and spending trends
- [ ] 🔁 Recurring transactions
- [ ] 📴 PWA support for installable offline use

---

## 🤝 Contributing

Contributions, issues and feature ideas are welcome! 🙌

1. 🍴 Fork the repo
2. 🌿 Create a branch: `git checkout -b feature/cool-idea`
3. 💾 Commit your changes: `git commit -m "Add cool idea"`
4. 🚀 Push and open a Pull Request

---

## 📜 License

Released under the **MIT License**. Free to use, modify and share. Add a `LICENSE` file to make it official. 📝

---

<div align="center">

**Made with ❤️ and a lot of ☕ in India 🇮🇳**

⭐ *If this helped you save a few rupees, give it a star!* ⭐

</div>
