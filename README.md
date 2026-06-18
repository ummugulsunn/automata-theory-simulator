<div align="center">

# Automata Theory Simulator

**An advanced, interactive web-based simulator designed to visualize and test computational models from Automata Theory and Formal Languages.**

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License: MIT" />
</p>

### [Live Demo / Web App](https://ummugulsunn.github.io/automata-theory-simulator/)

Built purely with native web technologies (ES6+ JS, CSS Variables, and HTML5), this Single-Page Application (SPA) allows students and instructors to build, trace, and convert finite machines dynamically.

</div>

---

## Features

- **Premium Visual Style:** Engineered with a sleek **glassmorphism UI layout**, glowing neon accents, and clean workspace separation.
- **Fluid Physics Solver:** Utilizes `vis-network` configured with a `barnesHut` physics engine and `avoidOverlap: 1` settings to prevent overlapping nodes and maintain an elegant graph shape.
- **Instant Quick Load:** Selected presets can be instantly loaded into the simulation workspace with a single click using the **Quick Load** header button.
- **Serverless SPA:** 100% client-side. Zero external framework dependencies (React/Vue/Angular not required). Can be run in any browser instantly.

## Screenshots

| Main Workspace (Glassmorphism Dark Theme) | Step-by-Step Execution Trace |
| :---: | :---: |
| ![Main Workspace](docs/screenshots/main_interface.png?v=2) | ![Trace Steps](docs/screenshots/step_trace.png?v=2) |

---

## Supported Computational Models

The simulator dynamically models four distinct levels of the Chomsky hierarchy:

### 1. Deterministic Finite Automaton (DFA)
Defined by the 5-tuple: $M = (Q, \Sigma, \delta, q_0, F)$
- Simulates standard deterministic transitions.
- Highlights traps/dead states.
- Supports minimization.

### 2. Nondeterministic Finite Automaton (NFA)
Defined by the 5-tuple: $M = (Q, \Sigma, \delta, q_0, F)$
- Supports **$\epsilon$-transitions** (represented as `ε` or `Λ`).
- Tracks multiple active states simultaneously on the graph.
- Computes epsilon closures in real-time.

### 3. Pushdown Automaton (PDA)
Defined by the 7-tuple: $M = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$
- Simulates context-free languages.
- Features a dynamic **Stack Visualization panel** displaying stack changes (Push/Pop) at each execution step.
- Operates under LIFO (Last-In-First-Out) rules.

### 4. Turing Machine (TM)
Defined by the 7-tuple: $M = (Q, \Sigma, \Gamma, \delta, q_0, \square, F)$
- Simulates unrestricted grammars.
- Features an **infinite interactive tape panel** with visual read/write head movements (Left `L` / Right `R` / Stay `S`).
- Supports complex arithmetic, string modifications, and deletions.

---

## Advanced Conversion & Minimization Tools

The simulator features a built-in **Dönüşüm Araçları (Conversion Tools)** engine to bridge the gap between theory and practical assignments:

- **NFA $\rightarrow$ DFA (Subset Construction):**
  - Computes the **$\epsilon$-closure** for all states in the NFA.
  - Generates a step-by-step **Alt Küme Yapılandırma Tablosu (Subset Construction Table)** detailing transition subsets.
  - Converts the result into a fully functional DFA and loads it directly into the graph viewer.

- **DFA Minimization:**
  - Removes unreachable states.
  - Groups equivalent states using equivalence partitioning.
  - Redraws the optimized minimal state diagram.

---

## Academic Example Library

This project has been tailored specifically around classic midterm, final, and quiz questions from university Automata Theory curricula. It includes **over 40+ preconfigured presets**:

### DFA & NFA Presets
- **$n(0) \pmod 2 = 0$:** Evaluates strings with an even number of zeros.
- **$(0|1)^*01$:** Identifies strings ending in `01`.
- **$0^*1^*$:** Evaluates strings where all zeros precede ones.
- **$\text{ba}(a|b)^*\text{aab}$:** Strings starting with `ba` and ending with `aab`.
- **$(a|b)^*abb(a|b)^* \text{ and } (a|b)^*aab(a|b)^*$:** Substring recognition patterns.

### PDA Presets (Context-Free Grammar Matches)
- **$a^n b^n$:** Equal numbers of sequential $a$'s and $b$'s.
- **$w c w^R$:** Palindromes separated by $c$.
- **$a^k b^{2k} dd$:** Double matching algorithm with ending delimiter $dd$.
- **$a^i b^{i+j} c^j$:** Combined stack match (number of $b$'s equals sum of $a$'s and $c$'s).
- **$a^n b^k c^k d^n ee$:** Nested bracket matching.
- **$S \to (S) | SS | \epsilon$:** Balanced parenthesis parser.

### Turing Machine Presets (Arithmetic & Transformations)
- **$f(n) = n + 1$:** Binary incrementer.
- **$f(n,m) = n - m$:** Unary subtraction.
- **$w \to ww$:** String copier.
- **$w \to w^R$:** In-place or concatenated string reversing.
- **$c \to d$:** String scanner and character replacer.
- **$w \to \epsilon$:** Tape eraser.

---

## How to Access & Run

### 1. Live Web Version (Recommended)
You can directly access and use the simulator from any device without installing anything:
**[👉 Launch Automata Theory Simulator 👈](https://ummugulsunn.github.io/automata-theory-simulator/)**

### 2. Run Locally
If you want to run the project locally or modify the code:

```bash
git clone https://github.com/ummugulsunn/automata-theory-simulator.git
cd automata-theory-simulator
```

### Start a Local Server
Although you can open `index.html` directly, serving it locally is recommended for managing resources:

**Using Python 3:**
```bash
python3 -m http.server 8080
```

**Using Node.js:**
```bash
npx http-server -p 8080 .
```

Open `http://localhost:8080` in your web browser.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
