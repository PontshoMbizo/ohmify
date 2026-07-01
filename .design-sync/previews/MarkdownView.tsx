import { MarkdownView } from 'scope.io';

const sampleMd = `## RC Low-Pass Filter

Design a first-order RC low-pass filter with cutoff frequency **1 kHz**.

### Transfer Function

The cutoff frequency is given by:

$$f_c = \\frac{1}{2\\pi RC}$$

### Component Selection

| Component | Value | Tolerance |
|-----------|-------|-----------|
| Resistor  | 15.9 kΩ | ±1% |
| Capacitor | 10 nF | ±5% |

### Design Notes

- Use standard E24 resistor values where possible
- The output is measured across the capacitor
- At \\(f_c\\) the output voltage drops to \\(-3\\text{ dB}\\)
`;

export const ProblemStatement = () => <MarkdownView>{sampleMd}</MarkdownView>;

export const ShortText = () => (
  <MarkdownView>
    {`## Objective\n\nBuild a **voltage divider** using two resistors with ratio 2:1.\nThe output should be exactly 3.3 V from a 5 V supply.`}
  </MarkdownView>
);
