# Presentation Sample

---

# Heading 1 (title)

## Heading 2

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Heading 3

**This is bold text.**

_This is italic text._

---

# List

- Lorem ipsum dolor sit amet
- Consectetur adipiscing elit
  - Integer molestie lorem at massa

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

---

# Table

| Option | Description                     |
| ------ | ------------------------------- |
| hoge   | Lorem ipsum dolor sit amet      |
| fuga   | Consectetur adipiscing elit     |
| piyo   | Integer molestie lorem at massa |

---

# Code

This is `inline code` .

```javascript
const sayHello = (name) => {
  console.log(`Hello ${name}`.);
}

sayHello("John");
```

---

# Image

![h:180](./assets/images/sample.jpg)

<https://rnavi.ndl.go.jp/imagebank/index.html>

---

![bg cover brightness:3 blur:30px](./assets/images/sample.jpg)

# Image - background

`![bg cover brightness:3 blur:30px](./assets/images/sample.jpg)`

---

![bg right:33%](./assets/images/sample.jpg)

# Image - background split

`![bg right:33%](./assets/images/sample.jpg)`

---

# Note

::: note tip

### Tip

tip.
:::

::: note info

### Info

info.
:::

::: note warning

### Warning

warning.
:::

::: note danger

### Danger

danger
:::

---

# PlantUML

```plantuml
@startuml

Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response

Alice -> Bob: Another authentication Request
Alice <-- Bob: Another authentication Response

@enduml
```
