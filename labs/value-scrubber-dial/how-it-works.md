The dial is a fixed playhead over a ruler that slides under it. One motion value, `pos`, is the whole state: a continuous position in value units. Everything else is derived from it.

- **Dragging:** pointer movement becomes `pos -= dx / spacing`, so dragging left raises the value. Past either end the position resists at 35% and springs back on release.
- **Release:** the pointer's velocity is projected 120ms ahead, then a spring settles on the nearest whole value (or glides on, with `snap` off). Arrow keys, Home, End and Page keys move the value too.
- **Ticks:** each tick turns its distance from `pos` into a height on a bell curve, so the ruler swells under the playhead, and into an opacity that fades toward the edges. A mask fades the ends of the ruler.
- **Odometer:** each digit is a column of 0–9 shifted by a spring. Blur follows the spring's velocity, so a fast roll smears and a slow one stays crisp. A vertical mask fades the numerals at the top and bottom of the window.
- **Playhead:** the pill and stem are one SVG path, so the stem flares into the pill instead of being two shapes stacked.
