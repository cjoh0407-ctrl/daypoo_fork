# Admin Page UI/UX Redesign Plan

## 1. Growth Engine Report Chart Redesign
Current state: The chart looks sparse when data points are few. The giant "1" on the left is disconnected from the design.

### Improvements
- **Enhanced Visuals**
  - Add a `glow` behavior to the `Area` line using `filter`.
  - Increase `strokeWidth` for a more premium look.
  - Add a `background` mesh or a more detailed `CartesianGrid`.
  - Add `dots` with a pulse animation to each data point.
- **Improved Information**
  - Add "Peak" and "Current" badges directly on the chart line or as markers.
  - Improve the `motion.div` displaying the current value (the giant "1") to be part of a "Control Center" or "Status Bar" aesthetic rather than just floating.
- **Mock Data Enhancement**
  - If real data is sparse, ensure the "30D" simulation is more realistic or smoother.

## 2. Premium Shop Item Consistency
Current state: The icon background sizes are inconsistent.

### Improvements
- **Stable Background**
  - Replace `bg-black/[0.02]` with hardcoded `#F7F8F8`.
  - Use a fixed inner container size (e.g., `w-32 h-32` or similar) inside the `aspect-square` parent to ensure ALL icon backgrounds look identical regardless of the image content.
  - Ensure `isEmoji` items and `img` items use the exact same background container geometry.

## 3. Implementation Steps
1. Modify `AdminPage.tsx`:
   - Update `DashboardView` chart rendering.
   - Update `StoreView` item card rendering.
2. Verify:
   - Check the visual balance on different screen sizes.
3. Documentation:
   - Log changes in `docs/frontend-modification-history.md`.
