# Commerce Visibility Copilot Design

See the user-facing MVP spec:

`outputs/commerce-visibility-copilot-mvp-spec.md`

This design locks the first version as:

```text
Chrome extension side panel + lightweight Web App
Scan -> Score -> Fix with Claude/Codex -> Check -> Publish
```

The MVP intentionally avoids store OAuth, automatic write-back, and Computer Use as default flows. Those are future guided or agent modes after the product proves value with low-friction scanning and prompt generation.
