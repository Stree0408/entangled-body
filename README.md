# Entangled Body

An interactive quantum-inspired art system that allows users to experience the human body as an interconnected, non-local system.

---

## 🧠 Concept

This project is inspired by traditional East Asian medicine, where treatment is applied not directly to the painful area, but to a connected region of the body.

We extend this idea into a quantum-inspired framework:

> The human body is not a collection of independent parts, but a single entangled system.

Instead of explaining quantum concepts, this project allows users to *experience* them through interaction.

---

## ⚛️ Core Experience

### 1. Superposition
- The body is not clearly defined.
- Point clouds form ambiguous structures.
- From certain angles, a human shape emerges — from others, it dissolves.

### 2. Measurement
- User interaction acts as "observation".
- Hovering or focusing on a region changes the system state.

### 3. Entanglement
- Body regions are non-locally connected.
- Interacting with one part triggers reactions in distant parts.

### 4. Probabilistic Behavior
- The same interaction does not always produce the same result.
- Each session generates a different structure.

### 5. Collapse
- Upon interaction (click), the system converges.
- Scattered points align into a coherent human form.

---

## 🎮 MVP Features

- Point cloud-based human visualization
- View-dependent structure visibility
- Hover interaction with local + non-local responses
- Entangled cluster connections (visualized with lines)
- Click-triggered collapse animation

---

## 🛠 Tech Stack

- **Frontend**: Next.js, React
- **3D Rendering**: Three.js, React Three Fiber
- **Graphics**: Canvas API
- **Future Integration**:
  - Qiskit (quantum circuit generation)
  - IonQ (quantum execution)

---

## 🧪 Quantum Integration (Planned)

Currently, randomness is generated using `Math.random()`.

In future versions:
- Entanglement maps will be generated using quantum circuits
- Collapse states will be sampled from quantum measurement outcomes
- System behavior will be influenced by real quantum distributions

---

## 📦 Installation

```bash
git clone https://github.com/your-repo/entangled-body
cd entangled-body
npm install
npm run dev
