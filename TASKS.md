Here is your updated **task.md**. I have reorganized it to reflect the current state of the project, marking finished items as "DONE" and adding the new requirements for SRAM payloads, completion logic, and Firestore integration we just developed.

---

# Tasks to-do (Updated 2026-02-28)

## 1. Create Problem Page

* Created normal data collection fields and simulator instances.
* **DONE**: Use export circuit to save templates.
* **DONE**: Collect simulation data at the end (captured as newline-separated strings).
* **DONE**: Connect to Firestore database (Problems collection + solutionWaveform sub-collection).

## 2. Automarker & Verification

* **DONE**: Check sampler integrity (Ensured sampleCount and timeStep are configurable).
* **DONE**: Categorize problems into three distinct validation modes: `Load`, `Signal`, and `Digital`.
* **NB**: Storing large simulation files as text strings in Firestore sub-collections.

#### Verification Methods:

* **Power Electronics & Wave-shaping (`load`)**:
* Compare time-domain waveforms using Normalized RMSE.
* **DONE**: Testbench loads (No-load, Max, Min) correctly trigger three distinct captures.


* **Frequency Domain & DSP (`signal`)**:
* **DONE**: Single-test capture for complex waveshaping.
* Implement Bode plot comparisons (Magnitude/Phase) side-by-side in Results.


* **Digital Systems/Electronics (`digital`)**:
* **DONE**: Sample logic transitions based on decimal output of labeled nodes.
* **DONE**: Create a "Golden Standard" table from address-indexed SRAM maps.
* **DONE**: Plot logic analyzer graphs (stepped lines) on the X-axis (Cycles).



## 3. User Experience & Persistence (NEW)

* **DONE**: Implement `DigitalDataBlock` for SRAM payload copy-pasting.
* **DONE**: Separate technical payloads from the markdown description.
* **DONE**: Add "Jump to Payloads" anchor link logic.
* **DONE**: Create `completedProblems` array on the User document.
* **DONE**: Mark problem as complete in Firestore when all test cases pass.
* **DONE**: Display completion checkmarks in `ProblemList` based on `completedIds` prop.

## 4. Pending / Next Steps

* Finalize `gradeDigital` bit-packing comparison logic.
* Add SRAM payload format validation in Creator Studio.
* Implement "Global Progress" stats in the `Drawer` or Navbar.
