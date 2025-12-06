
# Contributing to CatCode 🐾

Thank you for your interest in contributing to **CatCode**! This project is a 3D browser-based game for learning Data Structures & Algorithms through interactive, story-driven levels.

We welcome all kinds of contributions — from new gameplay levels to engine features and UI improvements.

---

## 🚀 How to Contribute

1. **Fork the Repository**
   - Click the “Fork” button on GitHub.

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/CraigMLdsouza/CatCode.git
   cd catcode
   ```

3. **Create a New Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   - Add your feature, level, or fix.

5. **Commit Your Changes**
   ```bash
   git commit -m "feat: add new level for stacks"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Go to GitHub and open a PR into `main`.

---

## 📁 Project Structure

```
src/
 ├── purr/        # Game engine (core rendering, input, loop)
 ├── game/        # Player, camera, physics, cat model
 ├── levels/      # All playable DSA levels (1 file per level)
 ├── ui/          # HUD, code editor, menu, shop
 ├── services/    # Skins, coins, persistence
 └── main.js      # App entry point
```

---

## 🧱 Creating a New Level

1. Create a file inside:
   ```
   src/levels/yourLevelName.js
   ```

2. Export a `meta` object and `createLevel()` function.

3. Register your level in:
   ```
   src/levels/index.js
   ```

4. Follow the structure of existing levels:
   - `arrays01.js`
   - `arrays02.js`

Each level may define:
- `build(engine, services)`
- `update(dt, engine, services)`
- `runUserCode(...)`
- `hint(editor)`
- `explain(editor)`
- `destroy(engine)`

---

## ✅ Coding Guidelines

- Keep code modular and readable
- Avoid hardcoding values across files
- Follow existing file structure
- Do not modify the engine (`src/purr`) without discussion
- Use meaningful commit messages
- Test your changes before submitting

---

## 🐛 Reporting Bugs

Open a GitHub Issue and include:
- What happened
- Steps to reproduce
- Expected behavior
- Screenshots (if possible)

---

## 💡 Feature Requests

We welcome feature ideas:
- New game mechanics
- Visual improvements
- More DSA topics (trees, graphs, DP, etc.)

Submit them via GitHub Issues as **Feature Requests**.

---

## 🔐 Branch Protection

- `main` is protected
- All changes must come through Pull Requests
- No force-pushes are allowed
- At least one review is required before merge

---

## 🙌 Code of Conduct

Be respectful, inclusive, and constructive. This is a learning-focused open-source project.

Harassment, hate speech, or disrespectful behavior will not be tolerated.

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Happy hacking, and welcome to the CatCode community! 😺
