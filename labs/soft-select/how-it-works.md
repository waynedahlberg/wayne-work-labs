The menu is not a popover library: it is an absolutely positioned `ul` that animates out of its own trigger.

- **Origin-aware open:** the menu scales from `0.92` with `transform-origin: top center`, so it reads as growing out of the button. The exit is quicker than the entrance.
- **Gliding highlight:** one `layoutId` span is rendered inside whichever row is active. Motion animates it between rows, so the highlight travels instead of blinking off and on.
- **Stagger:** each row fades in with a delay of `index × stagger`.
- **Keyboard:** arrows move the active row, Enter picks it, Escape closes. Clicking outside closes too.
